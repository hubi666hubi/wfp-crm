import os
import logging
from google import genai

logging.basicConfig(level=logging.INFO)

def generate_pitch(lead_data: str) -> str:
    """
    Bezpieczna implementacja z mock-fallback wg skilla 'adk-mock-fallback'.
    """
    print(f">>> Próba wygenerowania wiadomości dla: {lead_data}")
    try:
        # Próba połączenia z ADK
        client = genai.Client(vertexai=True, project="wfp-crm", location="us-central1")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f'Wygeneruj cold email do leada: {lead_data}'
        )
        return response.text
    except Exception as e:
        error_msg = str(e).lower()
        if "credentials" in error_msg or "429" in error_msg or "resource_exhausted" in error_msg:
            logging.warning(f"[ADK FALLBACK] Vertex AI unavailable ({e}). Using Mock Agent.")
            return _generate_mock_content(lead_data)
        raise

def _generate_mock_content(prompt: str) -> str:
    return f"MOCK_RESPONSE: Cześć, wygenerowana wiadomość dla: {prompt[:30]}..."

if __name__ == "__main__":
    lead = "CTO @ Acme Corp - Problem: Skalowanie bazy danych"
    print(generate_pitch(lead))
