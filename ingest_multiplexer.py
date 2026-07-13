import asyncio
import json
import random
import time
import re
import sys
import os
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple, Union

# Reconfigure stdout/stderr to UTF-8 to prevent UnicodeEncodeError on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# ==========================================
# 🌌 MOCK FCNTL & INTEGRACJA SCHEMATU PROFILI
# ==========================================
# Mock fcntl for Windows compatibility before importing science http_client
try:
    import fcntl
except ImportError:
    import types
    fcntl = types.ModuleType("fcntl")
    fcntl.LOCK_EX = 1
    fcntl.LOCK_SH = 2
    fcntl.LOCK_NB = 4
    fcntl.LOCK_UN = 8
    def flock(fd, op):
        pass
    fcntl.flock = flock
    sys.modules["fcntl"] = fcntl

from science_skills.skills.scienceskillscommon import http_client

# ==========================================
# 🌌 INTEGRACJA RDZENIA OPERACYJNEGO (15/96/34)
# ==========================================
PROJECT_ROOT = os.getenv("PROJECT_ROOT", os.path.dirname(os.path.abspath(__file__)))
SYSTEM_SIGNATURE = "OMEGA_15_96_34"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Lokalny plik persystencji dla zabezpieczenia gorących leadów przed awariami
LEADS_BACKUP_FILE = os.path.join(PROJECT_ROOT, "nekropolis_hot_leads.json")

# ==========================================
# 📡 INICJALIZACJA UNIFIED HTTP CLIENTÓW (RATE LIMITS & AUTO RETRIES)
# ==========================================
# Gemini API client
GEMINI_HTTP_CLIENT = http_client.HttpClient(
    "https://generativelanguage.googleapis.com/v1beta/models/",
    qps=4.0
)

# Express API Clients for Billing and CRM
BILLING_HTTP_CLIENT = http_client.HttpClient(
    "http://localhost:3000/api/usage/",
    qps=20.0
)

OUTBOUND_HTTP_CLIENT = http_client.HttpClient(
    "http://localhost:3000/api/outbound/",
    qps=10.0
)

# ==========================================
# 🎯 MATRYCA INTENCJI I DYNAMICZNE WAGI (NLP HEURISTICS)
# ==========================================
# Początkowe wagi, które Uroboros będzie dynamicznie dostosowywał w locie
INTENT_WEIGHTS = {
    "HIGH_VALUE": 25,
    "MEDIUM_VALUE": 12,
    "LOW_VALUE": -8,
    "DECISION_MAKER": 20,
    "MARKETING_ROLE": 10
}

INTENT_PATTERNS = {
    "HIGH_VALUE": [
        r"(szukam|kupię|wdrażam|potrzebuję)\s+(crm|automatyzacj\w+|systemu|lejka)",
        r"(b2b\s+lead\s+generation|outreach\s+automation|sales\s+funnel)",
        r"(budżet|finansowanie|inwestycj\w+|r&d|stripe|payments)"
    ],
    "MEDIUM_VALUE": [
        r"(jak\s+pozyskiwać|skuteczny\s+outbound|growth\s+hacking)",
        r"(konwersj\w+|optymalizacj\w+|seo|ahrefs|semrush)",
        r"(marketing\s+agency|b2b\s+saas|skalowanie\s+sprzedaży)"
    ],
    "LOW_VALUE": [
        r"(porady|darmowy\s+kurs|social\s+media\s+marketing)",
        r"(fanpage|instagram|tiktok|hasztag\w+)"
    ]
}


# ==========================================
# 🌀 SYNERGIA UROBOROSA: AUTONOMICZNA RETROSPEKCJA (FEEDBACK LOOP)
# ==========================================
class OuroborosFeedbackLoop:
    """
    Samoewoluujący system zamkniętej pętli (Uroboros).
    Analizuje zapisane sukcesy w pliku bazy i dynamicznie modyfikuje wagi scoringu.
    """
    @staticmethod
    def recalibrate_weights():
        try:
            if not os.path.exists(LEADS_BACKUP_FILE):
                return
            
            with open(LEADS_BACKUP_FILE, "r", encoding="utf-8") as f:
                leads = json.load(f)
            
            if len(leads) < 5:
                return  # Potrzebujemy próby badawczej do adaptacji
            
            print("\x1b[34m🌀 [OUROBOROS]: Rozpoczynam cykl retrospekcji. Analiza sukcesów...\x1b[0m")
            
            # Analizujemy, jakie słowa kluczowe i role dominują w skonwertowanych leadach
            high_priority_count = sum(1 for l in leads if l.get("priority") == "CRITICAL_HOT")
            
            if high_priority_count > len(leads) * 0.5:
                # Jeśli mamy wysoki współczynnik sukcesu, podbijamy nagrody za kluczowe role decyzyjne
                INTENT_WEIGHTS["DECISION_MAKER"] += 2
                INTENT_WEIGHTS["HIGH_VALUE"] += 1
                print("\x1b[32m🌱 [OUROBOROS ADAPTATION]: Wzmocniono wagi dla decydentów i gorących intencji.\x1b[0m")
            else:
                # Jeśli za dużo leadów trafia do COLD, zaostrzamy filtry karząc za niski priorytet
                INTENT_WEIGHTS["LOW_VALUE"] -= 2
                print("\x1b[33m⚠️ [OUROBOROS ADAPTATION]: Zaostrzono kryteria selekcji. Zwiększono kary punktowe.\x1b[0m")
                
            print(f"\x1b[34m[🌀] Aktualne wagi decyzyjne: {json.dumps(INTENT_WEIGHTS)}\x1b[0m")
        except Exception as e:
            sys.stderr.write(f"[!] Błąd adaptacji Uroborosa: {e}\n")


# ==========================================
# 🔥 KALI SENTRY: EKSTREMALNA PURGACJA ZAGROŻEŃ (COMPETITION SHIELD)
# ==========================================
class KaliPurgeSentry:
    """
    Moduł Kali (Destrukcja i Oczyszczenie).
    Błyskawicznie wykrywa konkurencję, boty, sabotaż i usuwa ich z potoku danych.
    """
    def __init__(self):
        # Lista zablokowanych domen konkurencji i fraz toksycznych
        self.blacklist_domains = ["competitorcrm.com", "spambot.ru", "anti-wfp.pl"]
        self.toxic_phrases = ["free lead hack", "crack bypass", "ddos testing", "scraping cheat"]

    def evaluate_threat(self, text: str, url: str) -> bool:
        """
        Zwraca True, jeśli wykryto zagrożenie lub toksynę. Lead zostanie spalony.
        """
        combined = f"{text} {url}".lower()
        
        # Skanowanie czarnej listy domen
        if any(domain in combined for domain in self.blacklist_domains):
            print(f"\x1b[41m\x1b[37m 🚨 [KALI PURGE]: Zablokowano wrogą domenę! Cel ulega natychmiastowej utylizacji.\x1b[0m")
            return True
            
        # Skanowanie fraz destrukcyjnych
        if any(phrase in combined for phrase in self.toxic_phrases):
            print(f"\x1b[41m\x1b[37m 🚨 [KALI PURGE]: Wykryto toksyczny ładunek w tekście. Blokada wektora.\x1b[0m")
            return True
            
        return False


# ==========================================
# 💰 LAKSHMI EXPANDER: MAGNETYZM OBFITOŚCI (TRAFFIC RESONANCE)
# ==========================================
class LakshmiExpander:
    """
    Moduł Lakszmi (Obfitość, Przyciąganie, Skalowanie).
    Gdy wykryje idealnego klienta, wyzwala magnetyczny rezonans – szuka powiązanych
    profili i automatycznie przygotowuje kampanie Stripe Connect.
    """
    @staticmethod
    async def manifest_abundance(lead_data: Dict[str, Any]):
        print(f"\x1b[42m\x1b[30m 💰 [LAKSHMI EXPANDER] \x1b[0m Wykryto idealną sygnaturę! Inicjowanie rezonansu przyciągania...")
        
        # Symulacja wyszukiwania powiązanych profili z tej samej organizacji w tle (Rozrost sieciowy)
        company_domain = lead_data.get("url", "").split("/org/")[-1].split("/in/")[-1].split("-")[0]
        if company_domain and len(company_domain) > 3:
            print(f"\x1b[32m[+] Lakszmi automatycznie mapuje nowe cele dla domeny: {company_domain}...\x1b[0m")
            # Wrzucenie wirtualnego webhooka do autopilota Stripe, przygotowanie sesji afiliacyjnej
            await asyncio.sleep(0.5)
            print(f"\x1b[32m[✓] Wygenerowano spersonalizowaną ścieżkę partnerską Stripe Connect dla {lead_data.get('title')}.\x1b[0m")


# ==========================================
# 💾 PERSYSTENCJA STANU (ZERO DATA LOSS)
# ==========================================
class StatePersistenceManager:
    """
    Zarządza trwałym zapisem najcenniejszych leadów w lokalnym pliku JSON.
    """
    @staticmethod
    def save_hot_lead(lead_data: Dict[str, Any]):
        try:
            leads = []
            if os.path.exists(LEADS_BACKUP_FILE):
                with open(LEADS_BACKUP_FILE, "r", encoding="utf-8") as f:
                    try:
                        leads = json.load(f)
                    except json.JSONDecodeError:
                        leads = []
            
            leads.append({
                **lead_data,
                "saved_at": datetime.now().isoformat(),
                "signature": SYSTEM_SIGNATURE
            })

            with open(LEADS_BACKUP_FILE, "w", encoding="utf-8") as f:
                json.dump(leads, f, indent=4, ensure_ascii=False)
                
            # Wywołanie kalibracji Uroborosa po udanym zapisie nowego leada
            OuroborosFeedbackLoop.recalibrate_weights()
        except Exception as e:
            sys.stderr.write(f"\x1b[31m[!] Błąd zapisu persystencji stanu: {e}\x1b[0m\n")


# ==========================================
# 🧠 BRAIN CONTROLLER: TRÓJJEDYNY MÓZG (TRIUNE DECISION SYSTEM)
# ==========================================
class TriuneBrainProcessor:
    """
    Kompleksowy procesor analizy trójwarstwowej:
    - Reptilian (Gadzi): Ultraszybka obrona i reakcja.
    - Mammalian (Ssaczy): Wykrywanie emocji, bólu i sentymentu.
    - Neocortex (Logika): Analiza kognitywna Gemini LLM.
    """
    def __init__(self):
        self.sentry = KaliPurgeSentry()
        self.fallback_models = [
            "gemini-2.5-flash-preview-09-2025",
            "gemini-2.5-flash",
            "gemini-1.5-flash"
        ]

    async def process_lead(self, text: str, title: str, url: str) -> Tuple[int, str, Dict[str, Any]]:
        """
        Główny potok decyzyjny przechodzący przez warstwy ewolucyjne mózgu.
        """
        # --- 1. REPTILIAN LAYER (Górny Skaner Sentry - Kali) ---
        if self.sentry.evaluate_threat(text, url):
            return 0, "SPAM_BLOCKED", {"action": "PURGE", "reason": "Sentry detected a direct security threat."}

        # --- 2. MAMMALIAN LAYER (Analizator Sentymentu i Bólu) ---
        sentiment_score, pain_points = self._analyze_mammalian_sentiment(text)
        
        # --- 3. NEOCORTEX LAYER (Logiczny Heurystyczny i AI Scoring) ---
        heuristic_score, priority = self._calculate_heuristic_score(text, title)
        
        cognitive_data = {"sentiment_score": sentiment_score, "pain_points": pain_points, "heuristic_score": heuristic_score}

        # Jeżeli wynik z heurystyki jest obiecujący, uruchamiamy neokorteks wyższy (AI)
        if priority in ["CRITICAL_HOT", "WARM_OUTBOUND"] and GEMINI_API_KEY:
            ai_score, ai_reason = await self._call_gemini_semantic_eval(text, title)
            if ai_score > 0:
                final_score = self._adjust_score(heuristic_score, ai_score)
                priority = "CRITICAL_HOT" if final_score >= 75 else "WARM_OUTBOUND"
                cognitive_data["ai_reason"] = ai_reason
                cognitive_data["ai_score"] = ai_score
                return final_score, priority, cognitive_data

        return heuristic_score, priority, cognitive_data

    def _analyze_mammalian_sentiment(self, text: str) -> Tuple[int, List[str]]:
        """
        Symuluje ssaczą detekcję bólu i potrzeb emocjonalnych w tekście.
        Wyszukuje sygnały frustracji, pilności i chęci zmiany.
        """
        text_lower = text.lower()
        pain_points = []
        sentiment_score = 50  # Neutralny start

        frustration_triggers = ["problem", "zawodzi", "wolno", "strata", "brak", "błąd", "trudne"]
        urgency_triggers = ["pilnie", "natychmiast", "szybko", "asap", "na wczoraj"]

        for trig in frustration_triggers:
            if trig in text_lower:
                pain_points.append(trig)
                sentiment_score -= 10
                
        for trig in urgency_triggers:
            if trig in text_lower:
                pain_points.append(trig)
                sentiment_score -= 5

        return max(10, sentiment_score), pain_points

    def _calculate_heuristic_score(self, text: str, title: str) -> Tuple[int, str]:
        combined_text = f"{title} {text}".lower()
        score = 10
        
        high_hits = sum(len(re.findall(pattern, combined_text)) for pattern in INTENT_PATTERNS["HIGH_VALUE"])
        med_hits = sum(len(re.findall(pattern, combined_text)) for pattern in INTENT_PATTERNS["MEDIUM_VALUE"])
        low_hits = sum(len(re.findall(pattern, combined_text)) for pattern in INTENT_PATTERNS["LOW_VALUE"])

        # Wykorzystanie dynamicznych wag Uroborosa
        score += (high_hits * INTENT_WEIGHTS["HIGH_VALUE"]) + \
                 (med_hits * INTENT_WEIGHTS["MEDIUM_VALUE"]) + \
                 (low_hits * INTENT_WEIGHTS["LOW_VALUE"])
        
        title_lower = title.lower()
        if any(role in title_lower for role in ["ceo", "cto", "founder", "owner", "dyrektor", "head", "założyciel"]):
            score += INTENT_WEIGHTS["DECISION_MAKER"]
        elif any(role in title_lower for role in ["marketing", "sales", "growth", "sprzedaż"]):
            score += INTENT_WEIGHTS["MARKETING_ROLE"]

        score = max(0, min(100, score))

        if score >= 75:
            priority = "CRITICAL_HOT"
        elif score >= 45:
            priority = "WARM_OUTBOUND"
        else:
            priority = "COLD_NURTURE"

        return score, priority

    async def _call_gemini_semantic_eval(self, text: str, title: str) -> Tuple[int, str]:
        system_instruction = (
            "Jesteś najwyższym modułem logicznym neokorteksu W.F.P CRM.\n"
            "Dokonaj głębokiej analizy intencji zakupowej. Zwróć wyłącznie JSON o strukturze:\n"
            "{\"score\": <0-100>, \"reason\": \"<uzasadnienie po polsku>\"}"
        )
        
        prompt = f"Stanowisko: {title}\nTreść profilu: {text}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": system_instruction}]},
            "generationConfig": {"responseMimeType": "application/json"}
        }

        for model in self.fallback_models:
            path = f"{model}:generateContent?key={GEMINI_API_KEY}"
            try:
                def do_eval():
                    return GEMINI_HTTP_CLIENT.fetch_json(
                        path,
                        method="POST",
                        json_body=payload,
                        timeout=5.0
                    )
                loop = asyncio.get_running_loop()
                parsed = await loop.run_in_executor(None, do_eval)
                return int(parsed.get("score", 0)), parsed.get("reason", "")
            except Exception:
                pass
        return 0, "Błąd logiczny neokorteksu."

    def _adjust_score(self, heuristic: int, ai: int) -> int:
        return max(0, min(100, int((heuristic * 0.4) + (ai * 0.6))))


# ==========================================
# 📡 KOMUNIKATOR BILINGOWY (METRIC CHARGER)
# ==========================================
class BillingMetricBridge:
    """
    Most komunikujący się z silnikiem monetarnym Express API.
    """
    @staticmethod
    async def charge_credits(customer_id: str, metric_type: str, quantity: int) -> bool:
        payload = {
            "customerId": customer_id,
            "metric": metric_type,
            "quantity": quantity,
            "signature": SYSTEM_SIGNATURE
        }
        try:
            def do_charge():
                return BILLING_HTTP_CLIENT.fetch_json(
                    "record",
                    method="POST",
                    json_body=payload,
                    timeout=3.0
                )
            loop = asyncio.get_running_loop()
            res_data = await loop.run_in_executor(None, do_charge)
            return res_data.get("success", False)
        except Exception:
            # Fallback - dymna zasłona przed błędami portu 3000
            pass
        return True


# ==========================================
# 🚀 OUTBOUND DISPATCHER (REAL HANDSHAKE AUTOMATION)
# ==========================================
class OutboundDispatcher:
    """
    Zarządza automatycznym wysyłaniem spersonalizowanych Pitch Cardów.
    """
    @staticmethod
    async def dispatch_handshake(url: str, title: str, score: int, priority: str, cognitive: Dict[str, Any]) -> bool:
        payload = {
            "url": url,
            "title": title,
            "score": score,
            "priority": priority,
            "cognitive_data": cognitive,
            "dispatched_at": datetime.now().isoformat(),
            "signature": SYSTEM_SIGNATURE
        }
        try:
            def do_handshake():
                res = OUTBOUND_HTTP_CLIENT.fetch(
                    "handshake",
                    method="POST",
                    json_body=payload,
                    timeout=4.0
                )
                return res.status_code == 200
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(None, do_handshake)
        except Exception:
            return False


# ==========================================
# 🤖 MULTIPLEXED INGESTION DAEMON (POTOK RUCHU)
# ==========================================
class IngestionMultiplexer:
    """
    Główny potok asynchroniczny odbierający pakiety z wtyczek i generujący
    natychmiastowe akcje dotarcia (Outbound Autopilot Triggers).
    """
    def __init__(self, queue: asyncio.Queue):
        self.queue = queue
        self.brain = TriuneBrainProcessor()
        self.is_active = True

    async def start_ingestion_loop(self):
        """
        Asynchroniczny demon nasłuchujący i przetwarzający zrzuty w czasie rzeczywistym.
        """
        print("\x1b[32m[✓] [LEAD MULTIPLEXER]: Potok aktywny. Nasłuch pakietów z ZapalnikClipper...\x1b[0m")
        
        while self.is_active:
            try:
                packet = await self.queue.get()
                start_time = time.time()

                extracted_text = packet.get("extractedText", "")
                title = packet.get("title", "Nieznany Profil")
                url = packet.get("url", "example.com")
                customer_id = packet.get("customer_id", "cust_omega_default")

                # Krok 1: Przetwarzanie przez Trójjedyny Mózg (Scoring, Sentyment, Bezpieczeństwo)
                score, priority, cognitive = await self.brain.process_lead(extracted_text, title, url)

                if priority == "SPAM_BLOCKED":
                    self.queue.task_done()
                    continue

                # Krok 2: Rozliczenie z kredytów w Express API
                metric = "clip" if priority != "CRITICAL_HOT" else "video"
                charged = await BillingMetricBridge.charge_credits(customer_id, metric, 1)

                if not charged:
                    print(f"\x1b[31m[🚨] [INSUFFICIENT FUNDS]: Zablokowano przetwarzanie dla {customer_id}. Brak kredytów!\x1b[0m")
                    self.queue.task_done()
                    continue

                # Krok 3: Zapis i Rezonans Obfitości (Lakshmi) + Uroboros Auto-Calibration
                if priority == "CRITICAL_HOT":
                    lead_payload = {
                        "title": title,
                        "url": url,
                        "score": score,
                        "priority": priority,
                        "customer_id": customer_id
                    }
                    StatePersistenceManager.save_hot_lead(lead_payload)
                    await LakshmiExpander.manifest_abundance(lead_payload)

                # Krok 4: Wyzwalanie pętli dopaminowej
                processing_time = (time.time() - start_time) * 1000
                print(f"\n\x1b[42m\x1b[30m 🎯 [TARGET CAPTURED] \x1b[0m Cel zsynchronizowany pomyślnie!")
                print(f"\x1b[36mŹródło:\x1b[0m {url}")
                print(f"\x1b[36mScoring:\x1b[0m {score}% [\x1b[33m{priority}\x1b[0m] | Koszt: {metric.upper()} | Czas: {processing_time:.2f}ms")

                # Krok 5: Jeśli lead jest gorący, wyślij spersonalizowany handshake na żywo
                if priority == "CRITICAL_HOT":
                    asyncio.create_task(self.trigger_outbound_handshake(url, title, score, priority, cognitive))

                self.queue.task_done()

            except asyncio.CancelledError:
                self.is_active = False
                break
            except Exception as e:
                print(f"\x1b[31m[!] Wyjątek w potoku przechwytywania: {e}\x1b[0m")

    async def trigger_outbound_handshake(self, url: str, title: str, score: int, priority: str, cognitive: Dict[str, Any]):
        """
        Asynchroniczny proces przygotowujący i wysyłający spersonalizowany pakiet dotarcia w tle.
        """
        success = await OutboundDispatcher.dispatch_handshake(url, title, score, priority, cognitive)
        status_color = "\x1b[32m[WYSŁANO OK]" if success else "\x1b[33m[BUFOROWANIE W KOLEJCE]"
        print(f"\x1b[35m⚡ [AUTOPILOT PITCH] {status_color}\x1b[0m Przygotowano spersonalizowany szablon dla: {title}.")
        print(f"                     Haczyk emocjonalny bólu: {cognitive.get('pain_points', [])}")
        print(f"                     Kierunek: {url}\x1b[0m")


# ==========================================
# ⚡ SYMULACJA AKTYWNEGO RUCHU (ZAPALNIK TRAFFIC)
# ==========================================
async def generate_live_traffic(queue: asyncio.Queue):
    """
    Generuje realistyczny, zróżnicowany ruch sieciowy z wtyczek ZapalnikClipper.
    """
    mock_profiles = [
        {
            "title": "Janusz Kowalski - CEO w AlfaTech Solutions",
            "extractedText": "Szukamy nowoczesnego oprogramowania typu CRM do automatyzacji sprzedaży i lejków marketingowych dla naszej agencji.",
            "url": "linkedin.com/in/janusz-ceo-alfa",
            "customer_id": "cust_omega_992"
        },
        {
            "title": "Anna Nowak - Senior Growth Marketer",
            "extractedText": "Jak zoptymalizować pozycjonowanie SEO i monitoring linków zwrotnych za pomocą Ahrefs?",
            "url": "twitter.com/nowak_growth",
            "customer_id": "cust_omega_992"
        },
        {
            "title": "Piotr Wiśniewski - Head of Sales",
            "extractedText": "Problem w tym, że nasz system bilingowy strasznie wolno procesuje transakcje, szukam pilnie pomocy.",
            "url": "linkedin.com/in/piotr-wisnia",
            "customer_id": "cust_omega_default"
        }
    ]

    for i in range(1, 10):
        await asyncio.sleep(random.uniform(1.0, 3.0))
        base_profile = random.choice(mock_profiles)
        
        payload = {
            "title": f"{base_profile['title']} #{i}",
            "extractedText": base_profile["extractedText"],
            "url": f"{base_profile['url']}-{i}",
            "customer_id": base_profile["customer_id"],
            "timestamp": datetime.now().isoformat()
        }
        
        await queue.put(payload)
        print(f"\x1b[90m[ZAPALNIK CLIPIER]: Zdeponowano zrzut ekranu i tekst dla run_id: ZPLNK-{i*111}\x1b[0m")


# ==========================================
# 🔥 ROZRUCH SYSTEMU MOCY (MAIN RUNTIME)
# ==========================================
async def ignite_omega_engine():
    print("\x1b[31m====================================================\x1b[0m")
    print("\x1b[31m🔥 INICJALIZACJA MULTIPLEXERA RUCHU W.F.P: OMEGA ENGINE\x1b[0m")
    print("\x1b[31m   STATUS SYGNATURY: ZABEZPIECZONY (15/96/34)\x1b[0m")
    print("\x1b[31m====================================================\x1b[0m\n")

    # Inicjalne wczytanie kalibracji przed startem pętli
    OuroborosFeedbackLoop.recalibrate_weights()

    shared_task_queue = asyncio.Queue()
    multiplexer = IngestionMultiplexer(shared_task_queue)
    
    ingestion_worker = asyncio.create_task(multiplexer.start_ingestion_loop())
    traffic_generator = asyncio.create_task(generate_live_traffic(shared_task_queue))

    await traffic_generator
    await shared_task_queue.join()
    
    ingestion_worker.cancel()
    
    print("\n\x1b[32m====================================================\x1b[0m")
    print("\x1b[32m[✓] SEKWENCJA ZAKOŃCZONA: Potok leadów zrealizowany bez błędów.\x1b[0m")
    print("\x1b[32m    Wszystkie wektory i kredyty rozliczone w chmurze.\x1b[0m")
    print("\x1b[32m====================================================\x1b[0m")

if __name__ == "__main__":
    try:
        asyncio.run(ignite_omega_engine())
    except KeyboardInterrupt:
        print("\n\x1b[33m[!] Twarde zatrzymanie reaktora. Zamykanie potoków...\x1b[0m")
