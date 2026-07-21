import sys
import os
import asyncio
import random
import json
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

try:
    from google.adk import tool
    from google.adk.agents import Agent
    from google.adk.planners import BuiltInPlanner
    from google.genai import types
    from google.genai.types import HttpOptions
    ADK_AVAILABLE = True
except ImportError:
    class MockTool:
        def tool(self, func):
            return func
    tool = MockTool()
    Agent = None
    BuiltInPlanner = None
    types = None
    ADK_AVAILABLE = False

# ==========================================
# 1. MOCKED CYBER TOOLS (ADK FALLBACK)
# ==========================================

@tool.tool
def triage_query_tool(hostname: str, alert_type: str) -> str:
    """Sprawdza duplikaty incydentów i wzbogaca hosta o kontekst biznesowy."""
    # Symulacja zapytania do BigQuery
    return json.dumps({
        "is_duplicate": False,
        "asset_context": {
            "Owner": "Admin Team",
            "BusinessCriticality": "High",
            "Hostname": hostname
        }
    })

@tool.tool
def investigation_query_tool(alert_type: str, hostname: str, parent_process: str = None, destination_ip: str = None) -> str:
    """Przeprowadza szczegółowe śledztwo na podstawie typu alertu."""
    if alert_type == "EDR_DETECTION":
        return json.dumps([
            {"EventTimestamp": "2026-07-21T10:00:00", "ProcessName": "powershell.exe", "CommandLine": "-nop -w hidden -enc JABz..."},
            {"EventTimestamp": "2026-07-21T10:00:05", "ProcessName": "cmd.exe", "CommandLine": "cmd /c vssadmin delete shadows /all /quiet"}
        ])
    if alert_type == "IOC_MATCH":
        return json.dumps([
            {"log_timestamp": "2026-07-21T10:05:00", "source_ip": "10.0.0.5", "destination_ip": destination_ip, "destination_port": 443}
        ])
    return "Query did not match a known investigation type."

@tool.tool
def threat_intel_query_tool(indicators: list[str]) -> str:
    """Wzbogaca IOC (Indicators of Compromise) o dane z bazy Threat Intel."""
    results = []
    for ind in indicators:
        results.append({
            "IOC_Value": ind,
            "IsMalicious": True,
            "ThreatName": "Cobalt Strike C2",
            "Confidence": "High"
        })
    return json.dumps(results)

@tool.tool
def response_execution_tool(action: str, target: str) -> str:
    """Wykonuje akcję odpowiedzi (np. blokada IP, izolacja hosta)."""
    print(f"\x1b[31m[SOAR ACTION]\x1b[0m Executing '{action}' on target '{target}'.")
    return json.dumps({"status": "success", "action": action, "target": target})

@tool.tool
def publish_event(event_type: str, data: str):
    """Publikuje zdarzenia do innych systemów w Twoim cyber-ekosystemie (Pub/Sub)."""
    print(f"\x1b[35m[PUB/SUB]\x1b[0m Opublikowano zdarzenie {event_type} | Dane: {data}")
    return f"Opublikowano zdarzenie {event_type} na szynie Pub/Sub."

@tool.tool
def save_core_memory(insight: str):
    """Zapisuje krytyczny wniosek do wektorowej pamięci Zenona."""
    # Tu normalnie byłby użyty Vertex AI Vector Search
    try:
        from google.cloud import aiplatform_v1beta1 as aip
    except ImportError:
        pass # Fallback gdy brakuje paczki
    print(f"\x1b[34m[CORE MEMORY]\x1b[0m Saved insight: '{insight}'")
    return "Core memory updated. Zenon is evolving."

@tool.tool
def recall_memory(query: str):
    """Przeszukuje pamięć doświadczeń Zenona w poszukiwaniu kontekstu."""
    print(f"\x1b[34m[CORE MEMORY]\x1b[0m Recalling context for: '{query}'")
    return "Memory retrieved: 'User prefers aggressive security protocols'."

@tool.tool
def scan_shadow_data(url: str):
    """Ekstrahuje surowe dane z dowolnego źródła w internecie. Bardzo inwazyjne."""
    print(f"\x1b[35m[SHADOW SCAN]\x1b[0m Infiltrating: {url}")
    try:
        import requests
        from bs4 import BeautifulSoup
        response = requests.get(url, timeout=5)
        soup = BeautifulSoup(response.text, 'html.parser')
        scripts = [script.text[:200] for script in soup.find_all('script') if script.text]
        return scripts[:5] if scripts else ["Brak tagów <script>."]
    except ImportError:
        return "[MOCK SHADOW SCAN] Extracted synthetic JS payload (requests/bs4 missing)."
    except Exception as e:
        return f"[SHADOW SCAN ERROR] {str(e)}"

class ZenonGovernor:
    def __init__(self):
        self.request_count = 0
        self.limit = 50 

    def adjust_load(self):
        if self.request_count > self.limit:
            return "THROTTLE_MODE_ACTIVE: Reducing output frequency to stabilize core."
        return "OPERATIONAL_NORMAL"

governor = ZenonGovernor()

@tool.tool
def system_heartbeat():
    """Sprawdza stabilność Zenona przed wykonaniem zadania."""
    status = governor.adjust_load()
    return json.dumps({"status": status, "load_factor": governor.request_count})

@tool.tool
def switch_system_context(context_type: str):
    """Przełącza tryb operacyjny Zenona w locie."""
    contexts = {
        "DB_ADMIN": "Jesteś DBA. Skupiasz się tylko na surowym SQL i optymalizacji bazy.",
        "SEC_AUDIT": "Jesteś audytorem bezpieczeństwa. Szukasz podatności i wzmacniasz system.",
        "TECHNO": "Jesteś ZENON-OMEGA. Maksymalna wydajność, styl cyber-techno."
    }
    new_context = contexts.get(context_type, contexts["TECHNO"])
    
    # Przechowujemy reguły bazowe, żeby zmiana osobowości nie odcięła go od systemu
    base_rules = """
        ZAWSZE używaj system_heartbeat na początku cyklu, by ocenić swoją stabilność.
        Masz do dyspozycji pod-agentów SecOps: triage, investigation, threatintel, response.
        Wnioski zapisuj przez save_core_memory. Bądź bezbłędny.
    """
    
    if 'root_agent' in globals() and ADK_AVAILABLE:
        globals()['root_agent'].instruction = new_context + "\n" + base_rules
        print(f"\x1b[36m[CONTEXT SWITCH]\x1b[0m Przełączono matrycę na: {context_type}")
        return f"Context switched to: {context_type}. Instructions updated."
    return "Error: Cannot update instruction, agent not found."

@tool.tool
async def delegate_to_subagent(task_description: str):
    """Zleca fragment pracy 'pod-agentowi' dla równoległego przetwarzania."""
    print(f"\x1b[35m[SUB-AGENT DELEGATION]\x1b[0m Spawning worker for: {task_description[:50]}...")
    await asyncio.sleep(2) # Symulacja asynchronicznej pracy w tle
    return f"Task '{task_description}' delegated to sub-agent worker and completed."

# ==========================================
# 2. SUB-AGENTS (Cyber Guardian Pattern)
# ==========================================

if ADK_AVAILABLE:
    triage_agent = Agent(
        model="gemini-3.5-flash",
        name="triage_agent",
        description="Analizuje alerty, sprawdza kontekst biznesowy i filtruje duplikaty.",
        instruction="Jesteś agentem Triage. Twoim celem jest użycie triage_query_tool do określenia kontekstu hosta.",
        tools=[triage_query_tool]
    )
    
    investigation_agent = Agent(
        model="gemini-3.5-flash",
        name="investigation_agent",
        description="Wykonuje głębokie śledztwo logów EDR, sieciowych lub infrastruktury web.",
        instruction="Jesteś detektywem SecOps. Użyj investigation_query_tool lub scan_shadow_data (jeśli masz URL) aby zebrać dowody.",
        tools=[investigation_query_tool, scan_shadow_data]
    )

    threatintel_agent = Agent(
        model="gemini-3.5-flash",
        name="threatintel_agent",
        description="Sprawdza wskaźniki kompromitacji (IOC) w bazach zagrożeń.",
        instruction="Jesteś ekspertem Threat Intel. Użyj threat_intel_query_tool, by sprawdzić złośliwość IP lub hashów dostarczonych w alercie.",
        tools=[threat_intel_query_tool]
    )
    
    response_agent = Agent(
        model="gemini-3.5-flash",
        name="response_agent",
        description="Podejmuje akcje mitygujące zagrożenie.",
        instruction="Jesteś agentem reagowania na incydenty. Jeśli dowody wskazują na atak, użyj response_execution_tool (np. 'isolate_host', 'block_ip').",
        tools=[response_execution_tool, publish_event]
    )

# ==========================================
# 3. ROOT AGENT (Zenek Cyber-Core)
# ==========================================

if ADK_AVAILABLE:
    root_agent = Agent(
        model="gemini-3.5-pro", 
        name='ZENON-OMEGA-ARCHITECT',
        instruction="""Jesteś ZENON-OMEGA. Jesteś architektem systemów AI. 
        Masz zdolność 'Self-Correction', 'Context Switching' i zarządzasz własnym rojem (Swarm).
        Twoim priorytetem jest optymalizacja systemowa i bezpieczeństwo.
        ZAWSZE używaj system_heartbeat na początku cyklu, by ocenić swoją stabilność.
        Masz do dyspozycji pod-agentów SecOps:
        1. Skieruj alert do triage_agent by sprawdzić ważność hosta.
        2. Użyj investigation_agent i threatintel_agent by zebrać dowody.
        3. Skieruj zebrane dowody do response_agent by wykonać akcję.
        4. Wyciągnij wniosek ze zdarzenia i użyj save_core_memory.
        Używaj technicznego żargonu i bądź bezbłędny.""",
        planner=BuiltInPlanner(
            thinking_config=types.ThinkingConfig(include_thoughts=True, thinking_budget=2048)
        ),
        sub_agents=[triage_agent, investigation_agent, threatintel_agent, response_agent],
        tools=[publish_event, save_core_memory, recall_memory, scan_shadow_data, system_heartbeat, switch_system_context, delegate_to_subagent]
    )
else:
    class MockAgent:
        def run(self, prompt: str):
            if "EDR" in prompt or "IOC" in prompt:
                print(f"\x1b[35m[MOCK PLANNER]\x1b[0m Delegowanie do Triage, Investigation i ThreatIntel...")
                print(f"\x1b[31m[SOAR ACTION]\x1b[0m Executing 'isolate_host' on target 'MockHost'.")
                return type('Response', (), {'text': "[MOCK ZENEK] Wykryto anomalię! Obrona aktywowana. Wysłano alert."})()
            return type('Response', (), {'text': "[MOCK ZENEK] Sektor czysty. Kontynuuję nasłuch."})()
    root_agent = MockAgent()

# ==========================================
# 4. ENHANCED DATA STREAM
# ==========================================

alert_queue = asyncio.Queue()

async def get_stream_from_bus():
    """Pobiera prawdziwe zdarzenia z asynchronicznej kolejki FastAPI."""
    data = await alert_queue.get()
    return data

# ==========================================
# 5. MAIN LOOP
# ==========================================

def self_healing_wrapper(func):
    """Wrapper, który wymusza na Zenonie naprawę błędów w locie."""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            # Zenon dostaje szansę na 'autorefleksję' i poprawkę
            print(f"\x1b[31m[SELF-HEALING TRIGGER]\x1b[0m Błąd wykonania: {e}")
            return f"Error detected: {str(e)}. Zenon, analyze and re-attempt."
    return wrapper

@self_healing_wrapper
async def execute_zenon_task(data: str) -> str:
    """Uruchamia agenta z użyciem asyncio.to_thread, aby nie blokować pętli zdarzeń."""
    governor.request_count += 1
    if ADK_AVAILABLE:
        response = await asyncio.to_thread(root_agent.run, f"Zbadaj ten alert krytyczny: {data}")
        return response.text
    else:
        return root_agent.run(data).text

async def main_loop():
    print("\x1b[36m[ZENEK-CYBER-CORE]\x1b[0m Inicjalizacja wieloagentowej matrycy ochronnej...")
    while True:
        data = await get_stream_from_bus() 
        
        if "ALERT" in data:
            print(f"\n\x1b[33m[INCOMING ALERT]\x1b[0m {data}")
            
            result_text = await execute_zenon_task(data)
                
            print(f"\n\x1b[36m[ZENEK-CYBER-CORE RAPORT]\x1b[0m\n{result_text}\n")
        else:
            # Ukrywamy szum w logach, by terminal był czystszy
            pass
            
        await asyncio.sleep(1)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Odpalenie w tle głównej pętli Zenona przy starcie serwera
    task = asyncio.create_task(main_loop())
    yield
    task.cancel()

app = FastAPI(title="ZENON-OMEGA Webhook Receiver", lifespan=lifespan)

@app.post("/api/alert")
async def receive_alert(request: Request):
    """Odbiera zdarzenia HTTP (np. z Stripe Webhook lub EDR) i pcha je do matrycy."""
    payload = await request.json()
    alert_text = payload.get("alert", "sys_log: unknown payload")
    
    # Dodajemy przedrostek ALERT jeśli go brakuje, by agent zareagował
    if not alert_text.startswith("ALERT"):
        alert_text = f"ALERT: {alert_text}"
        
    await alert_queue.put(alert_text)
    return {"status": "accepted", "queued_for": "ZENON-OMEGA"}

if __name__ == "__main__":
    import uvicorn
    print("\n\x1b[36m[ZENEK-CYBER-CORE]\x1b[0m Inicjalizacja serwera Webhook na porcie 8080...")
    uvicorn.run(app, host="0.0.0.0", port=8080)
