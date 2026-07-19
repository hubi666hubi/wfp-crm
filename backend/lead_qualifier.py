import json
import logging
import os

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Konfiguracja loggera
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class LeadQualifier:
    """
    Kwalifikator Leadów - analizuje zebrane leady i ocenia ich potencjał (Scoring)
    z użyciem RAG (Supabase) i LLM (Gemini API).
    """
    def __init__(self, input_file: str, output_file: str):
        self.input_file = input_file
        self.output_file = output_file
        self.qualified_leads = []

    def mock_ai_scoring(self, email: str, context: str) -> dict:
        """
        Zastępcza funkcja - w produkcji wywoła API Gemini + przeszuka Supabase RAG 
        (np. wektoryzacja kontekstu i wyszukanie dopasowania w bazie wiedzy).
        """
        # Prosta logika: jeśli to mail firmowy (nie gmail/wp), ma wyższy score
        score = 85 if not any(x in email for x in ['gmail.com', 'yahoo.com', 'wp.pl']) else 30
        return {
            "ai_score": score,
            "reasoning": "Zidentyfikowano domenę korporacyjną." if score > 50 else "Domena publiczna."
        }

    def process(self):
        if not os.path.exists(self.input_file):
            logging.error(f"Brak pliku {self.input_file}. Uruchom najpierw scraper.")
            return

        with open(self.input_file, "r", encoding="utf-8") as f:
            leads = json.load(f)

        for lead in leads:
            logging.info(f"Kwalifikacja leada: {lead['email']}")
            scoring = self.mock_ai_scoring(lead['email'], lead['context'])
            
            if scoring['ai_score'] > 50:
                lead['status'] = "HOT"
                lead['ai_insights'] = scoring
                self.qualified_leads.append(lead)
            else:
                logging.info(f"Odrzucono: {lead['email']} (Score: {scoring['ai_score']})")

        with open(self.output_file, "w", encoding="utf-8") as f:
            json.dump(self.qualified_leads, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Zakończono. Zakwalifikowano {len(self.qualified_leads)} gorących leadów.")

if __name__ == "__main__":
    qualifier = LeadQualifier("data/reports/wfp_leads_report.json", "data/reports/wfp_hot_leads.json")
    qualifier.process()
