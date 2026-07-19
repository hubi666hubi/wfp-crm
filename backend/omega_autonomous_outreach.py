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

# Import agenta z ADK
from adk_sales_agent import run_adk_agent, ADK_AVAILABLE

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
            
    print(Fore.YELLOW + "\n>>> Przejście w tryb nasłuchu IMAP (Inbound Listener)...")
    
    # KROK 2: NASŁUCH INBOUND (Pętla nieskończona)
    while True:
        if LIVE_MODE:
            print(Fore.CYAN + "[IMAP] Sprawdzanie nowych odpowiedzi od klientów...")
            replies = mail_client.fetch_unread_replies()
            if not replies:
                time.sleep(15)
                continue
                
            for reply in replies:
                sender = reply['from']
                objection = reply['body']
                print(Fore.RED + f"\n[INBOUND] NOWA WIADOMOŚĆ od {sender}!")
                print(Fore.WHITE + f"    Treść: '{objection[:100]}...'")
                
                print(Fore.YELLOW + "\n[OMEGA ENGINE] Rozpoznano Obiekcję. Przekazano do wirtualnego asystenta (Google ADK + RAG).")
                prompt = f"Klient {sender} napisał: '{objection}'. Odpisz krótko, agresywnie i konkretnie zbij tę obiekcję powołując się na naszą przewagę jako W.F.P CRM."
                
                print(Fore.BLUE + ">>> Generowanie kontry z użyciem wiedzy RAG...")
                try:
                    riposta = await run_adk_agent(prompt)
                except Exception as e:
                    riposta = f"Wystąpił błąd silnika: {str(e)}"
                    
                print(Fore.GREEN + Style.BRIGHT + "\n[OUTBOUND] AUTONOMICZNA ODPOWIEDŹ WYSYŁANA PRZEZ SMTP...")
                success = mail_client.send_email(sender, "Re: " + reply['subject'], riposta)
                if success:
                    print(Fore.GREEN + "[SMTP] Odpowiedź wysłana!")
                else:
                    print(Fore.RED + "[SMTP] Błąd wysyłania odpowiedzi.")
            time.sleep(15)
        else:
            # Tryb MOCK INBOUND
            time.sleep(3)
            target = "cto@techstartup.com"
            print(Fore.RED + f"\n[INBOUND MOCK] NOWA WIADOMOŚĆ od {target}!")
            objection = "Cześć. Brzmi ciekawie, ale mamy już wdrożonego HubSpot'a i szczerze mówiąc, Wasze rozwiązanie wydaje się być sporo droższe i skomplikowane we wdrożeniu. Dlaczego mielibyśmy migrować?"
            print(Fore.WHITE + f"    Treść: '{objection}'")
            
            print(Fore.YELLOW + "\n[OMEGA ENGINE] Przekazano do wirtualnego asystenta (Google ADK + RAG).")
            prompt = f"Klient napisał: '{objection}'. Odpisz krótko, zbij obiekcję powołując się na przewagę OMEGA Command Center nad HubSpot."
            
            try:
                riposta = await run_adk_agent(prompt)
            except Exception as e:
                riposta = f"Wystąpił błąd silnika: {str(e)}"
                
            print(Fore.GREEN + Style.BRIGHT + "\n[OUTBOUND MOCK] AUTONOMICZNA ODPOWIEDŹ WYSŁANA!")
            print(Fore.WHITE + f"    Treść riposty:\n    {riposta.strip()}")
            break # W trybie mock kończymy po jednym przebiegu

    if not LIVE_MODE:
        print(Fore.CYAN + Style.BRIGHT + "\n===============================================")
        print(Fore.CYAN + Style.BRIGHT + "   ZADANIE ZAKOŃCZONE. SYSTEM PRZESZEDŁ W TRYB CZUWANIA.")
        print(Fore.CYAN + Style.BRIGHT + "===============================================")

if __name__ == "__main__":
    try:
        asyncio.run(autonomous_outreach_loop())
    except KeyboardInterrupt:
        print("\n[SYSTEM] Zatrzymano ręcznie.")
