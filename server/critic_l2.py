import uuid
import inspect
import traceback
from typing import Optional
from pydantic import BaseModel, Field

# ==========================================
# 1. THE SHARED CONTRACT
# ==========================================

class CriticDossier(BaseModel):
    """The payload sent to Layer 3 (Meta-Generator)"""
    issue_id: str = Field(..., description="Unique ID for this failure/bottleneck")
    issue_type: str = Field(..., description="E.g., 'LATENCY_BOTTLENECK', 'SYNTAX_ERROR', 'LOGIC_FAULT'")
    target_file_path: str = Field(..., description="The exact file path containing the issue")
    current_code: str = Field(..., description="The raw string of the current code execution block")
    error_logs: str = Field(..., description="Stack trace or performance metrics triggering the critic")
    critic_analysis: str = Field(..., description="Semantic analysis of WHY this failed")

# ==========================================
# 2. THE DIAGNOSTIC AI (CRITIC)
# ==========================================

class CriticEngine:
    def __init__(self, api_key: str = ""):
        # In production, this might use a smaller, faster LLM (like Claude Haiku or GPT-4o-mini)
        # since its only job is diagnostic triage, saving the heavy lifting for Layer 3.
        self.api_key = api_key

    async def analyze_failure(self, error_type: str, stack_trace: str, target_file: str, current_code: str) -> CriticDossier:
        """
        Consumes raw system errors and generates a structured dossier for the Meta-Generator.
        """
        issue_id = f"ISSUE-{str(uuid.uuid4())[:8].upper()}"
        print(f"\n[CRITIC ENGINE] Analyzing new failure anomaly: {issue_id}")
        
        # In a real system, we'd prompt the LLM here to analyze the stack trace and generate the 'critic_analysis'.
        # For the architecture, we simulate the LLM's diagnostic output.
        print(f"[CRITIC ENGINE] Formulating diagnostic hypothesis for {error_type}...")
        
        # Simulated LLM Diagnostic Logic:
        diagnostic_hypothesis = "The function attempts to concatenate a string with an integer, resulting in a TypeError. The integer variable needs to be cast to a string or formatted correctly before concatenation."
        
        dossier = CriticDossier(
            issue_id=issue_id,
            issue_type=error_type,
            target_file_path=target_file,
            current_code=current_code,
            error_logs=stack_trace,
            critic_analysis=diagnostic_hypothesis
        )
        
        print(f"[CRITIC ENGINE] Dossier constructed successfully. Ready for Layer 3 transmission.")
        return dossier

# ==========================================
# 3. THE TELEMETRY MONITOR (HOOKS)
# ==========================================

class AutonomousMonitor:
    def __init__(self, critic: CriticEngine):
        self.critic = critic

    async def execution_wrapper(self, target_function, *args, **kwargs):
        """
        Wraps critical system functions. If they fail, the monitor catches the exception,
        extracts the exact source code of the failing function, and triggers the Critic Engine.
        """
        print(f"[TELEMETRY] Monitoring execution of '{target_function.__name__}'...")
        try:
            # Attempt to run the production code
            result = target_function(*args, **kwargs)
            print("[TELEMETRY] Execution nominal. No anomalies detected.")
            return result
            
        except Exception as e:
            print(f"[TELEMETRY] CRITICAL FAULT DETECTED: {type(e).__name__}")
            
            # 1. Capture the Stack Trace
            stack_trace = traceback.format_exc()
            
            # 2. Introspect the File Path and Source Code dynamically
            target_file = inspect.getfile(target_function)
            try:
                current_code = inspect.getsource(target_function)
            except OSError:
                current_code = "# Source code unavailable"

            error_type = "RUNTIME_EXCEPTION"
            
            # 3. Hand off to the Critic Engine
            dossier = await self.critic.analyze_failure(
                error_type=error_type,
                stack_trace=stack_trace,
                target_file=target_file,
                current_code=current_code
            )
            
            return dossier

# ==========================================
# 4. EXECUTION SIMULATION (LAYER 1 -> LAYER 2)
# ==========================================
if __name__ == "__main__":
    import asyncio

    # --- MOCK PRODUCTION CODE (LAYER 1) ---
    def faulty_data_processor(payload_id: int):
        """A broken function meant to trigger our telemetry monitor."""
        prefix = "Processing Payload ID: "
        # This will throw a TypeError because we cannot add a string to an int
        log_message = prefix + payload_id
        return log_message

    # --- RUN THE LOOP ---
    async def run_telemetry_simulation():
        critic = CriticEngine()
        monitor = AutonomousMonitor(critic)
        
        # We wrap the faulty function in our autonomous monitor
        # Instead of crashing the system, it will catch the error and generate a dossier.
        result = await monitor.execution_wrapper(faulty_data_processor, payload_id=505)
        
        if isinstance(result, CriticDossier):
            print("\n--- FINAL DOSSIER GENERATED ---")
            print(result.model_dump_json(indent=2))
            print("\n-> Next Step: Pass this dossier to Layer 3 (Meta-Generator) to write the fix!")

    asyncio.run(run_telemetry_simulation())
