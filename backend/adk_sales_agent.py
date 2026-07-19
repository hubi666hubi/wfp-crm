import sys
import json
import logging
import asyncio

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Placeholder for ADK Agent logic
import os
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
    from google.adk.runners import InMemoryRunner
    from google.adk.sessions import InMemorySessionService
    from google.adk.apps import App
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    logging.warning("ADK package (google.adk) not found. Uruchamiam mock agenta ADK.")

def check_lead_score(company_name: str) -> dict:
    """Checks the AI lead score and specific pain points for a given company.
    
    Args:
        company_name: The name of the company to analyze.
    """
    return {
        "status": "success",
        "company": company_name,
        "pain_points": ["niskie konwersje", "wyciek leadów"],
        "lead_score": 85
    }

def search_sales_knowledge(query: str) -> str:
    """Searches the Supabase vector database for relevant sales materials, objections handling, and CRM knowledge.
    
    Args:
        query: The semantic search query regarding sales knowledge.
    """
    if not supabase_client or not gemini_client:
        return "Błąd: Brak klienta Supabase lub Google GenAI. Konfiguracja RAG jest niepełna."
    
    try:
        # Generate embedding using text-embedding-004
        response = gemini_client.models.embed_content(
            model='text-embedding-004',
            contents=query,
        )
        embedding = response.embeddings[0].values
        
        # Call hybrid_search RPC in Supabase
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
            
        return "\n".join(context)
    except Exception as e:
        return f"Błąd podczas wyszukiwania w bazie wiedzy: {str(e)}"

def create_sales_agent():
    instruction = """
    Jesteś elitarnym sprzedawcą B2B dla WFP CRM (napędzanego OMEGA Engine).
    Twoim zadaniem jest klasyfikacja leadów i generowanie wiadomości e-mail typu "Challenger Sale".
    Bądź precyzyjny, agresywny (biznesowo) i krótki.
    Zawsze sprawdzaj punktację leada narzędziem check_lead_score przed podjęciem decyzji o wysłaniu wiadomości.
    Używaj narzędzia search_sales_knowledge, aby znaleźć odpowiednie argumenty sprzedażowe, case studies lub techniki zbijania obiekcji z naszej bazy wiedzy.
    """
    
    if ADK_AVAILABLE:
        agent = Agent(
            name="omega_sales_agent",
            model="gemini-2.5-flash",
            instruction=instruction,
            tools=[check_lead_score, search_sales_knowledge]
        )
        return agent
    else:
        # Zastępczy mock w razie braku env
        class MockAgent:
            def run(self, prompt: str):
                return type('Response', (), {'text': f"Mocked AI response for: {prompt[:30]}..."})()
        return MockAgent()

async def run_adk_agent(prompt: str) -> str:
    agent = create_sales_agent()
    runner = InMemoryRunner(agent=agent, app_name="wfp_crm_adk")
    
    # Tworzenie sesji, aby zapobiec SessionNotFoundError
    try:
        from google.adk.sessions import Session
        import inspect
        session = Session(app_name="wfp_crm_adk", user_id="cli_user", id="cli_session")
        if inspect.iscoroutinefunction(runner.session_service.create_session):
            await runner.session_service.create_session(session=session)
        else:
            runner.session_service.create_session(session=session)
    except Exception as e:
        print(f"Session creation error with session kwarg: {e}", file=sys.stderr)
        try:
            if inspect.iscoroutinefunction(runner.session_service.create_session):
                await runner.session_service.create_session(app_name="wfp_crm_adk", user_id="cli_user", session_id="cli_session")
            else:
                runner.session_service.create_session(app_name="wfp_crm_adk", user_id="cli_user", session_id="cli_session")
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
        agent = create_sales_agent()
        response = agent.run(prompt)
        print(json.dumps({"status": "success", "response": response.text}))

if __name__ == "__main__":
    main()
