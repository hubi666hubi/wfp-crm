import os
import sys
import json
import asyncio
import random
import re
from datetime import datetime
import httpx

# ==========================================
# 🌌 KONFIGURACJA OMEGA CORE (15/96/34)
# ==========================================
PROJECT_ROOT = os.getenv("PROJECT_ROOT", os.path.dirname(os.path.abspath(__file__)))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
MESSENGER_WEBHOOK_URL = os.getenv("MESSENGER_WEBHOOK_URL", "http://127.0.0.1:3000/api/messenger/send")

# Słowa kluczowe do detekcji intencji zakupowych leada
INTENT_KEYWORDS = [r"crm", r"automatyzacj\w+", r"szukam\s+programu", r"pozyskiwani\w+\s+leadów", r"lejek\s+sprzedaż\w+"]

class WFPMessengerAutopilot:
    """
    Asynchroniczny demon skanujący i parser intencji zakupowych na grupach social media.
    Wykorzystuje Gemini AI do natychmiastowego generowania spersonalizowanych odpowiedzi.
    """
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.processed_posts = set()  # Zapobiega duplikacji odpowiedzi
        self.is_running = True

    async def fetch_mock_social_posts(self) -> list:
        """
        Symuluje pobieranie najnowszych postów i komentarzy z monitorowanych grup biznesowych.
        W realnym środowisku integruje się z API Facebooka lub zewnętrznym scraperem.
        """
        # Generowanie losowych postów do analizy przez demona
        sample_posts = [
            {
                "post_id": f"fb_post_{random.randint(10000, 99999)}",
                "author": "Jan Kowalski",
                "content": "Cześć! Szukam dobrego programu typu CRM do automatyzacji wysyłki wiadomości na LinkedIn i Messengerze. Ktoś coś poleca?",
                "group": "Biznes i Marketing PL"
            },
            {
                "post_id": f"fb_post_{random.randint(10000, 99999)}",
                "author": "Marta Nowak",
                "content": "Jak skutecznie ustawić lejek sprzedażowy dla agencji marketingowej? Nasze dotychczasowe metody zawodzą.",
                "group": "Agencje Marketingowe Polska"
            },
            {
                "post_id": f"fb_post_{random.randint(10000, 99999)}",
                "author": "Piotr Zieliński",
                "content": "Szukam optymalizacji kosztów w firmie. Czy ktoś z Was wdrażał automatyzację procesów biurowych?",
                "group": "Przedsiębiorcy 2026"
            }
        ]
        return sample_posts

    def analyze_intent(self, text: str) -> bool:
        """
        Sprawdza, czy w tekście występują zdefiniowane słowa kluczowe wskazujące na intencję zakupową.
        """
        for pattern in INTENT_KEYWORDS:
            if re.search(pattern, text.lower()):
                return True
        return False

    async def generate_value_first_response(self, author_name: str, post_content: str) -> str:
        """
        Generuje spersonalizowaną, wartościową odpowiedź (Value-First) za pomocą API Gemini.
        """
        if not GEMINI_API_KEY:
            # Rezerwowy generator wiadomości w przypadku braku klucza API
            return (
                f"Cześć {author_name}! Widziałem Twój post dotyczący automatyzacji. "
                "W W.F.P. stworzyliśmy system, który rozwiązuje dokładnie ten problem na autopilocie, "
                "skracając czas reakcji na zapytania poniżej 1.5s. Chętnie podeślę darmowy audyt na DM!"
            )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key={GEMINI_API_KEY}"
        
        system_instruction = (
            "Jesteś elitarnym ekspertem Direct Response Marketingu w platformie W.F.P CRM.\n"
            "Twoim celem jest wygenerowanie spersonalizowanego, bardzo profesjonalnego i angażującego komentarza/wiadomości.\n"
            "Zastosuj strategię VALUE-FIRST: daj realną wskazówkę, a na końcu delikatnie zaproponuj bezpłatny audyt na DM.\n"
            "Pisz w języku polskim, zwięźle, bez spamu i sztucznych formułek sprzedażowych."
        )

        prompt = (
            f"Autor posta: {author_name}\n"
            f"Treść zapytania klienta:\n\"{post_content}\"\n\n"
            f"Wygeneruj unikalną odpowiedź Direct Response:"
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]}
        }

        try:
            response = await self.client.post(url, json=payload)
            if response.status_code == 200:
                data = response.json()
                return data['candidates'][0]['content']['parts'][0]['text'].strip()
        except Exception as e:
            sys.stderr.write(f"Błąd generatora Gemini: {str(e)}\n")
        
        return f"Cześć {author_name}! Skonfigurujmy automatyzację WFP w Twoim biznesie. Napisz do nas na DM!"

    async def dispatch_webhook_to_messenger(self, post_id: str, author: str, text: str):
        """
        Wysyła wygenerowaną odpowiedź bezpośrednio do bazy lub bota Messengera przez webhook.
        """
        payload = {
            "post_id": post_id,
            "recipient": author,
            "message_text": text,
            "timestamp": datetime.now().isoformat()
        }
        try:
            response = await self.client.post(MESSENGER_WEBHOOK_URL, json=payload)
            if response.status_code == 200:
                print(f"\x1b[32m[SUCCESS] WEBHOOK SUKCES: Pomyślnie wysłano odpowiedź do {author} za pomocą webhooka.\x1b[0m")
            else:
                print(f"\x1b[31m[ERROR] WEBHOOK BŁĄD: Serwer odpowiedział kodem {response.status_code}\x1b[0m")
        except Exception as e:
            print(f"\x1b[31m[ERROR] Błąd połączenia z webhookiem Messengera: {e}\x1b[0m")

    async def start_monitoring_loop(self):
        """
        Główna pętla monitorująca. Pobiera posty, analizuje je pod kątem intencji,
        generuje odpowiedzi przez AI i wysyła je na zewnątrz.
        """
        print("\x1b[32m====================================================\x1b[0m")
        print("\x1b[32m[MESSENGER AUTOPILOT]: Monitoring grup aktywowany.\x1b[0m")
        print("\x1b[32m====================================================\x1b[0m")
        
        while self.is_running:
            try:
                posts = await self.fetch_mock_social_posts()
                for post in posts:
                    post_id = post["post_id"]
                    if post_id in self.processed_posts:
                        continue

                    content = post["content"]
                    author = post["author"]

                    # Krok 1: Sprawdzenie intencji zakupowych
                    if self.analyze_intent(content):
                        print(f"\n\x1b[33m[DETEKCJA INTENCJI]: Wykryto intencję u '{author}' w grupie '{post['group']}'\x1b[0m")
                        print(f"Treść posta: \"{content}\"")
                        
                        # Krok 2: Synteza spersonalizowanego komentarza/DM
                        response_text = await self.generate_value_first_response(author, content)
                        print(f"\x1b[36m[AI SYNTHESIS]: Wygenerowano odpowiedź:\x1b[0m\n{response_text}")

                        # Krok 3: Wysyłka przez webhook do Messengera
                        await self.dispatch_webhook_to_messenger(post_id, author, response_text)
                        
                        # Dodanie do przetworzonych
                        self.processed_posts.add(post_id)
                        await asyncio.sleep(2.0)  # Oddech dla API

                await asyncio.sleep(10.0)  # Interwał skanowania grup
            except asyncio.CancelledError:
                self.is_running = False
                break
            except Exception as e:
                print(f"\x1b[31m[ERROR] Krytyczny wyjątek w pętli monitorującej autopilot: {e}\x1b[0m")
                await asyncio.sleep(5.0)

        await self.client.aclose()

if __name__ == "__main__":
    autopilot = WFPMessengerAutopilot()
    try:
        asyncio.run(autopilot.start_monitoring_loop())
    except KeyboardInterrupt:
        print("\n\x1b[33m[INFO] Zamykanie demona Messengera...\x1b[0m")
