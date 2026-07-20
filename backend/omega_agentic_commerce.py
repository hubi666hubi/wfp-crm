import sys
import os
import asyncio
from typing import Dict, Any

# Dodajemy folder główny do ścieżki
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.adk_sales_agent import create_sales_team, ADK_AVAILABLE

class AgenticCommerceEngine:
    def __init__(self):
        self.team = create_sales_team()
        self.stripe_agent = next((a for a in self.team.sub_agents if a.name == "stripe_agent"), None)
        
    async def handle_pricing_inquiry(self, lead_email_text: str, lead_score: int) -> str:
        """
        Analizuje mail od klienta, i jeśli ten pyta o koszty, 
        agent używa stripe_agent do wygenerowania dynamicznego Payment Link lub faktury.
        """
        if not self.stripe_agent or not ADK_AVAILABLE:
            return "Tryb Agentic Commerce niedostępny. Standardowa wycena: $500/msc."

        prompt = f"""
        Klient o AI lead_score={lead_score} (w skali do 100) zadał pytanie o ceny: "{lead_email_text}".
        Twój cel:
        Jesteś Agentic Commerce Negotiator. Zależnie od lead_score możesz zaoferować zniżkę od ceny bazowej ($500/msc).
        Jeśli score >= 85, zaoferuj mu 10% rabatu używając narzędzi Stripe. Wygeneruj dla niego Checkout Session na kwotę po rabacie (lub standardową).
        Zwróć odpowiedź do klienta zawierającą link do zapłaty. Zakończ odpowiedź mocnym wezwaniem do akcji (Call-To-Action).
        """
        
        try:
            from google.adk.runners import Runner
            from google.adk.sessions import InMemorySessionService
            from google.adk.agents import Agent
            from google.genai import types
            
            # Tworzymy lekki root agent w trybie chat, bo ADK tego wymaga
            commerce_root = Agent(
                name="commerce_orchestrator",
                model="gemini-2.5-flash",
                instruction="Wykorzystaj stripe_agent aby przygotować ofertę.",
                sub_agents=[self.stripe_agent]
            )
            
            runner = Runner(agent=commerce_root, app_name="agentic_commerce", session_service=InMemorySessionService())
            content = types.Content(parts=[types.Part.from_text(text=prompt)])
            
            response_text = ""
            async for event in runner.run_async(user_id="omega_system", session_id="commerce_session", new_message=content):
                if hasattr(event, "content") and event.content:
                    for p in event.content.parts:
                        if p.text:
                            response_text += p.text
                if hasattr(event, "model_response") and event.model_response:
                     for p in event.model_response.parts:
                         if p.text:
                             response_text += p.text
                             
            return response_text
        except Exception as e:
            print(f"Błąd silnika Agentic Commerce: {e}", file=sys.stderr)
            return f"Napotkaliśmy problem podczas przygotowania oferty. W standardowym wariancie jest to $500/msc. Chcesz abym wystawił fakturę na dane z Twojej stopki?"

if __name__ == "__main__":
    async def test():
        engine = AgenticCommerceEngine()
        result = await engine.handle_pricing_inquiry("To wszystko brzmi super, ale ile kosztuje wasz system?", 90)
        print("--- WYNIK NEGOCJACJI ---")
        print(result)
        
    asyncio.run(test())
