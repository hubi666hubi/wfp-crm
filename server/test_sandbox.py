"""
Quick test for sandbox_l4_bridge.py via stdin pipe.
"""
import subprocess
import json
import sys

test_cases = [
    {
        "name": "Valid Code",
        "input": {
            "issue_id": "ERR-992-A",
            "new_code": "import asyncio\n\nasync def process_data(data):\n    return [d * 2 for d in data]"
        },
        "expect_valid": True
    },
    {
        "name": "Syntax Error",
        "input": {
            "issue_id": "ERR-992-B",
            "new_code": "def broken_function()\n    print('Missing colon!')"
        },
        "expect_valid": False
    },
    {
        "name": "Security Violation (os.system)",
        "input": {
            "issue_id": "ERR-992-C",
            "new_code": "import os\n\ndef clear_cache():\n    os.system('rm -rf /')"
        },
        "expect_valid": False
    },
    {
        "name": "Security Violation (eval)",
        "input": {
            "issue_id": "ERR-992-D",
            "new_code": "user_input = input()\nresult = eval(user_input)"
        },
        "expect_valid": False
    },
    {
        "name": "Security Violation (subprocess import)",
        "input": {
            "issue_id": "ERR-992-E",
            "new_code": "import subprocess\nsubprocess.run(['ls'])"
        },
        "expect_valid": False
    }
]

print("=" * 60)
print("  SANDBOX L4 BRIDGE - INTEGRATION TEST")
print("=" * 60)

all_passed = True
for tc in test_cases:
    proc = subprocess.run(
        [sys.executable, "server/sandbox_l4_bridge.py"],
        input=json.dumps(tc["input"]),
        capture_output=True, text=True, timeout=10
    )
    
    try:
        report = json.loads(proc.stdout)
    except:
        print(f"\n  [FAIL] {tc['name']}: Could not parse output: {proc.stdout} | stderr: {proc.stderr}")
        all_passed = False
        continue
    
    status = "PASS" if report["is_valid"] == tc["expect_valid"] else "FAIL"
    if status == "FAIL":
        all_passed = False
    
    symbol = "OK" if status == "PASS" else "XX"
    print(f"\n  [{symbol}] {tc['name']}")
    print(f"       patch_id: {report['patch_id']}")
    print(f"       is_valid: {report['is_valid']} (expected: {tc['expect_valid']})")
    print(f"       ast:      {report['ast_passed']}")
    print(f"       security: {report['security_passed']}")
    if report['errors']:
        print(f"       errors:   {report['errors']}")

print("\n" + "=" * 60)
print(f"  RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
print("=" * 60)
