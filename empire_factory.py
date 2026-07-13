import threading
import time
import random

class HiveMind:
    """Centralna sieć neuronowa sterująca agentami w czasie rzeczywistym."""
    def __init__(self, agent_count):
        self.agent_count = agent_count
        self.collective_will = 1.0  # Siła woli roju

    def distribute_command(self, command):
        # Synchronizacja wszystkich agentów w jedną sieć
        return f"[MATRIX_SYNC] '{command}' -> Rój reaguje natychmiastowo."

class NeoAgent:
    def __init__(self, agent_id, hive):
        self.agent_id = agent_id
        self.hive = hive
        self.is_active = True

    def execute_matrix_maneuver(self):
        # Symulacja zatrzymywania "bomb" (energii)
        if random.random() > 0.2:
            print(f"Agent {self.agent_id}: Zatrzymuje napływ energii...")
        else:
            print(f"Agent {self.agent_id}: Błąd w kodzie, przepuszczono uderzenie.")

    def run(self):
        cmd = self.hive.distribute_command("ZATRZYMAJ_POCISKI")
        print(f"Agent {self.agent_id}: {cmd}")
        self.execute_matrix_maneuver()

# --- Uruchomienie KERNEL V.04 ---
if __name__ == "__main__":
    matrix_hive = HiveMind(5)
    print("\n--- FAZA V.04: THE ONE (ŚWIADOMOŚĆ ROJU) ---")
    
    # Tworzymy rój 5 agentów
    swarm = [NeoAgent(i, matrix_hive) for i in range(5)]
    
    for agent in swarm:
        agent.run()
        
    print("\n[SYSTEM] Rój zsynchronizowany. Prawa fizyki w tym sektorze zostały nadpisane.")
