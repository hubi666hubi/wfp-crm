import sys
import uuid
import inspect
import traceback
import asyncio
from pydantic import BaseModel, Field

# Ustawienie kodowania utf-8 dla konsoli Windows, aby zapobiec UnicodeEncodeError na znakach emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

class CriticDossier(BaseModel):
    issue_id: str = Field(..., description="Unikalny ID dla tej anomalii")
    issue_type: str = Field(..., description="Typ bledu, np. RUNTIME_EXCEPTION")
    target_file_path: str = Field(..., description="Sciezka do uszkodzonego pliku")
    current_code: str = Field(..., description="Wycinek kodu, ktory zawiodl")
    error_logs: str = Field(..., description="Pelny stack trace bledu")
    critic_analysis: str = Field(..., description="Hipoteza diagnostyczna dla jader AI")

class DemonCriticEngine:
    def __init__(self):
        print("\x1b[31m[DEMON 01 - CRITIC] 💀 Aktywowano Demona Triażu i Diagnostyki Anomali.\x1b[0m")

    async def analyze_failure(self, error_type: str, stack_trace: str, target_file: str, current_code: str) -> CriticDossier:
        issue_id = f"ISSUE-{str(uuid.uuid4())[:8].upper()}"
        print(f"[CRITIC DEMON] Tworzenie dossier dla nowej awarii systemowej: {issue_id}")
        
        # Automatyczne budowanie hipotezy naprawczej dla Layer 3
        hypothesis = "Wykryto krytyczny blad wykonania. Kod wymaga natychmiastowej refaktoryzacji asynchronicznej pętli I/O."
        
        return CriticDossier(
            issue_id=issue_id,
            issue_type=error_type,
            target_file_path=target_file,
            current_code=current_code,
            error_logs=stack_trace,
            critic_analysis=hypothesis
        )

class AutonomousMonitor:
    def __init__(self, critic: DemonCriticEngine):
        self.critic = critic

    async def execution_wrapper(self, target_function, *args, **kwargs):
        print(f"[TELEMETRY WATCH] Nasluch i zabezpieczenie funkcji: '{target_function.__name__}'")
        try:
            return target_function(*args, **kwargs)
        except Exception as e:
            print(f"\x1b[41m\x1b[37m[FAULT DETECTED]\x1b[0m Przechwycono krytyczny blad: {type(e).__name__}")
            stack_trace = traceback.format_exc()
            target_file = inspect.getfile(target_function)
            try:
                current_code = inspect.getsource(target_function)
            except OSError:
                current_code = "# Source code unavailable"

            return await self.critic.analyze_failure(
                error_type="RUNTIME_EXCEPTION",
                stack_trace=stack_trace,
                target_file=target_file,
                current_code=current_code
            )
