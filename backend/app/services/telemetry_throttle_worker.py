import asyncio
import time
import random
import sys
from datetime import datetime

# Ustawienie kodowania utf-8 dla konsoli Windows, aby zapobiec UnicodeEncodeError na znakach emoji
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

class RateLimitThrottleShield:
    """
    Inteligentny, asynchroniczny regulator prędkości taktowania potoków danych.
    Zabezpiecza jądro przed nałożeniem restrykcji 429 (Too Many Requests).
    """
    def __init__(self, target_rpm: int = 60):
        self.delay_between_requests = 60.0 / target_rpm
        self.last_execution_time = 0.0

    async def throttle(self):
        current_time = time.time()
        elapsed = current_time - self.last_execution_time
        
        if elapsed < self.delay_between_requests:
            sleep_time = self.delay_between_requests - elapsed
            # Dynamiczne rozmycie interwału (Jitter) zabezpieczające przed detekcją wzorców
            sleep_time += random.uniform(0.01, 0.1)
            await asyncio.sleep(sleep_time)
            
        self.last_execution_time = time.time()

async def continuous_high_thrust_worker_loop():
    shield = RateLimitThrottleShield(target_rpm=45) # Maksymalnie 45 zapytań na minutę
    print("\x1b[32m[⚡] SHIELD ACTIVE: Regulator prędkości i przepustowości uruchomiony 24/7.\x1b[0m")
    
    is_active = True
    loop_count = 0
    
    while is_active:
        try:
            # Wymuszenie odczekania bezpiecznego interwału przed wywołaniem zasobów LLM
            await shield.throttle()
            loop_count += 1
            
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"\x1b[90m[WORKER SHIELD TICK] [{timestamp}] Transmisja bezpieczna. Przetwarzanie cyklu #{loop_count}\x1b[0m")
            
            # Tutaj wpada wywołanie Twojego potrójnego roju AI (Syndicate Pipeline)
            await asyncio.sleep(0.05)
            
        except asyncio.CancelledError:
            is_active = False
            break
        except Exception as e:
            print(f"\x1b[31m[CRITICAL] Awaria w pętli strażnika: {str(e)}\x1b[0m")
            await asyncio.sleep(2.0)

if __name__ == "__main__":
    try:
        asyncio.run(continuous_high_thrust_worker_loop())
    except KeyboardInterrupt:
        print("\n\x1b[33m[INFO] Pętla strażnika zatrzymana pomyślnie.\x1b[0m")
