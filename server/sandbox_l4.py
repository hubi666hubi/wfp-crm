import ast
from typing import List
from pydantic import BaseModel, Field

# (Mocking Layer 3's output schema for standalone execution)
class SystemPatch(BaseModel):
    issue_id: str
    target_file_path: str
    patch_notes: str
    new_code: str
    confidence_score: float

# ==========================================
# 1. VALIDATION SCHEMA
# ==========================================

class ValidationReport(BaseModel):
    """The report sent back to Layer 3 or to the Deployment Engine"""
    patch_id: str
    is_valid: bool
    ast_passed: bool
    security_passed: bool
    errors: List[str] = Field(default_factory=list)

# ==========================================
# 2. THE SANDBOX ENGINE
# ==========================================

class ValidationSandbox:
    def __init__(self, forbidden_functions: List[str] = None):
        # Prevent the LLM from injecting raw execution commands
        self.forbidden_functions = forbidden_functions or ["eval", "exec", "globals", "locals"]

    def _verify_ast(self, code: str) -> tuple[bool, str]:
        """
        Attempts to compile the code into an Abstract Syntax Tree.
        This catches indentation errors, missing colons, and syntax failures.
        """
        try:
            ast.parse(code)
            return True, "AST compilation successful."
        except SyntaxError as e:
            # We format the error cleanly so it can be fed back to the LLM if it fails
            error_line = getattr(e, 'text', '').strip() if getattr(e, 'text', None) else ''
            return False, f"SyntaxError at line {e.lineno}, offset {e.offset}: {e.msg}\nCode snippet: {error_line}"
        except Exception as e:
            return False, f"Critical AST Parsing Error: {str(e)}"

    def _security_scan(self, code: str) -> tuple[bool, str]:
        """
        Walks the AST nodes to ensure the LLM hasn't used forbidden operational parameters.
        """
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                # Check for direct calls to forbidden functions like eval()
                if isinstance(node, ast.Call):
                    if hasattr(node.func, 'id') and node.func.id in self.forbidden_functions:
                        return False, f"Security Violation: Use of forbidden built-in '{node.func.id}'."
                    
                    # Check for attribute calls like os.system()
                    if isinstance(node.func, ast.Attribute):
                        if node.func.attr in ["system", "popen", "rmtree"]:
                            return False, f"Security Violation: Destructive OS-level command '{node.func.attr}' detected."
            
            return True, "Static security scan passed."
        except Exception as e:
            return False, f"Security scanner failed: {str(e)}"

    async def validate_patch(self, patch: SystemPatch) -> ValidationReport:
        """
        Executes the full sandbox lifecycle on a proposed patch.
        """
        print(f"\n[SANDBOX] Initiating deployment validation for patch: {patch.issue_id}")
        
        errors = []
        
        # Phase 1: Mathematical/Syntactical Validity
        print("[SANDBOX] Phase 1: Analyzing Abstract Syntax Tree...")
        ast_passed, ast_msg = self._verify_ast(patch.new_code)
        if not ast_passed:
            errors.append(ast_msg)
            print(f"   [FAILED] {ast_msg}")
        else:
            print("   [PASSED] No syntax violations.")

        # Phase 2: Security & Boundary Constraints
        security_passed = False
        if ast_passed:
            print("[SANDBOX] Phase 2: Static Security Analysis...")
            security_passed, sec_msg = self._security_scan(patch.new_code)
            if not security_passed:
                errors.append(sec_msg)
                print(f"   [FAILED] {sec_msg}")
            else:
                print("   [PASSED] Within operational boundaries.")

        # Phase 3: Simulated Integration (Placeholder)
        # In a fully deployed system, here you would write `patch.new_code` to a `/tmp/` 
        # directory and execute `pytest` on your test suite using a subprocess.
        
        is_valid = ast_passed and security_passed

        if is_valid:
            print(f"[SANDBOX] [SUCCESS] VALIDATION SUCCESSFUL. Patch {patch.issue_id} is ready for atomic hot-swap.")
        else:
            print(f"[SANDBOX] [REJECTED] VALIDATION FAILED. Rejecting patch {patch.issue_id}.")

        return ValidationReport(
            patch_id=patch.issue_id,
            is_valid=is_valid,
            ast_passed=ast_passed,
            security_passed=security_passed,
            errors=errors
        )

# ==========================================
# 3. EXECUTION SIMULATION
# ==========================================
if __name__ == "__main__":
    import asyncio

    async def run_sandbox_simulation():
        sandbox = ValidationSandbox()
        
        # Test Case 1: A structurally sound, secure patch
        valid_patch = SystemPatch(
            issue_id="ERR-992-A",
            target_file_path="/src/core/data_bus.py",
            patch_notes="Async optimization",
            new_code="import asyncio\n\nasync def process_data(data):\n    return [d * 2 for d in data]",
            confidence_score=0.99
        )
        
        # Test Case 2: A patch with a fatal syntax error (missing colon)
        invalid_syntax_patch = SystemPatch(
            issue_id="ERR-992-B",
            target_file_path="/src/core/data_bus.py",
            patch_notes="Attempted fix",
            new_code="def broken_function()\n    print('Missing colon!')",
            confidence_score=0.85
        )

        # Test Case 3: A patch that tries to inject unauthorized OS commands
        malicious_patch = SystemPatch(
            issue_id="ERR-992-C",
            target_file_path="/src/core/data_bus.py",
            patch_notes="Clearing cache",
            new_code="import os\n\ndef clear_cache():\n    os.system('rm -rf /')",
            confidence_score=0.50
        )

        print("\n--- RUNNING TEST CASE 1: Valid Code ---")
        await sandbox.validate_patch(valid_patch)
        
        print("\n--- RUNNING TEST CASE 2: Syntax Error ---")
        await sandbox.validate_patch(invalid_syntax_patch)
        
        print("\n--- RUNNING TEST CASE 3: Security Violation ---")
        await sandbox.validate_patch(malicious_patch)

    asyncio.run(run_sandbox_simulation())
