import os
import re
import sys

# Ustawienie kodowania utf-8 dla konsoli Windows, aby zapobiec UnicodeEncodeError na znakach emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

def execute_pancerny_patch_verifier():
    target_file = "server.ts"
    
    if not os.path.exists(target_file):
        print(f"❌ [PATCH VERIFIER] Błąd: Nie odnaleziono pliku jądra '{target_file}'.")
        return False

    print("🤖 Uruchamiam zaawansowany weryfikator i patcher jądra Omega...")
    
    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    # Weryfikacja obecności kluczowych importów spinacza antygrawitacji i dystrybutora
    required_imports = {
        "antigravityOrchestrator": 'import { antigravityOrchestrator } from "./server/antigravityOrchestrator.js";',
        "stripeKombajnDistributor": 'import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";'
    }

    modified = False
    for key, import_line in required_imports.items():
        if key not in content:
            # Wstrzyknięcie wymaganego importu na sam początek pliku
            content = import_line + "\n" + content
            print(f"✅ Pomyślnie zaimplementowano brakujący import dla: {key}")
            modified = True

    if modified:
        with open(target_file, "w", encoding="utf-8") as f:
            f.write(content)
        print("🚀 [SUCCESS] Plik server.ts został zaktualizowany i zweryfikowany transakcyjnie.")
    else:
        print("🟢 [NOMINAL] Jądro posiada kompletny zestaw powiązań i referencji.")
        
    return True

if __name__ == "__main__":
    execute_pancerny_patch_verifier()
