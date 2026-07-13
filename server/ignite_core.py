import asyncio
import json
from meta_generator_architecture import MetaGeneratorService, CriticDossier
from validation_sandbox import ValidationSandbox, SystemPatch

async def ignite_core():
    print("\x1b[31m[!] INICJALIZACJA OMEGA CORE: PYTHON LINK...\x1b[0m")
    
    print("\x1b[35m[L3] Budzenie Meta-Generatora (Sztuczna Inteligencja / DEMONICA)...\x1b[0m")
    generator = MetaGeneratorService()
    
    print("\x1b[36m[L4] Ładowanie Środowiska Piaskownicy (Validation Sandbox)...\x1b[0m")
    sandbox = ValidationSandbox()

    print("\n\x1b[33m[WATCHDOG] Otrzymano Krytyczny Raport (Critic Dossier). Rozpoczynam trawinie...\x1b[0m")
    
    # Symulacja danych wejściowych od systemu monitorującego (Warstwa 2)
    dossier = CriticDossier(
        issue_id="ERR-992-OMEGA",
        issue_type="LATENCY_BOTTLENECK",
        target_file_path="/src/core/data_bus.py",
        current_code="def process_bus_data(data):\n    # Slow sync process\n    return [d * 2 for d in data]",
        error_logs="Warning: Synchronous execution blocking main thread for 400ms. Traffic drop detected.",
        critic_analysis="Pętla blokuje główny wątek serwera. Konieczne wdrożenie asynchronicznego I/O (asyncio) aby zoptymalizować przepustowość."
    )

    print(f"\x1b[90m> Cel: {dossier.target_file_path} | Błąd: {dossier.issue_type}\x1b[0m")

    # Krok 1: Generowanie kodu przez AI
    print("\n\x1b[35m[L3] Rozpoczynam Syntezę Kodu (LLM API Request)...\x1b[0m")
    patch = await generator.synthesize_upgrade(dossier)
    
    print(f"\x1b[35m[L3] Wygenerowano kod z pewnością: {patch.confidence_score * 100}%\x1b[0m")
    print(f"\x1b[90m--- NOWY KOD ---\n{patch.new_code}\n----------------\x1b[0m")

    # Krok 2: Weryfikacja kodu przez Sandbox
    print("\n\x1b[36m[L4] Przekazywanie ładunku do Sandboxa w celu weryfikacji AST i Bezpieczeństwa...\x1b[0m")
    report = await sandbox.validate_patch(patch)
    
    # Krok 3: Wynik operacji
    if report.is_valid:
        print(f"\n\x1b[32m[SUCCESS] Łatka {report.patch_id} przeszła pomyślnie wszystkie testy kwarantanny.\x1b[0m")
        print("\x1b[32m[+] ZABEZPIECZONO. Gotowe do hot-swapu w głównej matrycy!\x1b[0m")
    else:
        print(f"\n\x1b[31m[FAILED] Łatka {report.patch_id} odrzucona przez protokoły bezpieczeństwa!\x1b[0m")
        print(f"\x1b[31mPowód:\x1b[0m {report.errors}")

if __name__ == "__main__":
    asyncio.run(ignite_core())
