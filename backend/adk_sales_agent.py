import sys
import json
import logging
import asyncio
import os
from typing import Optional, Dict, Any
from tenacity import retry, wait_random_exponential, stop_after_attempt

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    supabase_client: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
except ImportError:
    supabase_client = None

try:
    from google import genai
    from google.cloud import aiplatform_v1beta1 as aip
    from dotenv import load_dotenv
    load_dotenv()
    try:
        gemini_client = genai.Client()
    except ValueError:
        gemini_client = None
except ImportError:
    gemini_client = None

try:
    from google.genai import types
    from google.adk.agents import Agent
    from google.adk.agents.llm_agent import LlmAgent
    from google.adk.runners import Runner, InMemoryRunner
    from google.adk.sessions import InMemorySessionService
    from firestore_session_service import FirestoreSessionService
    from google.adk.apps import App
    from google.adk.tools.tool_context import ToolContext
    from google.adk.tools.base_tool import BaseTool
    from google.adk.models.google_llm import Gemini
    from google.adk.agents.callback_context import CallbackContext
    from google.adk.models.llm_request import LlmRequest
    from google.adk.models.llm_response import LlmResponse
    from google.adk.tools.mcp_tool import McpToolset
    from google.adk.tools.mcp_tool.mcp_session_manager import StdioConnectionParams, StreamableHTTPConnectionParams
    from google.adk.tools import VertexAiSearchTool
    from google.adk.tools.retrieval.vertex_ai_rag_retrieval import VertexAiRagRetrieval
    from google.adk.agents.readonly_context import ReadonlyContext
    from google.adk.integrations.agent_registry import AgentRegistry
    from google.genai import types
    from vertexai.preview import rag
    from mcp import StdioServerParameters
    from pydantic import BaseModel, Field
    import httpx
    import google.auth
    from google.auth.transport.requests import Request
    import stripe
    ADK_AVAILABLE = True
    
    class PitchOutput(BaseModel):
        subject: str = Field(description="Agresywny biznesowo temat e-maila w języku polskim")
        body: str = Field(description="Główna treść e-maila ukierunkowana wyłącznie na umówienie spotkania")
        pain_point_used: str = Field(description="Krótki opis, w jaki punkt bólu uderzono")
except ImportError as e:
    import logging
    logging.warning(f"ADK package (google.adk) not found. Uruchamiam mock agenta ADK. Details: {e}")
    ADK_AVAILABLE = False

# Wymuszenie trybu MOCK z powodu wyczerpania darmowego limitu 20 zapytań/dzień zostało wyłączone po autoryzacji gcloud

# --- Callbacks / Guardrails ---

def bouncer_guardrail(callback_context: CallbackContext, llm_request: LlmRequest) -> Optional[LlmResponse]:
    """Zatrzymuje pytania o konkurencję zanim trafią do LLM."""
    last_user_message_text = ""
    if llm_request.contents:
        for content in reversed(llm_request.contents):
            if content.role == 'user' and content.parts:
                if content.parts[0].text:
                    last_user_message_text = content.parts[0].text
                    break
    
    banned_competitors = ["salesforce", "hubspot", "pipedrive", "zoho"]
    text_lower = last_user_message_text.lower()
    
    for competitor in banned_competitors:
        if competitor in text_lower:
            print(f"--- Bouncer Guardrail: Wykryto zakazanego leada ({competitor}). Blokada! ---", file=sys.stderr)
            callback_context.state["banned_competitor_triggered"] = True
            return LlmResponse(
                content=types.Content(
                    role="model",
                    parts=[types.Part(text=f"Polityka WFP CRM: Nie przygotowujemy pitchów dla bezpośredniej konkurencji ({competitor.capitalize()}).")],
                )
            )
    return None

def quality_check_tool_guardrail(tool: BaseTool, args: Dict[str, Any], tool_context: ToolContext) -> Optional[Dict]:
    """Blokuje narzędzie `check_lead_score` jeśli nazwa firmy jest pusta lub za krótka."""
    if tool.name == "check_lead_score":
        company = args.get("company_name", "")
        if not company or len(company) < 2:
            print(f"--- Tool Guardrail: Błąd jakości danych. Nazwa firmy za krótka: '{company}' ---", file=sys.stderr)
            tool_context.state["invalid_company_tool_triggered"] = True
            return {
                "status": "error",
                "error_message": "Nazwa firmy jest nieprawidłowa (zbyt krótka). Przerwij proces profilowania."
            }
    return None

# --- Narzędzia ze stanem ---

def check_lead_score(company_name: str, tool_context: ToolContext) -> dict:
    """Sprawdza AI lead score i pain points firmy. Zapisuje wynik do stanu sesji."""
    print(f"--- Tool: check_lead_score uruchomione dla {company_name} ---", file=sys.stderr)
    result = {
        "status": "success",
        "company": company_name,
        "pain_points": ["niskie konwersje", "wyciek leadów", "rozproszone narzędzia"],
        "lead_score": 85
    }
    # Zapisz w stanie dla wygody
    tool_context.state["current_lead_profile"] = result
    print(f"--- Tool: Zapisano profil do tool_context.state ---", file=sys.stderr)
    return result

def search_sales_knowledge(query: str, tool_context: ToolContext) -> str:
    """Wyszukuje argumenty sprzedażowe w wektorowej bazie wiedzy (Supabase RAG)."""
    print(f"--- Tool: search_sales_knowledge dla query: {query[:30]}... ---", file=sys.stderr)
    if not supabase_client or not gemini_client:
        return "Błąd: Brak klienta Supabase lub Google GenAI. Konfiguracja RAG jest niepełna."
    
    try:
        response = gemini_client.models.embed_content(
            model='text-embedding-004',
            contents=query,
        )
        embedding = response.embeddings[0].values
        
        rpc_response = supabase_client.rpc('hybrid_search', {
            'query_text': query,
            'query_embedding': embedding,
            'match_count': 3
        }).execute()
        
        results = rpc_response.data
        if not results:
            return "Brak pasujących materiałów w bazie wiedzy."
            
        context = []
        for row in results:
            context.append(f"- {row.get('content')} (Trafność: {row.get('similarity'):.2f})")
            
        final_context = "\n".join(context)
        tool_context.state["last_knowledge_search"] = final_context
        return final_context
    except Exception as e:
        err = f"Błąd podczas wyszukiwania w bazie wiedzy: {str(e)}"
        print(err, file=sys.stderr)
        return err

def szukaj_w_sieci(zapytanie: str, tool_context: ToolContext) -> str:
    """Przeszukuje Google w poszukiwaniu aktualnych informacji."""
    print(f"--- Tool: szukaj_w_sieci dla query: {zapytanie} ---", file=sys.stderr)
    return f"Wyniki wyszukiwania dla: {zapytanie} (tu podłączasz silnik wyszukiwania)"

# --- Inicjalizacja Agentów ---

def create_sales_team():
    if not ADK_AVAILABLE:
        class MockAgent:
            def run(self, prompt: str):
                return type('Response', (), {'text': f"Mocked AI response for: {prompt[:30]}..."})()
        return MockAgent()

    # Inicjalizacja Stripe (MCP)
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "dummy_key_if_not_set")
    
    # Inicjalizacja Google Developer Knowledge (MCP)
    DEVELOPER_KNOWLEDGE_API_KEY = os.getenv("DEVELOPER_KNOWLEDGE_API_KEY", "dummy_key_if_not_set")
    
    # Inicjalizacja Vertex AI Search (Enterprise Search) ze wsparciem dla filtrów user_id
    class MyVertexAISearchTool(VertexAiSearchTool):
        def _build_vertex_ai_search_config(
            self, readonly_context: ReadonlyContext
        ) -> types.VertexAISearch:
            """Builds the VertexAISearch configuration, adding a user-specific filter."""
            config = super()._build_vertex_ai_search_config(readonly_context)
            if "user_id" in readonly_context.state:
                user_id = readonly_context.state["user_id"]
                config.filter = f'user_id: ANY("{user_id}")'
            return config

    VERTEX_DATASTORE_PATH = os.getenv("VERTEX_DATASTORE_PATH", "")
    vertex_search_tools = []
    if VERTEX_DATASTORE_PATH:
        vertex_search_tools.append(MyVertexAISearchTool(data_store_id=VERTEX_DATASTORE_PATH))
        
    RAG_CORPUS = os.getenv("RAG_CORPUS", "")
    if RAG_CORPUS:
        ask_vertex_retrieval = VertexAiRagRetrieval(
            name="retrieve_rag_documentation",
            description=(
                "Use this tool to retrieve documentation and reference materials for the question from the RAG corpus,"
            ),
            rag_resources=[rag.RagResource(rag_corpus=RAG_CORPUS)],
            similarity_top_k=10,
            vector_distance_threshold=0.6,
        )
        vertex_search_tools.append(ask_vertex_retrieval)

    google_cloud_project = os.getenv("GOOGLE_CLOUD_PROJECT")
    google_cloud_location = os.getenv("GOOGLE_CLOUD_LOCATION", "global")
    
    gemini_model = Gemini(
        model="gemini-2.5-flash", 
        client_kwargs={"vertexai": True, "project": google_cloud_project, "location": google_cloud_location}
    )

    # Sub-Agent: Profiler
    lead_qualifier = Agent(
        name="lead_qualifier_agent",
        model=gemini_model,
        mode="single_turn",
        description="Użyj tego agenta aby zbadać leada i pobrać jego profil (lead_score).",
        instruction="Twoim jedynym zadaniem jest użycie narzędzia 'check_lead_score' by pobrać profil firmy. Zwróć profil w odpowiedzi.",
        tools=[check_lead_score]
    )

    # Sub-Agent: Researcher
    knowledge_researcher = Agent(
        name="knowledge_researcher_agent",
        model=gemini_model,
        mode="single_turn",
        description="Użyj tego agenta aby wyszukać pasujące argumenty z bazy wiedzy RAG, przeszukać sieć oraz firmowy Vertex AI Datastore.",
        instruction="Twoim zadaniem jest przeszukanie bazy wiedzy narzędziem 'search_sales_knowledge' oraz 'szukaj_w_sieci'. Jeśli masz dostęp do Vertex Search, użyj go również w pierwszej kolejności do odpowiedzi na pytania bazujące na oficjalnych dokumentach.",
        tools=[search_sales_knowledge, szukaj_w_sieci] + vertex_search_tools
    )

    # Sub-Agent: Pitch Generator
    pitch_generator = Agent(
        name="pitch_generator_agent",
        model=gemini_model,
        mode="task",
        description="Użyj tego agenta aby wygenerować ostateczny ustrukturyzowany pitch sprzedażowy (JSON) i zakończyć zadanie.",
        instruction="Twoim zadaniem jest wygenerowanie struktury PitchOutput na podstawie zebranych danych. Zakończ zadanie wywołując narzędzie finish_task.",
        output_schema=PitchOutput
    )

    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "dummy_stripe_key_if_not_set")
    stripe.api_key = STRIPE_SECRET_KEY

    def czy_uzytkownik_ma_dostep(user_id: str):
        """Sprawdza w bazie danych, czy użytkownik opłacił usługę."""
        # Tu docelowo zapytanie do BigQuery lub Firestore
        return True # Placeholder

    def zainicjuj_platnosc(kwota_usd: float, opis: str, user_id: str):
        """Narzędzie do tworzenia sesji płatności dla użytkownika w Stripe."""
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'usd',
                        'product_data': {'name': opis},
                        'unit_amount': int(kwota_usd * 100),
                    },
                    'quantity': 1,
                }],
                mode='payment',
                success_url='https://wfp-crm.local/success',
                cancel_url='https://wfp-crm.local/cancel',
                metadata={'user_id': user_id}
            )
            return {"status": "success", "url": session.url}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    # Sub-Agent: Stripe (Billing / Payments)
    stripe_agent = Agent(
        model=gemini_model,
        name="stripe_agent",
        mode="chat",
        description="Tworzy sesje checkout, linki do płatności i zarządza billingiem.",
        instruction="Pomagasz w zarządzaniu kontem Stripe i pobieraniu opłat. Użyj narzędzia zainicjuj_platnosc lub zewnętrznego MCP aby wygenerować link.",
        tools=[
            czy_uzytkownik_ma_dostep,
            zainicjuj_platnosc,
            McpToolset(
                connection_params=StdioConnectionParams(
                    server_params=StdioServerParameters(
                        command="npx",
                        args=[
                            "-y",
                            "@stripe/mcp",
                            "--tools=all",
                        ],
                        env={
                            "STRIPE_SECRET_KEY": STRIPE_SECRET_KEY,
                        }
                    ),
                    timeout=30
                )
            )
        ]
    )

    # Sub-Agent: Google Developer Knowledge (MCP)
    google_knowledge_agent = Agent(
        model=gemini_model,
        name="google_knowledge_agent",
        mode="single_turn",
        description="Search Google developer documentation for implementation guidance and APIs.",
        instruction="Search Google developer documentation for implementation guidance and APIs using MCP.",
        tools=[
            McpToolset(
                connection_params=StreamableHTTPConnectionParams(
                    url="https://developerknowledge.googleapis.com/mcp",
                    headers={"X-Goog-Api-Key": DEVELOPER_KNOWLEDGE_API_KEY},
                ),
            )
        ],
    )

    # Root Agent: Dyrygent
    instruction = """
    Jesteś elitarnym łowcą spotkań B2B dla WFP CRM (OMEGA Engine).
    ZABRANIA SIĘ BEZPOŚREDNIEJ SPRZEDAŻY OPROGRAMOWANIA.
    Twoim JEDYNYM celem jest zaciekawienie odbiorcy na tyle mocno (używając zebranych przez RAG punktów bólu), by wyciągnąć od niego zgodę na 15-minutowe spotkanie z naszym konsultantem.
    Zanim wygenerujesz wiadomość:
    1. Zleć zbadanie leada do 'lead_qualifier_agent'.
    2. Jeśli wynik leada (lead_score) jest obiecujący, poproś 'knowledge_researcher_agent' o pasujące argumenty z bazy wiedzy.
    3. Na podstawie tych danych przekaż zlecenie do 'pitch_generator_agent', aby wygenerował ustrukturyzowaną wiadomość (schema PitchOutput). Krótko, do bólu pragmatycznie. Call-To-Action to ZAWSZE pytanie o 15 minut w kalendarzu.
    """
    
    class ZenekState:
        def __init__(self):
            self.historia_akcji = []

    zenek_state = ZenekState()

    def zapamietaj_akcje(akcja: str):
        """Użyj tego narzędzia, aby zapisać w pamięci (ZenekState) ważną akcję, którą właśnie wykonałeś."""
        zenek_state.historia_akcji.append(akcja)
        return "Zapamiętano."
    
    # Inicjalizacja Agent Registry (Remote A2A i zdalne MCP)
    remote_tools = []
    remote_sub_agents = []
    
    if google_cloud_project:
        try:
            def google_auth_header_provider(context):
                creds, _ = google.auth.default()
                if not creds.valid:
                    creds.refresh(Request())
                return {"Authorization": f"Bearer {creds.token}"}

            registry = AgentRegistry(
                project_id=google_cloud_project, 
                location=google_cloud_location,
                header_provider=google_auth_header_provider
            )
            
            remote_mcp_id = os.getenv("REMOTE_MCP_SERVER_ID")
            if remote_mcp_id:
                mcp_server_name = f"projects/{google_cloud_project}/locations/{google_cloud_location}/mcpServers/{remote_mcp_id}"
                remote_tools.append(registry.get_mcp_toolset(mcp_server_name=mcp_server_name))
                
            remote_agent_id = os.getenv("REMOTE_AGENT_ID")
            if remote_agent_id:
                agent_name = f"projects/{google_cloud_project}/locations/{google_cloud_location}/agents/{remote_agent_id}"
                remote_sub_agents.append(registry.get_remote_a2a_agent(agent_name=agent_name))
        except Exception as e:
            print(f"[AgentRegistry] Błąd wczytywania remote zasobów: {e}")

    # Główny Orchestrator Zespołu
    root_agent = Agent(
        model=gemini_model,
        name="omega_sales_orchestrator",
        mode="chat",
        description="Główny agent koordynujący proces sprzedaży outbound w WFP CRM.",
        instruction=instruction,
        tools=[zapamietaj_akcje] + remote_tools,
        sub_agents=[lead_qualifier, knowledge_researcher, pitch_generator, stripe_agent, google_knowledge_agent] + remote_sub_agents,
        before_model_callback=bouncer_guardrail,
        before_tool_callback=quality_check_tool_guardrail
    )
    
    return root_agent

@retry(
    wait=wait_random_exponential(multiplier=2, max=60),
    stop=stop_after_attempt(5),
    reraise=True
)
async def run_adk_agent(prompt: str) -> str:
    agent = create_sales_team()
    
    if not ADK_AVAILABLE:
        return agent.run(prompt).text
        
    try:
        session_service = FirestoreSessionService(collection_name="wfp_crm_sessions")
    except Exception as e:
        print(f"Błąd inicjalizacji FirestoreSessionService: {e}. Używam InMemorySessionService.", file=sys.stderr)
        session_service = InMemorySessionService()

    runner = Runner(agent=agent, app_name="wfp_crm_adk", session_service=session_service)
    
    # Inicjalizacja Sesji
    try:
        from google.adk.sessions import Session
        import inspect
        session = Session(app_name="wfp_crm_adk", user_id="cli_user", id="cli_session", state={"status": "initialized"})
        if inspect.iscoroutinefunction(runner.session_service.create_session):
            await runner.session_service.create_session(session=session)
        else:
            runner.session_service.create_session(session=session)
    except Exception as e:
        print(f"Session creation error with session kwarg: {e}", file=sys.stderr)
        try:
            if inspect.iscoroutinefunction(runner.session_service.create_session):
                await runner.session_service.create_session(app_name="wfp_crm_adk", user_id="cli_user", session_id="cli_session", state={"status": "initialized"})
            else:
                runner.session_service.create_session(app_name="wfp_crm_adk", user_id="cli_user", session_id="cli_session", state={"status": "initialized"})
        except Exception as e2:
            print(f"Session creation error with kwargs: {e2}", file=sys.stderr)
    
    try:
        content = types.Content(parts=[types.Part.from_text(text=prompt)])
    except AttributeError:
        content = types.Content(parts=[types.Part(text=prompt)])
        
    response_text = ""
    async for event in runner.run_async(user_id="cli_user", session_id="cli_session", new_message=content):
        if hasattr(event, "content") and event.content:
            for p in event.content.parts:
                if p.text:
                    response_text += p.text
        if hasattr(event, "model_response") and event.model_response:
             for p in event.model_response.parts:
                 if p.text:
                     response_text += p.text
                     
    # Debug: Print State (stderr)
    try:
        final_session = await session_service.get_session(app_name="wfp_crm_adk", user_id="cli_user", session_id="cli_session")
        print(f"\n--- Zakończono. Finalny Stan Sesji: {final_session.state} ---", file=sys.stderr)
    except Exception as e:
        print(f"Nie udało się pobrać stanu sesji: {e}", file=sys.stderr)
                     
    return response_text

def main():
    prompt = sys.argv[1] if len(sys.argv) > 1 else "Stwórz pitch dla firmy e-commerce z problemami w zarządzaniu leadami."
    
    if ADK_AVAILABLE:
        try:
            response_text = asyncio.run(run_adk_agent(prompt))
            print(json.dumps({"status": "success", "response": response_text}))
        except Exception as e:
            print(json.dumps({"status": "error", "response": str(e)}))
    else:
        agent = create_sales_team()
        response = agent.run(prompt)
        print(json.dumps({"status": "success", "response": response.text}))

if __name__ == "__main__":
    main()
