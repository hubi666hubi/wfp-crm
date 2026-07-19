import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from google.genai import types
from google.adk.agents import Agent
from google.adk.runners import InMemoryRunner
from google.adk.sessions import InMemorySessionService
from google.adk.apps import App

def check_lead_score(company_name: str) -> dict:
    return {
        "status": "success",
        "company": company_name,
        "pain_points": ["niskie konwersje", "wyciek leadów"],
        "lead_score": 85
    }

agent = Agent(
    name="omega_sales_agent",
    model="gemini-1.5-flash",
    instruction="Zawsze sprawdzaj punktację leada i napisz krótki pitch.",
    tools=[check_lead_score]
)

app = App(name="wfp_crm_adk", root_agent=agent)
runner = InMemoryRunner(app=app, session_service=InMemorySessionService())

prompt = "Napisz pitch dla E-commerce sp z o.o."

# Depending on ADK version, part construction might be types.Part(text="...") or from_text
try:
    content = types.Content(parts=[types.Part.from_text(text=prompt)])
except AttributeError:
    content = types.Content(parts=[types.Part(text=prompt)])

response_text = ""
try:
    for event in runner.run(user_id="u1", session_id="s1", new_message=content):
        if hasattr(event, "content") and event.content:
            for p in event.content.parts:
                if p.text:
                    response_text += p.text
        if hasattr(event, "model_response") and event.model_response:
             # in case it's in model_response
             for p in event.model_response.parts:
                 if p.text:
                     response_text += p.text
except Exception as e:
    response_text = "Error: " + str(e)

print("Agent Response:")
print(response_text)
