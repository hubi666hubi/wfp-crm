"""
DEPLOYMENT L5 BRIDGE — Stdin/Stdout JSON interface for Node.js <-> Python IPC.

Reads JSON containing a 'patch' (SystemPatch) and a 'report' (ValidationReport),
executes the hot-swap sequence with snapshot backup and rollback guards,
and outputs a JSON deployment status report to stdout.
"""
import sys
import json
import asyncio
from deployment_l5 import DeploymentEngine, SystemPatch, ValidationReport


async def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            print(json.dumps({"success": False, "error": "No input received on stdin"}))
            sys.exit(1)
            
        data = json.loads(raw)
        
        patch_data = data.get("patch")
        report_data = data.get("report")
        backup_dir = data.get("backup_dir", "./system_backups")
        
        if not patch_data or not report_data:
            print(json.dumps({"success": False, "error": "Missing 'patch' or 'report' object in input JSON"}))
            sys.exit(1)
            
        # Parse into Pydantic models
        patch = SystemPatch(**patch_data)
        report = ValidationReport(**report_data)
        
        engine = DeploymentEngine(backup_dir=backup_dir)
        
        # We capture stdout/stderr prints from the engine during execution
        # but to keep it simple, we just run the hot-swap
        success = await engine.activate_hot_swap(patch, report)
        
        # Let's locate if a backup was created (most recent one in backup_dir for this filename)
        import os
        import glob
        backup_path = None
        if success:
            filename = os.path.basename(patch.target_file_path)
            backups = glob.glob(os.path.join(backup_dir, f"{filename}.*.bak"))
            if backups:
                backup_path = max(backups, key=os.path.getmtime)
                
        print(json.dumps({
            "success": success,
            "patch_id": patch.issue_id,
            "target_file_path": patch.target_file_path,
            "backup_path": backup_path,
            "message": "Evolution completed successfully." if success else "Evolution aborted or failed. Check validation report."
        }))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({
            "success": False,
            "patch_id": "UNKNOWN",
            "error": str(e),
            "message": f"Deployment bridge exception: {str(e)}"
        }))
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
