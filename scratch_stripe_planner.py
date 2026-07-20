import sys
import os
import asyncio
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from backend.adk_sales_agent import create_sales_team, ADK_AVAILABLE

async def main():
    if not ADK_AVAILABLE:
        print("ADK NOT AVAILABLE")
        return
        
    print("Inicjalizacja zespołu OMEGA...")
    agent = create_sales_team()
    
    # We want to specifically trigger stripe_agent
    stripe_agent = next((a for a in agent.sub_agents if a.name == "stripe_agent"), None)
    if not stripe_agent:
        print("Brak stripe_agent!")
        return
        
    print("Wysyłanie promptu do stripe_agent: Użyj narzędzia stripe_implementation_planner...")
    # Actually we can run the whole agent or just the subagent
    from google.adk.runners import Runner
    from google.adk.sessions import InMemorySessionService
    from google.adk.models.llm_request import LlmRequest
    from google.genai import types
    
    runner = Runner(agent=stripe_agent, app_name="stripe_test", session_service=InMemorySessionService())
    
    content = types.Content(parts=[types.Part.from_text(text="Please use the stripe_implementation_planner tool to generate a tailored integration plan for a B2B CRM SaaS that wants to sell a $500/month subscription.")])
    
    async for event in runner.run_async(user_id="test", session_id="test_session", new_message=content):
        if hasattr(event, "content") and event.content:
            for p in event.content.parts:
                if p.text:
                    print(p.text, end="")
        if hasattr(event, "model_response") and event.model_response:
             for p in event.model_response.parts:
                 if p.text:
                     print(p.text, end="")
                     
if __name__ == "__main__":
    asyncio.run(main())
