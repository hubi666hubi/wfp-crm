import os
import sys
import asyncio

# Ensure backend path is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.security.validation_sandbox import ValidationSandbox, SystemPatch

class ThirdEyeAudit:
    def __init__(self, target_filepath: str):
        self.target_filepath = target_filepath
        self.errors = []

    async def perform_audit(self) -> bool:
        if not os.path.exists(self.target_filepath):
            self.errors.append(f"Target file missing: {self.target_filepath}")
            return False

        with open(self.target_filepath, "r", encoding="utf-8") as f:
            code = f.read()

        sandbox = ValidationSandbox()
        patch = SystemPatch(
            issue_id="AUDIT-1",
            target_file_path=self.target_filepath,
            patch_notes="Full file audit",
            new_code=code,
            confidence_score=1.0
        )
        
        report = await sandbox.validate_patch(patch)
        
        if not report.is_valid:
            self.errors.extend(report.errors)
            return False
            
        return True

async def main():
    target = "backend/app/routers/subscriptions.py"
    auditor = ThirdEyeAudit(target)
    success = await auditor.perform_audit()

    if success:
        print("[THIRD EYE AUDIT] PASS: No syntax, security or raw formatting anomalies detected.")
        sys.exit(0)
    else:
        print("[THIRD EYE AUDIT] FAIL: Validation failed with the following issues:")
        for err in auditor.errors:
            print(f" - {err}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
