import json
import logging
import time
import requests
from bs4 import BeautifulSoup
from typing import List, Dict

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

# Konfiguracja loggera (zabezpieczenie znaków dla Windowsa dodane wcześniej przez agenta)
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class LeadScraper:
    """
    Maszynka do Leadów - Warstwa C (Data Ingestion).
    Przeczesuje wskazane źródła w poszukiwaniu danych kontaktowych.
    Wersja początkowa używa BeautifulSoup do partyzanckiego scrapowania.
    """
    def __init__(self, target_urls: List[str]):
        self.target_urls = target_urls
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
        self.extracted_leads = []

    def scrape_url(self, url: str) -> List[Dict]:
        logging.info(f"Rozpoczynam zwiad na: {url}")
        leads = []
        try:
            response = requests.get(url, headers=self.headers, timeout=10)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Mockowy ekstraktor - szukamy maili w tekście
                # W produkcji podmieniane na selektory docelowe (LinkedIn/ZoomInfo itp.)
                import re
                emails = set(re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", soup.get_text()))
                
                for email in emails:
                    leads.append({
                        "source": url,
                        "email": email,
                        "context": "Wyciągnięto automatycznie przez OMEGA Lead Scraper"
                    })
                    logging.info(f"Znaleziono potencjalny cel: {email}")
            else:
                logging.warning(f"Błąd HTTP {response.status_code} na {url}")
        except Exception as e:
            logging.error(f"Błąd podczas scrapowania {url}: {str(e)}")
            
        return leads

    def run(self):
        for url in self.target_urls:
            found = self.scrape_url(url)
            self.extracted_leads.extend(found)
            time.sleep(2) # Anty-ban delay
            
        # Zapisz wyniki do JSONa
        with open("data/reports/wfp_leads_report.json", "w", encoding="utf-8") as f:
            json.dump(self.extracted_leads, f, indent=4, ensure_ascii=False)
        logging.info(f"Zakończono. Zapisano {len(self.extracted_leads)} leadów do data/reports/wfp_leads_report.json")

if __name__ == "__main__":
    # Produkcyjne źródła (katalogi B2B, startupy, firmy technologiczne)
    urls_to_scrape = [
        "https://clutch.co/it-services",
        "https://www.ycombinator.com/companies",
        "https://builtwith.com/ecommerce"
    ]
    scraper = LeadScraper(urls_to_scrape)
    scraper.run()
