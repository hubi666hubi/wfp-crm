"""
Integration test for deployment_l5_bridge.py — tests active hot-swaps, validation abort gates, and backups.
"""
import subprocess
import json
import sys
import os
import shutil

test_target = "test_virtual_bus.py"
backup_dir = "./test_backups"

def setup_virtual_file():
    with open(test_target, "w", encoding="utf-8") as f:
        f.write("# Original system code\nprint('V1 active')\n")

def cleanup():
    if os.path.exists(test_target):
        os.remove(test_target)
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)

test_cases = [
    {
        "name": "Successful Hot-Swap Evolution",
        "input": {
            "patch": {
                "issue_id": "EVO-100",
                "target_file_path": test_target,
                "patch_notes": "Upgraded logic dynamically",
                "new_code": "# Upgraded system code\nprint('V2 running!')\n",
                "confidence_score": 0.99
            },
            "report": {
                "patch_id": "EVO-100",
                "is_valid": True,
                "ast_passed": True,
                "security_passed": True
            },
            "backup_dir": backup_dir
        },
        "expect_success": True,
        "expect_file_content": "# Upgraded system code\nprint('V2 running!')\n",
        "expect_backup": True
    },
    {
        "name": "Aborted Hot-Swap (Invalid Validation)",
        "input": {
            "patch": {
                "issue_id": "EVO-200",
                "target_file_path": test_target,
                "patch_notes": "Attempted malicious script swap",
                "new_code": "import os\nos.system('rm -rf /')\n",
                "confidence_score": 0.30
            },
            "report": {
                "patch_id": "EVO-200",
                "is_valid": False,
                "ast_passed": True,
                "security_passed": False
            },
            "backup_dir": backup_dir
        },
        "expect_success": False,
        "expect_file_content": "# Upgraded system code\nprint('V2 running!')\n",  # Remains V2 from previous test
        "expect_backup": False
    }
]

print("=" * 60)
print("  DEPLOYMENT L5 BRIDGE - INTEGRATION TEST")
print("=" * 60)

cleanup()
setup_virtual_file()

all_passed = True
try:
    for tc in test_cases:
        proc = subprocess.run(
            [sys.executable, "server/deployment_l5_bridge.py"],
            input=json.dumps(tc["input"]),
            capture_output=True, text=True, timeout=10
        )

        try:
            # The bridge prints logs, and outputs the JSON report as the final line
            lines = [l.strip() for l in proc.stdout.split("\n") if l.strip()]
            result = json.loads(lines[-1])
        except Exception:
            print(f"\n  [FAIL] {tc['name']}: Could not parse stdout as JSON. stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}")
            all_passed = False
            continue

        success_ok = result["success"] == tc["expect_success"]
        
        # Verify physical file contents
        with open(test_target, "r", encoding="utf-8") as f:
            current_content = f.read()
        content_ok = current_content == tc["expect_file_content"]
        
        # Verify backup existence
        backup_ok = True
        if tc["expect_backup"]:
            backup_ok = result.get("backup_path") is not None and os.path.exists(result["backup_path"])
        else:
            backup_ok = result.get("backup_path") is None

        passed = success_ok and content_ok and backup_ok
        if not passed:
            all_passed = False

        symbol = "OK" if passed else "XX"
        is_updated = current_content != "# Original system code\nprint('V1 active')\n"
        print(f"\n  [{symbol}] {tc['name']}")
        print(f"       success: {result['success']} (expected: {tc['expect_success']}) {'OK' if success_ok else 'MISMATCH'}")
        print(f"       content: {'UPDATED' if is_updated else 'ORIGINAL'} (expected content matches: {content_ok})")
        print(f"       backup:  {result.get('backup_path')} (expected exists: {tc['expect_backup']}) {'OK' if backup_ok else 'MISMATCH'}")

finally:
    cleanup()

print("\n" + "=" * 60)
print(f"  RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
print("=" * 60)
