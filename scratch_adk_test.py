import os
import sys
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Wczytanie środowiska
load_dotenv()

# Narzucenie Projektu Filadelfja (zabezpieczenie na twardo, by uniknąć wfp-crm)
os.environ["GOOGLE_CLOUD_PROJECT"] = "gen-lang-client-0036518667"
os.environ["GOOGLE_CLOUD_LOCATION"] = "us-central1"

print(f"Używam projektu: {os.environ.get('GOOGLE_CLOUD_PROJECT')}")

from google.adk import Agent
from google.adk.integrations.gcp_skill_registry import GCPSkillRegistry
from google.adk.tools.skill_toolset import SkillToolset

try:
    # 1. Initialize the GCP Skill Registry
    registry = GCPSkillRegistry(
        project_id=os.environ.get("GOOGLE_CLOUD_PROJECT"),
        location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
    )

    # 2. Create the SkillToolset with the Registry
    skill_toolset = SkillToolset(
        skills=[],
        registry=registry
    )

    # 3. Define your Agent with the SkillToolset
    agent = Agent(
        model="gemini-1.5-flash",
        name="registry_agent",
        description="An agent that can dynamically discover and execute skills.",
        instruction="You are a helpful assistant. Use search_skills and load_skill to leverage remote capabilities.",
        tools=[skill_toolset],
    )
    
    print("Agent OMEGA gotowy z podpiętym GCPSkillRegistry!")
    
    # Przykładowe wywołanie testowe
    print("\nWysyłam zapytanie do agenta...")
    response = agent.run("Wyszukaj jakie masz dostępne skille")
    print(f"\nOdpowiedź Agenta: {response}")

except Exception as e:
    print("Błąd podczas uruchamiania Agenta/Registry:", e)
