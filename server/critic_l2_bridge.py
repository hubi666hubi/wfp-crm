"""
CRITIC L2 BRIDGE — Stdin/Stdout JSON interface for Node.js <-> Python IPC.

Accepts JSON input with either:
  A) A code string + simulated error to analyze  (mode: "analyze")
  B) A function name + args to execute & monitor  (mode: "execute")

Outputs a CriticDossier JSON to stdout.
"""
import sys
import json
import uuid
import ast
import traceback


def analyze_code_failure(data: dict) -> dict:
    """
    Mode A: Takes a code snippet and an error description,
    performs static analysis, and generates a diagnostic dossier.
    """
    issue_id = f"ISSUE-{str(uuid.uuid4())[:8].upper()}"
    code = data.get("code", "")
    error_desc = data.get("error", "Unknown error")
    file_path = data.get("file_path", "<unknown>")
    
    # Phase 1: Try to parse the code for structural issues
    syntax_issues = []
    try:
        tree = ast.parse(code)
        
        # Walk AST for common anti-patterns
        for node in ast.walk(tree):
            # Detect bare except clauses
            if isinstance(node, ast.ExceptHandler) and node.type is None:
                syntax_issues.append(f"Line {node.lineno}: Bare 'except:' clause — swallows all exceptions silently.")
            # Detect mutable default arguments
            if isinstance(node, ast.FunctionDef):
                for default in node.args.defaults:
                    if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                        syntax_issues.append(f"Line {node.lineno}: Function '{node.name}' uses mutable default argument.")
            # Detect type coercion risks (string + non-string concatenation patterns)
            if isinstance(node, ast.BinOp) and isinstance(node.op, ast.Add):
                left_is_str = isinstance(node.left, ast.Constant) and isinstance(node.left.value, str)
                right_is_name = isinstance(node.right, ast.Name)
                if left_is_str and right_is_name:
                    syntax_issues.append(f"Line {node.lineno}: Potential TypeError — string concatenation with unverified variable '{node.right.id}'.")
                # Also catch Name + Name when the error itself is a TypeError
                elif "typeerror" in error_desc.lower() and isinstance(node.left, ast.Name) and isinstance(node.right, ast.Name):
                    syntax_issues.append(f"Line {node.lineno}: Potential TypeError — addition of '{node.left.id}' + '{node.right.id}' may involve incompatible types.")
    except SyntaxError as e:
        syntax_issues.append(f"SyntaxError at line {e.lineno}: {e.msg}")

    # Phase 2: Classify the error type
    error_type = "RUNTIME_EXCEPTION"
    error_lower = error_desc.lower()
    if "typeerror" in error_lower:
        error_type = "TYPE_COERCION_FAULT"
    elif "keyerror" in error_lower or "attributeerror" in error_lower:
        error_type = "MISSING_REFERENCE"
    elif "timeout" in error_lower or "latency" in error_lower:
        error_type = "LATENCY_BOTTLENECK"
    elif "syntaxerror" in error_lower:
        error_type = "SYNTAX_ERROR"
    elif "import" in error_lower or "module" in error_lower:
        error_type = "DEPENDENCY_FAULT"

    # Phase 3: Generate diagnostic hypothesis
    if syntax_issues:
        analysis = "Static analysis detected the following issues:\n" + "\n".join(f"  - {s}" for s in syntax_issues)
    else:
        analysis = f"No structural defects found via static analysis. The error '{error_desc}' likely originates from runtime data flow. Manual inspection or LLM-assisted deep analysis recommended."

    return {
        "issue_id": issue_id,
        "issue_type": error_type,
        "target_file_path": file_path,
        "current_code": code,
        "error_logs": error_desc,
        "critic_analysis": analysis,
        "static_issues_count": len(syntax_issues),
        "static_issues": syntax_issues
    }


def execute_and_monitor(data: dict) -> dict:
    """
    Mode B: Receives inline Python code, executes it in isolation,
    catches any exception, and generates a dossier from the real traceback.
    """
    issue_id = f"ISSUE-{str(uuid.uuid4())[:8].upper()}"
    code = data.get("code", "")
    file_path = data.get("file_path", "<inline_execution>")
    
    try:
        # Execute in an isolated namespace
        exec_globals = {"__builtins__": __builtins__}
        exec(code, exec_globals)
        
        return {
            "issue_id": issue_id,
            "issue_type": "NOMINAL",
            "target_file_path": file_path,
            "current_code": code,
            "error_logs": "",
            "critic_analysis": "Execution completed without errors. No anomalies detected.",
            "static_issues_count": 0,
            "static_issues": []
        }
    except Exception as e:
        stack = traceback.format_exc()
        error_type = type(e).__name__
        
        return {
            "issue_id": issue_id,
            "issue_type": f"RUNTIME_{error_type.upper()}",
            "target_file_path": file_path,
            "current_code": code,
            "error_logs": stack,
            "critic_analysis": f"Runtime {error_type} caught during monitored execution: {str(e)}",
            "static_issues_count": 0,
            "static_issues": []
        }


if __name__ == "__main__":
    try:
        raw = sys.stdin.read()
        data = json.loads(raw)
        
        mode = data.get("mode", "analyze")
        
        if mode == "execute":
            report = execute_and_monitor(data)
        else:
            report = analyze_code_failure(data)
        
        print(json.dumps(report))
        sys.exit(0)
    except Exception as e:
        fallback = {
            "issue_id": f"ISSUE-{str(uuid.uuid4())[:8].upper()}",
            "issue_type": "BRIDGE_FAILURE",
            "target_file_path": "<bridge>",
            "current_code": "",
            "error_logs": str(e),
            "critic_analysis": f"Critic bridge itself failed: {str(e)}",
            "static_issues_count": 0,
            "static_issues": []
        }
        print(json.dumps(fallback))
        sys.exit(1)
