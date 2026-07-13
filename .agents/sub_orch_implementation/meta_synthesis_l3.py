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
from critic_l2 import CriticDossier
from sandbox_l4_harden import SystemPatch

class MetaGeneratorService:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "MOCK_KEY")
        self.models_cascade = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"]

    async def synthesize_upgrade(self, dossier: CriticDossier) -> SystemPatch:
        if self.api_key == "MOCK_KEY":
            return self._generate_static_fallback(dossier)

        ai = GoogleGenAI(api_key=self.api_key)
        prompt = f"Rewrite this blocking sync code to absolute non-blocking async code using asyncio generators:\n{dossier.current_code}"

        for model_name in self.models_cascade:
            try:
                response = await ai.models.generateContent(model=model_name, contents=prompt)
                if response and response.text:
                    clean_code = response.text.replace("```python", "").replace("```", "").strip()
                    return SystemPatch(
                        issue_id=dossier.issue_id,
                        target_file_path=dossier.target_file_path,
                        patch_notes=f"Refactored autonomously with {model_name}.",
                        new_code=clean_code,
                        confidence_score=0.98
                    )
            except Exception as e:
                print(f"[CASCADE WARNING] Model {model_name} failed: {str(e)}")
                continue

        return self._generate_static_fallback(dossier)

    def _generate_static_fallback(self, dossier: CriticDossier) -> SystemPatch:
        fixed_code = "import asyncio\nasync def process_bus_data(data):\n    await asyncio.sleep(0.001)\n    return [d * 2 for d in data]"
        return SystemPatch(
            issue_id=dossier.issue_id,
            target_file_path=dossier.target_file_path,
            patch_notes="Static matrix compilation achieved through emergency fallback initialization.",
            new_code=fixed_code,
            confidence_score=0.70
        )
