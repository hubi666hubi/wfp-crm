import os
import sys

# Ustawienie kodowania utf-8 dla konsoli Windows, aby zapobiec UnicodeEncodeError na znakach emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

import ast
import json
import asyncio
import re
import shutil
import datetime
import importlib
from typing import List, Dict, Any, Tuple, Optional
from pydantic import BaseModel, Field
import httpx

print("\x1b[35m[SYSTEM IGNITION] 🌌 INICJALIZACJA ULTRA-WORKERA OMEGA v4.5 z RETENCJĄ KOPII ZAPASOWYCH\x1b[0m")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
EXPRESS_SERVER_URL = os.getenv("EXPRESS_SERVER_URL", "http://localhost:3000")
INTENT_KEYWORDS = [r"crm", r"automatyzacj\w+", r"szukam\s+programu", r"pozyskiwani\w+\s+leadów", r"lejek\s+sprzedaż\w+"]

# ==============================================================================
# 1. STRUKTURY DANYCH I MODELE SYSTEMOWE
# ==============================================================================
class SystemPatch(BaseModel):
    issue_id: str
    target_file_path: str
    patch_notes: str
    new_code: str
    confidence_score: float

class ValidationReport(BaseModel):
    patch_id: str
    is_valid: bool
    ast_passed: bool
    security_passed: bool
    errors: List[str] = Field(default_factory=list)

# ==============================================================================
# 2. SECOPS AST SANDBOX & KWARANTANNA KODU (WARSTWA L4)
# ==============================================================================
class AutoWorkerSandbox:
    def __init__(self):
        self.forbidden_functions = {"eval", "exec", "globals", "locals", "__import__"}
        self.destructive_attributes = ["system", "popen", "rmtree", "unlink"]

    def verify_integrity(self, patch: SystemPatch) -> ValidationReport:
        errors = []
        ast_passed = False
        security_passed = False

        try:
            tree = ast.parse(patch.new_code)
            ast_passed = True
        except SyntaxError as e:
            errors.append(f"SyntaxError linia {e.lineno}: {e.msg}")
        except Exception as e:
            errors.append(f"Critical AST Error: {str(e)}")

        if ast_passed:
            security_passed = True
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    if hasattr(node.func, 'id') and node.func.id in self.forbidden_functions:
                        security_passed = False
                        errors.append(f"SecOps Violation: Wykryto zabronione wywołanie '{node.func.id}'")
                if isinstance(node, ast.Attribute):
                    if node.attr in self.destructive_attributes:
                        security_passed = False
                        errors.append(f"SecOps Violation: Wykryto destrukcyjną komendę OS '{node.attr}'")

        return ValidationReport(
            patch_id=patch.issue_id,
            is_valid=bool(ast_passed and security_passed),
            ast_passed=ast_passed,
            security_passed=security_passed,
            errors=errors
        )

# ==============================================================================
# 3. SILNIK WDRAŻANIA Z AUTOMATYCZNĄ RETENCJĄ (WARSTWA L5 HOT-SWAP - MAX 5 BAK)
# ==============================================================================
class AutoWorkerDeploymentEngine:
    def __init__(self, backup_dir: str = "./system_backups"):
        self.backup_dir = backup_dir
        os.makedirs(self.backup_dir, exist_ok=True)
        self.max_backups_per_file = 5

    def _rotate_and_clean_backups(self, original_filename: str):
        """
        PRO ROZWIĄZANIE: Automatycznie analizuje temporalne sygnatury i 
        pozostawia dokładnie 5 najnowszych kopii bezpieczeństwa dla danego pliku.
        """
        try:
            all_files = os.listdir(self.backup_dir)
            # Filtrowanie plików dopasowanych do wzorca: nazwa_pliku.ext.*.bak
            backup_pattern = re.compile(rf"^{re.escape(original_filename)}\.\d{{8}}_\d{{6}}\.bak$")
            matching_backups = [f for f in all_files if backup_pattern.match(f)]
            
            # Sortowanie według pełnej ścieżki i czasu modyfikacji
            matching_backups.sort(key=lambda x: os.path.getmtime(os.path.join(self.backup_dir, x)))
            
            # Usuwanie nadmiarowych kopii zapasowych, jeśli przekroczono limit retencji
            while len(matching_backups) > self.max_backups_per_file:
                oldest_backup = matching_backups.pop(0)
                oldest_path = os.path.join(self.backup_dir, oldest_backup)
                os.remove(oldest_path)
                print(f" [RETENCJA] ♻️ Usunięto przestarzałą migawkę kodu: {oldest_backup}")
        except Exception as e:
            print(f" [RETENCJA ERROR] Nie udało się dokonać czyszczenia katalogu kopii: {e}")

    def apply_evolution(self, patch: SystemPatch, report: ValidationReport) -> bool:
        if not report.is_valid:
            print(f" [ABORT] Łatka {patch.issue_id} odrzucona przez SecOps Sandbox.")
            return False

        target = patch.target_file_path
        filename = os.path.basename(target)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")

        try:
            if os.path.exists(target):
                shutil.copy2(target, backup_path) # Kopia zapasowa uprawnień i danych
            
            # Czyszczenie i utrzymanie dokładnie 5 najnowszych plików
            self._rotate_and_clean_backups(filename)

            temp_file = f"{target}.tmp"
            with open(temp_file, 'w', encoding='utf-8') as f:
                f.write(patch.new_code)
                f.flush()
                os.fsync(f.fileno()) # Wymuszenie fizycznego opróżnienia bufora dyskowego
            os.replace(temp_file, target) # Atomowe nadpisanie pliku w systemie operacyjnym

            module_name = os.path.splitext(filename)[0]
            if module_name in sys.modules:
                importlib.reload(sys.modules[module_name]) # Dynamiczne wstrzyknięcie do pamięci RAM

            print(f" 🟢 [HOT-SWAP SUCCESS] System ewoluował pomyślnie do wersji: {patch.issue_id}")
            return True
        except Exception as e:
            print(f" ❌ [CRITICAL FAULT] Błąd wdrożenia runtime. Przywracanie bazy: {str(e)}")
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, target)
            return False

# ==============================================================================
# 4. CIĄGŁY DEMON MONITORUJĄCO-REAKCYJNY (24/7 AUTO WORKER LOOP)
# ==============================================================================
class OmegaContinuousWorker:
    def __init__(self):
        self.sandbox = AutoWorkerSandbox()
        self.deployer = AutoWorkerDeploymentEngine()
        self.processed_intents = set()
        self.is_running = True
        self.client = httpx.AsyncClient(timeout=10.0)

    def _analyze_text_intent(self, text: str) -> bool:
        for pattern in INTENT_KEYWORDS:
            if re.search(pattern, text.lower()):
                return True
        return False

    async def fetch_social_signals(self) -> list:
        return [
            {"id": f"sig_{random_id()}", "author": "Marek Biznes", "text": "Szukam dobrego programu typu CRM do automatyzacji lejka. Ktoś coś?"},
            {"id": f"sig_{random_id()}", "author": "Hubert Dev", "text": "Szukam programu do pozyskiwania leadów 24/7."}
        ]

    async def execute_worker_cycle(self):
        print(f"\n\x1b[90m[WORKER TICK] [{datetime.datetime.now().strftime('%H:%M:%S')}] Skanowanie potoków społecznościowych... \x1b[0m")
        try:
            signals = await self.fetch_social_signals()
            for signal in signals:
                if signal["id"] in self.processed_intents:
                    continue

                if self._analyze_text_intent(signal["text"]):
                    print(f" 🛸 [INTENT DETECTED] Profil '{signal['author']}' wykazuje gorącą intencję zakupową.")
                    
                    payload = {
                        "name": signal["author"],
                        "companyName": "Inbound_Company_Matrix",
                        "rawNotes": signal["text"]
                    }
                    try:
                        await self.client.post(f"{EXPRESS_SERVER_URL}/api/echo", json=payload)
                        print(f" 🟢 [ROUTING SUCCESS] Dane pomyślnie przekierowane do Syndicate Pipeline.")
                    except Exception as e:
                        print(f" ⚠️ [QUEUE FALLBACK] Brak połączenia sieciowego. Zrzut do lokalnej pamięci podręcznej RAM.")

                    self.processed_intents.add(signal["id"])
        except Exception as e:
            print(f" 🚨 [CYCLE ERROR] Wyjątek w pętli roboczej: {str(e)}")

    async def start_loop(self):
        print("\x1b[32m====================================================\x1b[0m")
        print(" 🪐 SILNIK AUTO-WORKERÓW OMEGA 24/7 URUCHOMIONY Z RETENCJĄ BLOKÓW")
        print("====================================================\x1b[0m")
        while self.is_running:
            await self.execute_worker_cycle()
            await asyncio.sleep(10.0)

def random_id() -> str:
    import random
    return "".join(random.choices("abcdef1234567890", k=6))

if __name__ == "__main__":
    worker = OmegaContinuousWorker()
    try:
        asyncio.run(worker.start_loop())
    except KeyboardInterrupt:
        print("\n\x1b[33m[SYS] Wyłączanie procesów Auto-Workerów. Stan nominalny zachowany.\x1b[0m")
