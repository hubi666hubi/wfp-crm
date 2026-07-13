try:
    from server.sandbox_l4 import ValidationSandbox, SystemPatch
except ModuleNotFoundError:
    from sandbox_l4 import ValidationSandbox, SystemPatch

# Re-exporting for compatibility with ignite_core.py
__all__ = ['ValidationSandbox', 'SystemPatch']
