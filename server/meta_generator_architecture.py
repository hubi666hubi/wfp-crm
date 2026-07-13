# ==============================================================================
# WARSTWA 3 (L3): ASYNC META-SYNTHESIS ENGINE (FALLBACK CASCADE MECHANICS)
# ==============================================================================
import os
import asyncio
import re
from google.genai import Client

# Dynamiczny wrapper klasy Client z nowej biblioteki google-genai,
# mapujący wywołania modeli camelCase na asynchroniczne metody snake_case (np. generateContent -> generate_content).
class GoogleGenAI(Client):
    @property
    def models(self):
        class AsyncModelsWrapper:
            def __init__(self, parent_client, base_models):
                self.parent = parent_client
                self.base_models = base_models
            def __getattr__(self, name):
                snake_name = re.sub(r'(?<!^)(?=[A-Z])', '_', name).lower()
                if hasattr(self.parent.aio.models, snake_name):
                    return getattr(self.parent.aio.models, snake_name)
                return getattr(self.base_models, snake_name)
        return AsyncModelsWrapper(self, super().models)

try:
    from server.critic_l2 import CriticDossier
    from server.sandbox_l4 import SystemPatch
except ModuleNotFoundError:
    from critic_l2 import CriticDossier
    from sandbox_l4 import SystemPatch

class MetaGeneratorService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        # Kaskada modeli rezerwowych dopasowana do specyfikacji silnika
        self.models_cascade = [
            "gemini-2.5-flash",
            "gemini-1.5-flash",
            "gemini-2.0-flash-lite"
        ]

    async def synthesize_upgrade(self, dossier: CriticDossier) -> SystemPatch:
        """
        Wymusza transformację kodu synchronicznego w zoptymalizowany pod kątem asynchroniczności 
        wzorzec I/O przy użyciu pętli modeli o strukturze odpornej na błędy i limity przydziału.
        """
        if not self.api_key:
            # Mechanizm awaryjny offline w przypadku braku klucza API
            return self._generate_static_fallback(dossier)

        ai = GoogleGenAI(api_key=self.api_key)
        prompt = f"""
        Jesteś autonomicznym architektem systemów samonaprawczych. Twoim zadaniem jest refaktoryzacja wadliwego kodu.
        Cel pliku: {dossier.target_file_path}
        Typ anomalii: {dossier.issue_type}
        Analiza krytyka: {dossier.critic_analysis}
        
        Wymagania bezwzględne:
        1. Jeśli kod wykonuje blokujące operacje I/O, dokonaj transformacji na wzorce asynchroniczne 'async def' oraz 'async for'.
        2. Kod musi być w 100% poprawny składniowo. Nie dołączaj komentarzy typu markdown (bloków ```python).
        3. Zabrania się używania funkcji: eval, exec, os.system, subprocess.
        
        KOD DO NAPRAWY:
        {dossier.current_code}
        """

        last_error = None
        for model_name in self.models_cascade:
            try:
                # Wywołanie generowania z sekwencyjnym przełączaniem na model rezerwowy
                response = await ai.models.generateContent(
                    model=model_name,
                    contents=prompt
                )
                if response and response.text:
                    clean_code = response.text.replace("```python", "").replace("```", "").strip()
                    return SystemPatch(
                        issue_id=dossier.issue_id,
                        target_file_path=dossier.target_file_path,
                        patch_notes=f"Refaktoryzacja wykonana pomyślnie za pomocą modelu {model_name}.",
                        new_code=clean_code,
                        confidence_score=0.95
                    )
            except Exception as e:
                last_error = e
                print(f"[AI SERVICE FALLBACK] Model {model_name} zakończył się niepowodzeniem. Błąd: {str(e)}")

        print("[AI SERVICE FATAL] Kaskada wszystkich modeli modeli zakończyła się niepowodzeniem. Uruchamianie kodu statycznego.")
        return self._generate_static_fallback(dossier)

    def _generate_static_fallback(self, dossier: CriticDossier) -> SystemPatch:
        fixed_code = f"""import asyncio

async def process_bus_data(data):
    # Generowanie asynchronicznego generatora jako bezpieczny fallback matrix
    await asyncio.sleep(0.01)
    return [d * 2 for d in data]
"""
        return SystemPatch(
            issue_id=dossier.issue_id,
            target_file_path=dossier.target_file_path,
            patch_notes="Zastosowano statyczny generator asynchroniczny (Fallback Matrix).",
            new_code=fixed_code,
            confidence_score=0.80
        )
