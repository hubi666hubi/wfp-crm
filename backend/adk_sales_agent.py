import sys
import json
import logging

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Placeholder for ADK Agent logic
# Once the environment is fully provisioned with a2a-sdk or google-agents-cli 
# dependencies, this will use the native Agent objects.

try:
    from google.adk.agents import Agent
    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    logging.warning("ADK package (google.adk) not found. Uruchamiam mock agenta ADK.")

def create_sales_agent():
    instruction = """
    Jesteś elitarnym sprzedawcą B2B dla WFP CRM (napędzanego OMEGA Engine).
    Twoim zadaniem jest klasyfikacja leadów i generowanie wiadomości e-mail typu "Challenger Sale".
    Bądź precyzyjny, agresywny (biznesowo) i krótki.
    """
    
    if ADK_AVAILABLE:
        # Prawdziwy agent ADK
        agent = Agent(
            name="omega_sales_agent",
            model="gemini-1.5-flash",  # Użycie sprawdzonego szybkiego modelu
            instruction=instruction,
            tools=[]
        )
        return agent
    else:
        # Zastępczy mock w razie braku env
        class MockAgent:
            def run(self, prompt: str):
                return type('Response', (), {'text': f"Mocked AI response for: {prompt[:30]}..."})()
        return MockAgent()

if __name__ == "__main__":
    agent = create_sales_agent()
    # Testowy prompt do weryfikacji integracji
    response = agent.run("Stwórz pitch dla firmy e-commerce z problemami w zarządzaniu leadami.")
    print(json.dumps({"status": "success", "response": response.text}))
