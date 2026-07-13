"""
SANDBOX L4 BRIDGE — Stdin/Stdout JSON interface for Node.js ↔ Python IPC.

Reads a JSON patch object from stdin, runs AST + security validation,
outputs a ValidationReport JSON to stdout.
"""
import sys
import json
import ast
from typing import List


# Forbidden function calls the LLM must never inject
FORBIDDEN_FUNCTIONS = ["eval", "exec", "globals", "locals", "__import__", "compile"]
FORBIDDEN_ATTRIBUTES = ["system", "popen", "rmtree", "remove", "unlink", "exec_command"]


def verify_ast(code: str) -> tuple:
    """Phase 1: Compile code to AST — catches syntax errors."""
    try:
        ast.parse(code)
        return True, "AST compilation successful."
    except SyntaxError as e:
        error_line = getattr(e, 'text', '').strip() if getattr(e, 'text', None) else ''
        return False, f"SyntaxError at line {e.lineno}, offset {e.offset}: {e.msg}. Snippet: {error_line}"
    except Exception as e:
        return False, f"Critical AST Parsing Error: {str(e)}"


def security_scan(code: str) -> tuple:
    """Phase 2: Walk AST nodes for forbidden function calls."""
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, ast.Call):
                # Direct calls: eval(), exec()
                if hasattr(node.func, 'id') and node.func.id in FORBIDDEN_FUNCTIONS:
                    return False, f"Security Violation: Forbidden built-in '{node.func.id}' detected."
                # Attribute calls: os.system(), shutil.rmtree()
                if isinstance(node.func, ast.Attribute):
                    if node.func.attr in FORBIDDEN_ATTRIBUTES:
                        return False, f"Security Violation: Destructive call '{node.func.attr}' detected."
            # Import guards: block `import subprocess`, `import ctypes`
            if isinstance(node, (ast.Import, ast.ImportFrom)):
                blocked_modules = {"subprocess", "ctypes", "shutil", "signal"}
                names = []
                if isinstance(node, ast.Import):
                    names = [alias.name.split('.')[0] for alias in node.names]
                elif node.module:
                    names = [node.module.split('.')[0]]
                for name in names:
                    if name in blocked_modules:
                        return False, f"Security Violation: Import of restricted module '{name}' blocked."
        return True, "Static security scan passed."
    except Exception as e:
        return False, f"Security scanner failed: {str(e)}"


def validate(patch: dict) -> dict:
    """Run full validation pipeline and return a report dict."""
    issue_id = patch.get("issue_id", patch.get("patch_id", "UNKNOWN"))
    new_code = patch.get("new_code", "")

    errors: List[str] = []

    # Phase 1: AST
    ast_passed, ast_msg = verify_ast(new_code)
    if not ast_passed:
        errors.append(ast_msg)

    # Phase 2: Security (only if syntax is valid)
    security_passed = False
    if ast_passed:
        security_passed, sec_msg = security_scan(new_code)
        if not security_passed:
            errors.append(sec_msg)

    is_valid = ast_passed and security_passed

    return {
        "patch_id": issue_id,
        "is_valid": is_valid,
        "ast_passed": ast_passed,
        "security_passed": security_passed,
        "errors": errors
    }


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        patch = json.loads(raw)
        report = validate(patch)
        print(json.dumps(report))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"patch_id": "UNKNOWN", "is_valid": False, "ast_passed": False, "security_passed": False, "errors": [str(e)]}))
        sys.exit(1)
