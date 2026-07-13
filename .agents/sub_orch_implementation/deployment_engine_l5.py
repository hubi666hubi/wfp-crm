import os
import sys
import shutil
import datetime
import importlib
from sandbox_l4_harden import SystemPatch, ValidationReport

class DeploymentEngine:
    def __init__(self, backup_dir: str = "./system_backups"):
        self.backup_dir = backup_dir
        os.makedirs(self.backup_dir, exist_ok=True)

    def _create_snapshot(self, target_file_path: str) -> str:
        if not os.path.exists(target_file_path):
            with open(target_file_path, 'w') as f: f.write("# Initial node placeholder")
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_path = os.path.join(self.backup_dir, f"{os.path.basename(target_file_path)}.{timestamp}.bak")
        shutil.copy2(target_file_path, backup_path)
        return backup_path

    def _execute_atomic_swap(self, target_file_path: str, new_code: str) -> bool:
        temp_path = f"{target_file_path}.tmp"
        try:
            with open(temp_path, 'w', encoding='utf-8') as f:
                f.write(new_code)
                f.flush()
                os.fsync(f.fileno())
            os.replace(temp_path, target_file_path)
            return True
        except Exception:
            if os.path.exists(temp_path): os.remove(temp_path)
            return False

    def _dynamic_reload(self, target_file_path: str):
        module_name = os.path.splitext(os.path.basename(target_file_path))[0]
        if module_name in sys.modules:
            importlib.reload(sys.modules[module_name])
        else:
            importlib.import_module(module_name)

    async def activate_hot_swap(self, patch: SystemPatch, report: ValidationReport) -> bool:
        if not report.is_valid: return False
        backup_path = self._create_snapshot(patch.target_file_path)
        if not self._execute_atomic_swap(patch.target_file_path, patch.new_code):
            shutil.copy2(backup_path, patch.target_file_path)
            return False
        try:
            self._dynamic_reload(patch.target_file_path)
            return True
        except Exception:
            shutil.copy2(backup_path, patch.target_file_path)
            self._dynamic_reload(patch.target_file_path)
            return False
