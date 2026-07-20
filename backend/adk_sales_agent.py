import sys
import json
import logging
import asyncio
import os
from typing import Optional, Dict, Any

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
    from google.adk.runners import Runner, InMemoryRunner
    from google.adk.sessions import InMemorySessionService
    from google.adk.apps import App
    from google.adk.tools.tool_context import ToolContext
    from google.adk.tools.base_tool import BaseTool
    from google.adk.agents.callback_context import CallbackContext
    from google.adk.models.llm_request import LlmRequest
    from google.adk.models.llm_response import LlmResponse
    from pydantic import BaseModel, Field
    ADK_AVAILABLE = True
    
    class PitchOutput(BaseModel):
        subject: str = Field(description="Agresywny biznesowo temat e-maila w języku polskim")
        body: str = Field(description="Główna treść e-maila ukierunkowana wyłącznie na umówienie spotkania")
        pain_point_used: str = Field(description="Krótki opis, w jaki punkt bólu uderzono")
except ImportError:
    ADK_AVAILABLE = False
    logging.warning("ADK package (google.adk) not found. Uruchamiam mock agenta ADK.")

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

# --- Inicjalizacja Agentów ---

def create_sales_team():
    if not ADK_AVAILABLE:
        class MockAgent:
            def run(self, prompt: str):
                return type('Response', (), {'text': f"Mocked AI response for: {prompt[:30]}..."})()
        return MockAgent()

    # Sub-Agent: Profiler
    lead_qualifier = Agent(
        name="lead_qualifier_agent",
        model="gemini-2.5-flash",
        mode="single_turn",
        instruction="Twoim jedynym zadaniem jest użycie narzędzia 'check_lead_score' by pobrać profil firmy. Zwróć profil w odpowiedzi.",
        tools=[check_lead_score]
    )

    # Sub-Agent: Researcher
    knowledge_researcher = Agent(
        name="knowledge_researcher_agent",
        model="gemini-2.5-flash",
        mode="single_turn",
        instruction="Twoim jedynym zadaniem jest przeszukanie bazy wiedzy narzędziem 'search_sales_knowledge'. Bądź zwięzły.",
        tools=[search_sales_knowledge]
    )

    # Root Agent: Dyrygent
    instruction = """
    Jesteś elitarnym łowcą spotkań B2B dla WFP CRM (OMEGA Engine).
    ZABRANIA SIĘ BEZPOŚREDNIEJ SPRZEDAŻY OPROGRAMOWANIA.
    Twoim JEDYNYM celem jest zaciekawienie odbiorcy na tyle mocno (używając zebranych przez RAG punktów bólu), by wyciągnąć od niego zgodę na 15-minutowe spotkanie z naszym konsultantem.
    Zanim wygenerujesz wiadomość:
    1. Zleć zbadanie leada do 'lead_qualifier_agent'.
    2. Jeśli wynik leada (lead_score) jest obiecujący, poproś 'knowledge_researcher_agent' o pasujące argumenty z bazy wiedzy.
    3. Na podstawie tych danych wygeneruj ustrukturyzowaną wiadomość (schema PitchOutput). Krótko, do bólu pragmatycznie. Call-To-Action to ZAWSZE pytanie o 15 minut w kalendarzu.
    """
    
    root_agent = Agent(
        name="omega_sales_orchestrator",
        model="gemini-2.5-flash",
        instruction=instruction,
        sub_agents=[lead_qualifier, knowledge_researcher],
        output_schema=PitchOutput,
        before_model_callback=bouncer_guardrail,
        before_tool_callback=quality_check_tool_guardrail
    )
    
    return root_agent

async def run_adk_agent(prompt: str) -> str:
    agent = create_sales_team()
    
    if not ADK_AVAILABLE:
        return agent.run(prompt).text
        
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
