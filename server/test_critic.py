"""
Integration test for critic_l2_bridge.py — tests analyze + execute modes.
"""
import subprocess
import json
import sys

test_cases = [
    {
        "name": "Analyze: TypeError (string + int concatenation)",
        "input": {
            "mode": "analyze",
            "code": 'def process(payload_id):\n    prefix = "ID: "\n    return prefix + payload_id',
            "error": "TypeError: can only concatenate str (not 'int') to str",
            "file_path": "/src/core/data_bus.py"
        },
        "expect_type": "TYPE_COERCION_FAULT",
        "expect_issues": True
    },
    {
        "name": "Analyze: Mutable default argument",
        "input": {
            "mode": "analyze",
            "code": "def append_to(item, target=[]):\n    target.append(item)\n    return target",
            "error": "Unexpected behavior with shared state",
            "file_path": "/src/utils/helpers.py"
        },
        "expect_type": "RUNTIME_EXCEPTION",
        "expect_issues": True
    },
    {
        "name": "Analyze: Bare except clause",
        "input": {
            "mode": "analyze",
            "code": "def risky():\n    try:\n        return 1/0\n    except:\n        pass",
            "error": "Silent failure in production",
            "file_path": "/src/handlers/payment.py"
        },
        "expect_type": "RUNTIME_EXCEPTION",
        "expect_issues": True
    },
    {
        "name": "Analyze: Clean code (no issues)",
        "input": {
            "mode": "analyze",
            "code": "def add(a: int, b: int) -> int:\n    return a + b",
            "error": "No error, testing clean path",
            "file_path": "/src/math/ops.py"
        },
        "expect_type": "RUNTIME_EXCEPTION",
        "expect_issues": False
    },
    {
        "name": "Execute: Runtime ZeroDivisionError",
        "input": {
            "mode": "execute",
            "code": "x = 1 / 0",
            "file_path": "/src/live/calc.py"
        },
        "expect_type": "RUNTIME_ZERODIVISIONERROR",
        "expect_issues": False
    },
    {
        "name": "Execute: Clean execution",
        "input": {
            "mode": "execute",
            "code": "result = sum(range(100))",
            "file_path": "/src/live/calc.py"
        },
        "expect_type": "NOMINAL",
        "expect_issues": False
    }
]

print("=" * 60)
print("  CRITIC L2 BRIDGE - INTEGRATION TEST")
print("=" * 60)

all_passed = True
for tc in test_cases:
    proc = subprocess.run(
        [sys.executable, "server/critic_l2_bridge.py"],
        input=json.dumps(tc["input"]),
        capture_output=True, text=True, timeout=10
    )

    try:
        dossier = json.loads(proc.stdout)
    except Exception:
        print(f"\n  [FAIL] {tc['name']}: Could not parse output: {proc.stdout} | stderr: {proc.stderr}")
        all_passed = False
        continue

    type_ok = dossier["issue_type"] == tc["expect_type"]
    issues_ok = (dossier["static_issues_count"] > 0) == tc["expect_issues"]
    passed = type_ok and issues_ok

    if not passed:
        all_passed = False

    symbol = "OK" if passed else "XX"
    print(f"\n  [{symbol}] {tc['name']}")
    print(f"       issue_id:   {dossier['issue_id']}")
    print(f"       issue_type: {dossier['issue_type']} (expected: {tc['expect_type']}) {'OK' if type_ok else 'MISMATCH'}")
    print(f"       issues:     {dossier['static_issues_count']} (expected {'> 0' if tc['expect_issues'] else '0'}) {'OK' if issues_ok else 'MISMATCH'}")
    if dossier.get("static_issues"):
        for iss in dossier["static_issues"]:
            print(f"         -> {iss}")
    if dossier.get("error_logs") and dossier["issue_type"] != "NOMINAL":
        preview = dossier["error_logs"][:120].replace("\n", " | ")
        print(f"       error:      {preview}...")

print("\n" + "=" * 60)
print(f"  RESULT: {'ALL TESTS PASSED' if all_passed else 'SOME TESTS FAILED'}")
print("=" * 60)
