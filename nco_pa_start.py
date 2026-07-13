import asyncio
import json
import random
import time
from datetime import datetime
from server.meta_generator_architecture import MetaGeneratorService, CriticDossier
from server.validation_sandbox import ValidationSandbox, SystemPatch

# ==========================================
# 1. DEMON PRZETWARZANIA LEADÓW (DATA PIPELINE)
# ==========================================
async def lead_ingestion_daemon(queue: asyncio.Queue):
    """
    Ten demon symuluje agresywne ssanie danych z reaktora Node.js.
    Przetwarza pakiety zebrane przez ZapalnikClipper w czasie rzeczywistym.
    """
    print("\x1b[32m[+] LEAD DAEMON: Aktywny. Oczekiwanie na pakiety danych...\x1b[0m")
    
    while True:
        try:
            # Pobieranie paczki danych z kolejki
            packet = await queue.get()
            start_time = time.time()
            
            # Symulacja ciężkiego przetwarzania (NLP, klasyfikacja, scoring)
            await asyncio.sleep(random.uniform(0.1, 0.5)) 
            
            processing_time = (time.time() - start_time) * 1000
            print(f"\x1b[36m[DATA MATRIX]\x1b[0m Przetworzono cel: \x1b[37m{packet['url']}\x1b[0m | Scoring: \x1b[33m{packet['score']}%\x1b[0m | Czas: {processing_time:.2f}ms")
            
            queue.task_done()
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"\x1b[31m[!] Błąd w potoku danych: {e}\x1b[0m")

async def simulate_incoming_traffic(queue: asyncio.Queue):
    """Symuluje potężny ruch przychodzący z Twoich wtyczek ZapalnikClipper."""
    targets = ["linkedin.com/in/ceo-tech", "crunchbase.com/org/alpha", "github.com/lead-dev", "twitter.com/crypto-whale"]
    
    for i in range(1, 15):
        await asyncio.sleep(random.uniform(0.2, 1.5))
        payload = {
            "id": f"ZPLNK-{i*992}",
            "url": random.choice(targets) + f"-{i}",
            "score": random.randint(45, 99),
            "timestamp": datetime.now().isoformat()
        }
        await queue.put(payload)
        print(f"\x1b[90m[ZAPALNIK] Zrzut ładunku do kolejki: {payload['id']}\x1b[0m")

# ==========================================
# 2. AUTO-EWOLUCJA (SYSTEM SAMONAPRAWCZY)
# ==========================================
async def evolutionary_watchdog():
    """
    Główny rdzeń samonaprawczy. Jeśli system wykryje wąskie gardło,
    budzi AI do napisania nowej łatki i przepuszcza ją przez Sandbox.
    """
    print("\x1b[35m[L3] Budzenie Meta-Generatora (DEMONICA)...\x1b[0m")
    generator = MetaGeneratorService()
    
    print("\x1b[34m[L4] Ładowanie Środowiska Walidacyjnego (Sandbox)...\x1b[0m")
    sandbox = ValidationSandbox()

    await asyncio.sleep(2) # Czekamy chwilę, aż system zacznie działać

    print("\n\x1b[41m\x1b[37m [WATCHDOG CRITICAL ALERT] \x1b[0m\x1b[31m Wykryto spadek wydajności potoku danych!\x1b[0m")
    
    # Payload usterki
    dossier = CriticDossier(
        issue_id="ERR-OMEGA-77",
        issue_type="MEMORY_LEAK_IN_PIPELINE",
        target_file_path="/src/core/data_pipeline.py",
        current_code="def parse(data): temp = []; [temp.append(d) for d in data]; return temp",
        error_logs="Heap memory overflow. Garbage collector unable to clear 2GB of dead objects.",
        critic_analysis="Pętla tworzy zbędne obiekty w pamięci. Przepisz używając generatorów w Pythonie."
    )

    print("\n\x1b[35m[L3] Rozpoczynam Syntezę Kodu Ratunkowego (LLM)...\x1b[0m")
    patch = await generator.synthesize_upgrade(dossier)
    
    print(f"\x1b[35m[L3] Wygenerowano kod. Pewność AI: {patch.confidence_score * 100}%\x1b[0m")
    
    print("\n\x1b[34m[L4] Przekazywanie do Sandboxa (Weryfikacja AST/Bezpieczeństwo)...\x1b[0m")
    report = await sandbox.validate_patch(patch)
    
    if report.is_valid:
        print(f"\x1b[32m[SUCCESS] Łatka {report.patch_id} zatwierdzona.\x1b[0m")
        print("\x1b[32m[+] AUTO-PATCHING ZAKOŃCZONY. System wraca do pełnej wydajności.\x1b[0m\n")
    else:
        print(f"\x1b[31m[FAILED] Łatka {report.patch_id} zablokowana przez zaporę!\x1b[0m")

# ==========================================
# 3. GŁÓWNY ZAPŁON (ASYNC EVENT LOOP)
# ==========================================
async def ignite_omega_core():
    print("\x1b[31m====================================================\x1b[0m")
    print("\x1b[31m[FIRE] INICJALIZACJA OMEGA CORE: HIGH-PERFORMANCE MATRIX\x1b[0m")
    print("\x1b[31m====================================================\x1b[0m\n")
    
    # Tworzymy szybką kolejkę w pamięci RAM
    task_queue = asyncio.Queue()

    # Odpalamy wszystkie demony równolegle w tle (Concurreny)
    ingestion_task = asyncio.create_task(lead_ingestion_daemon(task_queue))
    traffic_task = asyncio.create_task(simulate_incoming_traffic(task_queue))
    watchdog_task = asyncio.create_task(evolutionary_watchdog())

    # Główny wątek czeka na zakończenie symulacji ruchu
    await traffic_task
    
    # Czekamy, aż kolejka zostanie wyczyszczona
    await task_queue.join()
    
    # Zamykamy demony
    ingestion_task.cancel()
    await watchdog_task
    
    print("\n\x1b[32m[+] OMEGA CORE: Cykl operacyjny zakończony sukcesem. Zysk zmaksymalizowany.\x1b[0m")

if __name__ == "__main__":
    try:
        asyncio.run(ignite_omega_core())
    except KeyboardInterrupt:
        print("\n\x1b[33m[!] Twarde przerwanie. Zamykanie rdzeni...\x1b[0m")
