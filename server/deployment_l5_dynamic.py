# ==============================================================================
# WARSTWA 5 (L5): ATOMIC DEPLOYMENT ENGINE (HOT-SWAP & MEMORY DYNAMIC RE_IMPORT)
# ==============================================================================
import os
import sys
import shutil
import datetime
import importlib
from typing import Optional

try:
    from server.deployment_l5 import DeploymentEngine as BaseEngine, SystemPatch, ValidationReport
except ModuleNotFoundError:
    from deployment_l5 import DeploymentEngine as BaseEngine, SystemPatch, ValidationReport

class DeploymentEngine(BaseEngine):
    def __init__(self, backup_dir: str = "./system_backups"):
        super().__init__(backup_dir)

    def _create_snapshot(self, target_file_path: str) -> Optional[str]:
        if not os.path.exists(target_file_path):
            return None
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.basename(target_file_path)
        backup_path = os.path.join(self.backup_dir, f"{filename}.{timestamp}.bak")
        shutil.copy2(target_file_path, backup_path) # Kopia zapasowa uprawnień i metadanych pliku
        return backup_path

    def _execute_atomic_swap(self, target_file_path: str, new_code: str) -> bool:
        """
        Zapisuje nową zawartość do pliku tymczasowego, a następnie wykonuje atomową 
        operację zmiany nazwy, aby unikać uszkodzenia plików podczas zapisu.
        """
        temp_file_path = f"{target_file_path}.tmp"
        try:
            parent_dir = os.path.dirname(target_file_path)
            if parent_dir and not os.path.exists(parent_dir):
                os.makedirs(parent_dir, exist_ok=True)
            
            with open(temp_file_path, 'w', encoding='utf-8') as f:
                f.write(new_code)
                f.flush()
                os.fsync(f.fileno()) # Wymuszenie fizycznego opróżnienia bufora dyskowego

            os.replace(temp_file_path, target_file_path) # Atomowe nadpisanie pliku w systemie POSIX/Windows
            return True
        except Exception as e:
            print(f"[DEPLOYMENT] [FATAL IO ERROR] during atomic swap: {e}")
            if os.path.exists(temp_file_path):
                os.remove(temp_file_path)
            return False

    def _dynamic_reload(self, target_file_path: str):
        """
        Injektuje zaktualizowany moduł bezpośrednio do puli pamięci podręcznej sys.modules 
        bez restartowania pętli zdarzeń aplikacji.
        """
        module_name = os.path.splitext(os.path.basename(target_file_path))[0]
        if module_name in sys.modules:
            print(f"[DEPLOYMENT] Przeładowanie istniejącego modułu w pamięci: {module_name}")
            importlib.reload(sys.modules[module_name])
        else:
            print(f"[DEPLOYMENT] Ładowanie nowego modułu do rejestru pamięci: {module_name}")
            importlib.import_module(module_name)

    async def activate_hot_swap(self, patch: SystemPatch, report: ValidationReport) -> bool:
        print(f"\n[DEPLOYMENT] Hot-Swap Sequence Started: {patch.issue_id}")
        if not report.is_valid:
            print("[DEPLOYMENT] Validation failed. Operation aborted.")
            return False

        # Zabezpieczenie stanu aktualnego przed mutacją pamięci dyskowej
        backup_path = self._create_snapshot(patch.target_file_path)

        # Zapis atomowy kodu
        write_success = self._execute_atomic_swap(patch.target_file_path, patch.new_code)
        if not write_success:
            self.rollback(patch.target_file_path, backup_path)
            return False

        try:
            # Dynamiczne wymuszenie przeładowania pamięci wykonawczej interpretatora
            self._dynamic_reload(patch.target_file_path)
            print(f"[DEPLOYMENT] [HOT-SWAP COMPLETE] Module dynamic injection passed.")
            return True
        except Exception as e:
            print(f"[DEPLOYMENT] [EXECUTION CRITICAL FAULT] Dynamic reload failed: {e}. Initiating rollback.")
            # Wyzwolenie procedury wycofania zmian i powrotu do punktu stabilnego
            self.rollback(patch.target_file_path, backup_path)
            try:
                self._dynamic_reload(patch.target_file_path)
            except Exception as rollback_err:
                print(f"[DEPLOYMENT] [FATAL OMEGA CORRUPTION] Rollback reload failed: {rollback_err}")
            return False
