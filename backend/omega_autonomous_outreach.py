import asyncio
import json
import os
import time
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

try:
    from colorama import init, Fore, Style
    init(autoreset=True)
except ImportError:
    class Fore:
        CYAN = ""
        YELLOW = ""
        RED = ""
        GREEN = ""
        MAGENTA = ""
        WHITE = ""
        BLUE = ""
    class Style:
        BRIGHT = ""

if "GEMINI_API_KEY" in os.environ:
    del os.environ["GEMINI_API_KEY"]

# Import agenta z ADK
from adk_sales_agent import run_adk_agent, ADK_AVAILABLE
from omega_agentic_commerce import AgenticCommerceEngine

def load_leads():
    leads_path = os.path.join("..", "data", "reports", "wfp_leads_report.json")
    if os.path.exists(leads_path):
        with open(leads_path, "r", encoding="utf-8") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []

async def autonomous_outreach_loop():
    print(Fore.CYAN + Style.BRIGHT + "===============================================")
    print(Fore.CYAN + Style.BRIGHT + "   OMEGA HEADLESS AUTONOMOUS SALES ENGINE")
    print(Fore.CYAN + Style.BRIGHT + "===============================================")
    print(Fore.YELLOW + ">>> Inicjalizacja podsystemów...")
    time.sleep(1)
    
    if not ADK_AVAILABLE:
        print(Fore.RED + "[UWAGA] Moduł Google ADK niedostępny! Użyto fallback mocka.")
        
    try:
        from mail_client import OmegaMailClient
        mail_client = OmegaMailClient()
        LIVE_MODE = True
        print(Fore.GREEN + "[SYSTEM] Pomyślnie załadowano konfigurację poczty SMTP/IMAP ze zmiennych środowiskowych. LIVE MODE AKTYWNY.")
    except Exception as e:
        LIVE_MODE = False
        mail_client = None
        print(Fore.RED + f"[UWAGA] Brak konfiguracji e-mail w .env ({e}).")
        print(Fore.RED + ">>> Uruchamiam tryb MOCK (lokalna symulacja logów). Uzupełnij EMAIL_ADDRESS i EMAIL_PASSWORD, aby aktywować wysyłkę.")
    
    leads = load_leads()
    if not leads:
        print(Fore.YELLOW + ">>> Brak zapisanych leadów w JSON. Inicjalizuję Mock Leada...")
        leads = [{"email": "cto@techstartup.com", "source": "LinkedIn", "context": "Szukają nowego CRMa"}]
        
    print(Fore.GREEN + f">>> Załadowano do kolejki {len(leads)} leadów operacyjnych.")
    print(Fore.CYAN + Style.BRIGHT + "===============================================\n")
    
    # KROK 1: WYSYŁKA OUTBOUND
    for lead in leads:
        target = lead.get("email", "unknown@lead.com")
        subject = "Scentralizowana kontrola nad sprzedażą ⚡"
        body = "Cześć,\n\nWidzę, że mocno inwestujecie w outbound. Mam jednak twarde dane pokazujące, że większość dobrze rozgrzanych leadów umiera na etapie zbijania obiekcji cenowych.\n\nDlatego stworzyliśmy OMEGA Command Center. Gdy lead mówi 'za drogo', natychmiast wrzucamy na ekran handlowca gotowy skrypt RAG.\n\nMogę nagrać krótkie wideo? Daj znać.\n\nPozdrawiam,\nW.F.P CRM"
        
        print(Fore.MAGENTA + f"[OUTBOUND] Generowanie i wysyłka Cold Email do: {target}")
        if LIVE_MODE:
            success = mail_client.send_email(target, subject, body)
            if success:
                print(Fore.GREEN + f"[SMTP] Prawdziwa wiadomość wysłana pomyślnie do {target}.")
            else:
                print(Fore.RED + f"[SMTP] Błąd wysyłki do {target}.")
        else:
            time.sleep(1)
            print(Fore.GREEN + f"[MOCK] Wiadomość doręczona pomyślnie do {target}.")
            
    # KROK 2: NASŁUCH INBOUND (Broker Skrzynki)
    print(Fore.YELLOW + "\n>>> Przejście w tryb Inbox Broker (Nasłuch IMAP raz na cykl)...")
    if LIVE_MODE:
        print(Fore.CYAN + "[IMAP] Sprawdzanie nowych odpowiedzi od klientów...")
        replies = mail_client.fetch_unread_replies()
        if not replies:
            print(Fore.WHITE + "[IMAP] Brak nowych odpowiedzi.")
        else:
            for reply in replies:
                sender = reply['from']
                message_body = reply['body']
                print(Fore.RED + f"\n[INBOUND] NOWA WIADOMOŚĆ od {sender}!")
                print(Fore.WHITE + f"    Treść: '{message_body[:100]}...'")
                
                print(Fore.YELLOW + "\n[OMEGA CLASSIFIER] Klasyfikacja intencji (Google ADK)...")
                prompt = f"Oceń intencję odpowiedzi od leada: '{message_body}'. Odpowiedz jednym słowem: SPOTKANIE (chce calla), CENA (pyta o koszty) lub NIE."
                
                try:
                    intent = await run_adk_agent(prompt)
                    intent = intent.strip().upper()
                except Exception as e:
                    intent = "NIE"
                    print(f"Błąd klasyfikacji: {str(e)}")
                    
                if "CENA" in intent:
                    print(Fore.GREEN + Style.BRIGHT + "\n[AGENTIC COMMERCE] 🔥 Klient pyta o cenę! Przejmowanie negocjacji...")
                    commerce_engine = AgenticCommerceEngine()
                    # Hardcodujemy score 85 dla symulacji
                    commerce_reply = await commerce_engine.handle_pricing_inquiry(message_body, 85)
                    print(Fore.WHITE + f"    Agent wynegocjował i przygotował Checkout:\n{commerce_reply}")
                    
                    if mail_client.send_email(sender, "Re: Scentralizowana kontrola nad sprzedażą", commerce_reply):
                        print(Fore.GREEN + "[SMTP] Wysłano odpowiedź z linkiem do zapłaty (Stripe).")
                        
                elif "SPOTKANIE" in intent:
                    print(Fore.GREEN + Style.BRIGHT + "\n[BROKER ALERT] 🔥 ZNALEZIONO HOT LEADA (Spotkanie)! Wysyłanie do partnerów...")
                    broker_msg = f"🚨 HOT LEAD ALERT 🚨\n\nFirma z adresu {sender} zgadza się na 15-minutowy call.\nOto treść ich odpowiedzi:\n\n{message_body}\n\nKto pierwszy przeleje $500, otrzymuje kontakt. Odpisz na ten e-mail z potwierdzeniem."
                    success = mail_client.send_email("partners@wfp-crm.local", "🔥 HOT LEAD DO WZIĘCIA: " + sender, broker_msg)
                    if success:
                        print(Fore.GREEN + "[SMTP] Powiadomienie do partnerów wysłane pomyślnie!")
                else:
                    print(Fore.WHITE + "\n[BROKER] Odpowiedź negatywna lub neutralna. Ignorowanie leada.")
    else:
        # Tryb MOCK INBOUND
        time.sleep(3)
        target = "ceo@netguru.com"
        print(Fore.RED + f"\n[INBOUND MOCK] NOWA WIADOMOŚĆ od {target}!")
        message_body = "Brzmi to ciekawie, faktycznie mamy problem z wyciekiem leadów. Zdzwońmy się w czwartek o 14:00."
        print(Fore.WHITE + f"    Treść: '{message_body}'")
        
        print(Fore.YELLOW + "\n[OMEGA CLASSIFIER] Klasyfikacja intencji (Google ADK)...")
        prompt = f"Oceń intencję odpowiedzi od leada: '{message_body}'. Odpowiedz jednym słowem: SPOTKANIE (chce calla), CENA (pyta o koszty) lub NIE."
        
        try:
            intent = await run_adk_agent(prompt)
            intent = intent.strip().upper()
        except Exception as e:
            intent = f"CENA (Błąd: {str(e)} - wymuszam mock)"
            
        print(Fore.WHITE + f"    Klasyfikacja: '{intent}'")
        if "CENA" in intent:
            print(Fore.GREEN + Style.BRIGHT + "\n[AGENTIC COMMERCE MOCK] 🔥 Klient pyta o cenę! Przejmowanie negocjacji...")
            commerce_engine = AgenticCommerceEngine()
            commerce_reply = await commerce_engine.handle_pricing_inquiry(message_body, 90)
            print(Fore.WHITE + f"    Wysłano e-mail zwrotny z ofertą i linkiem Stripe:\n\n{commerce_reply}")
        elif "SPOTKANIE" in intent:
            print(Fore.GREEN + Style.BRIGHT + "\n[BROKER ALERT MOCK] 🔥 ZNALEZIONO HOT LEADA! Wysyłanie oferty do agencji...")
            broker_msg = f"🚨 HOT LEAD ALERT 🚨\n\nFirma z adresu {target} zgadza się na 15-minutowy call.\nOto treść ich odpowiedzi:\n\n{message_body}\n\nKto pierwszy przeleje $500, otrzymuje kontakt."
            print(Fore.WHITE + f"    Wysłano e-mail do agencji partnerskich:\n\n{broker_msg}")

    if not LIVE_MODE:
        print(Fore.CYAN + Style.BRIGHT + "\n===============================================")
        print(Fore.CYAN + Style.BRIGHT + "   ZADANIE ZAKOŃCZONE. SYSTEM PRZESZEDŁ W TRYB CZUWANIA.")
        print(Fore.CYAN + Style.BRIGHT + "===============================================")

if __name__ == "__main__":
    try:
        asyncio.run(autonomous_outreach_loop())
    except KeyboardInterrupt:
        print("\n[SYSTEM] Zatrzymano ręcznie.")
