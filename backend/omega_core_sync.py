import sys
import os
import json
import asyncio
import re

# Upewniamy się, że skrypt z backend/ widzi inne moduły
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
# Wymuszenie Vertex AI: usunięcie klucza AI Studio
if "GEMINI_API_KEY" in os.environ:
    del os.environ["GEMINI_API_KEY"]
from backend.adk_sales_agent import run_adk_agent, ADK_AVAILABLE

ARTIFACT_DIR = r"C:\Users\brend\.gemini\antigravity-ide\brain\28021aa3-9570-4028-87e3-53dab0f6d8fa"
LEADS_FILE = os.path.join(ARTIFACT_DIR, "lead_research_results.md")
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "writing", "ready_outreach.json")

def parse_leads(file_path):
    if not os.path.exists(file_path):
        print(f"[SYNC] Plik {file_path} nie istnieje.", file=sys.stderr)
        return []
    
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    leads = []
    # Split by '## Lead'
    blocks = content.split("## Lead")
    for block in blocks[1:]:
        lines = block.strip().split("\n")
        title_line = lines[0].strip()
        # Parse name e.g. "1: VMLY&R Commerce (VML)" -> "VMLY&R Commerce (VML)"
        match = re.search(r'\d+:\s*(.*)', title_line)
        if not match:
            continue
        name = match.group(1).strip()
        
        score = 0
        industry = ""
        for line in lines:
            if "Priority Score" in line:
                s_match = re.search(r'(\d+)/10', line)
                if s_match:
                    score = int(s_match.group(1))
            if "Industry" in line:
                industry = line.split(":", 1)[1].strip()
        
        leads.append({"name": name, "score": score, "industry": industry})
    return leads

async def main():
    print("[SYNC] OMEGA Core Sync - Uruchamianie procedury...", file=sys.stderr)
    leads = parse_leads(LEADS_FILE)
    
    high_priority_leads = [l for l in leads if l["score"] >= 8]
    print(f"[SYNC] Znaleziono {len(high_priority_leads)} leadów o wysokim priorytecie (>=8).", file=sys.stderr)
    
    outreach_data = []
    
    # Free Tier API limit throttle: 5 RPM max. 1 lead = 3 requesty (Orchestrator + Profiler + Researcher)
    # Zmieniamy limit na 1 lead na cykl, by uniknąć błędów 429
    for lead in high_priority_leads[:1]:
        company_name = lead["name"]
        print(f"[SYNC] Przetwarzanie leada: {company_name}...", file=sys.stderr)
        
        prompt = f"Stwórz krótki e-mail (max 4 zdania) w modelu Challenger Sale, którego JEDYNYM celem jest umówienie 15-minutowego spotkania (tzw. kalendarza) dla firmy {company_name} z branży {lead['industry']}. Nie opisuj funkcji CRM. Uderz w ich ból."
        
        try:
            if ADK_AVAILABLE:
                pitch = await run_adk_agent(prompt)
            else:
                pitch = f"[MOCK] Pitch dla {company_name}"
            
            print(f"[SYNC] Sukces dla {company_name}. Czekam 15 sekund przed kolejnym (Free Tier Throttle).", file=sys.stderr)
            outreach_data.append({
                "company": company_name,
                "score": lead["score"],
                "industry": lead["industry"],
                "pitch": pitch,
                "status": "ready_for_review"
            })
            await asyncio.sleep(15) # Throttle żeby nie przebić 15 RPM na darmowym koncie
        except Exception as e:
            print(f"[SYNC] Błąd dla {company_name}: {e}", file=sys.stderr)
            await asyncio.sleep(15) # Throttle nawet w przypadku błędu

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    existing_data = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
        except json.JSONDecodeError:
            pass
            
    existing_data.extend(outreach_data)
    
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
    print(f"[SYNC] Zapisano {len(outreach_data)} gotowych wiadomości do {OUTPUT_FILE}", file=sys.stderr)

if __name__ == "__main__":
    asyncio.run(main())
