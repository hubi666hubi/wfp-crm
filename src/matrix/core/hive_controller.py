# --- [MATRIX SOURCE CODE - READ ONLY ACCESS] ---
# Lokalizacja: /src/matrix/core/hive_controller.py
# Wersja: 0.4 (The One Protocol)

import json
import time

class SourceKernel:
    """
    Rdzeń Matrixa. Odpowiada za bezpośrednią manipulację 
    strumieniem danych (pocisków/bomb) w czasie rzeczywistym.
    """
    def __init__(self):
        self.system_state = "STABLE"
        self.reality_modifiers = {
            "bullet_time_factor": 1.0,
            "kinetic_dampening": 0.0
        }

    def access_source_code(self):
        """Wyświetla surową strukturę instrukcji systemu."""
        return {
            "core_logic": "if (threat.exists) { reality.pause(); }",
            "neo_module": "active",
            "swarm_status": "synced"
        }

    def trigger_bullet_time(self):
        """Spowalnia wszystkie zdarzenia kinetyczne."""
        self.reality_modifiers["bullet_time_factor"] = 0.1
        return "CZAS ZWOLNIONY. ANALIZA TRAJEKTORII..."

    def halt_projectiles(self):
        """Zatrzymuje nadlatujące obiekty w locie."""
        self.reality_modifiers["kinetic_dampening"] = 1.0
        return "ENERGETYCZNY KLOSZ AKTYWNY. POCISKI ZATRZYMANE."

# Inicjalizacja rdzenia
kernel = SourceKernel()

if __name__ == "__main__":
    print(f"--- SYSTEM SOURCE STATUS: {kernel.system_state} ---")
    print(json.dumps(kernel.access_source_code(), indent=4))
    
    # Symulacja akcji Neo
    print("\n[ACTION]: " + kernel.trigger_bullet_time())
    print("[ACTION]: " + kernel.halt_projectiles())
