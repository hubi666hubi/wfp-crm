import ast
import sys
import traceback
from typing import List, Tuple, Dict, Any
from pydantic import BaseModel, Field

class SystemPatch(BaseModel):
    issue_id: str
    target_file_path: str
    patch_notes: str
    new_code: str
    confidence_score: float

class ValidationReport(BaseModel):
    patch_id: str
    is_valid: bool
    ast_passed: bool
    security_passed: bool
    errors: List[str] = Field(default_factory=list)
    error_dossier: Dict[str, Any] = Field(default_factory=dict)

class ValidationSandbox:
    def __init__(self):
        # Definicja zabronionych wywołań w celu uniemożliwienia eskalacji uprawnień i infekcji kodu
        self.forbidden_functions = {"eval", "exec", "globals", "locals", "__import__", "compile"}
        self.forbidden_attributes = {"system", "popen", "rmtree", "remove", "unlink", "exec_command"}
        self.blocked_modules = {"subprocess", "ctypes", "shutil", "signal"}

    def _verify_ast(self, code: str) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Kompiluje kod do drzewa składniowego (AST). W przypadku błędu składniowego
        ekstrahuje precyzyjną linię, offset oraz klasę błędu tworząc raport dla L3.
        """
        try:
            ast.parse(code)
            return True, "AST compilation successful.", {}
        except SyntaxError as e:
            error_line = getattr(e, 'text', '').strip() if getattr(e, 'text', None) else ''
            dossier = {
                "line": e.lineno,
                "offset": e.offset,
                "error_class": "SyntaxError",
                "msg": e.msg,
                "snippet": error_line
            }
            return False, f"SyntaxError at line {e.lineno}, offset {e.offset}: {e.msg}. Snippet: {error_line}", dossier
        except Exception as e:
            return False, f"Critical AST Parsing Error: {str(e)}", {"error_class": type(e).__name__, "msg": str(e)}

    def _security_scan(self, code: str) -> Tuple[bool, str]:
        """
        Przeszukuje węzły AST w celu eliminacji złośliwego lub niedozwolonego kodu.
        """
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                # Detekcja bezpośrednich wywołań zabronionych funkcji wbudowanych
                if isinstance(node, ast.Call):
                    if hasattr(node.func, 'id') and node.func.id in self.forbidden_functions:
                        return False, f"Security Violation: Forbidden built-in '{node.func.id}' detected."
                    
                    # Detekcja niebezpiecznych wywołań atrybutów systemowych (np. os.system)
                    if isinstance(node.func, ast.Attribute):
                        if node.func.attr in self.forbidden_attributes:
                            return False, f"Security Violation: Destructive call '{node.func.attr}' detected."
                
                # Detekcja nieautoryzowanych prób importu modułów niskopoziomowych
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    names = []
                    if isinstance(node, ast.Import):
                        names = [alias.name.split('.')[0] for alias in node.names]
                    elif node.module:
                        names = [node.module.split('.')[0]]
                    for name in names:
                        if name in self.blocked_modules:
                            return False, f"Security Violation: Import of restricted module '{name}' blocked."
            return True, "Static security scan passed."
        except Exception as e:
            return False, f"Security scanner failed: {str(e)}"

    async def validate_patch(self, patch: SystemPatch) -> ValidationReport:
        errors = []
        ast_passed, ast_msg, error_dossier = self._verify_ast(patch.new_code)
        if not ast_passed:
            errors.append(ast_msg)

        security_passed = False
        if ast_passed:
            security_passed, sec_msg = self._security_scan(patch.new_code)
            if not security_passed:
                errors.append(sec_msg)

        is_valid = ast_passed and security_passed
        return ValidationReport(
            patch_id=patch.issue_id,
            is_valid=is_valid,
            ast_passed=ast_passed,
            security_passed=security_passed,
            errors=errors,
            error_dossier=error_dossier
        )
