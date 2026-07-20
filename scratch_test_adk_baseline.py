import os
from google import genai
from google.genai import types

def generate_pitch(lead_data: str) -> str:
    """
    Naiwna implementacja, która zawsze zakłada, że API zadziała.
    Brakuje obsługi mock-fallback dla błędów '429 Resource Exhausted'
    lub '401 Unauthorized' (brak gcloud CLI).
    """
    print(f">>> Próba wygenerowania wiadomości dla: {lead_data}")
    try:
        # Zakładamy że autoryzacja Vertex AI działa perfekcyjnie
        client = genai.Client(vertexai=True, project="wfp-crm", location="us-central1")
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f'Wygeneruj cold email do leada: {lead_data}'
        )
        return response.text
    except Exception as e:
        # Pasywne rzucenie wyjątku (RED state - system crashuje zamiast użyć Mocka)
        raise RuntimeError(f"Krytyczny błąd integracji ADK: {str(e)}")

if __name__ == "__main__":
    lead = "CTO @ Acme Corp - Problem: Skalowanie bazy danych"
    print(generate_pitch(lead))
