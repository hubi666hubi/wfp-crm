import json
import logging
import asyncio
import aiohttp
from bs4 import BeautifulSoup
from typing import List, Dict
import sys
import re
import os

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

logging.basicConfig(level=logging.INFO, format="\x1b[35m[OP-SCRAPER]\x1b[0m %(asctime)s - %(levelname)s - %(message)s")

class OPLeadScraper:
    """
    Overpowered Dev (OP) Lead Scraper.
    Maximum performance. Auto-healing retries. Direct integration with ZENON-OMEGA.
    """
    def __init__(self, target_urls: List[str]):
        self.target_urls = target_urls
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml"
        }
        self.extracted_leads = []
        self.zenon_webhook = "http://127.0.0.1:8080/api/alert"

    async def fetch_url(self, session: aiohttp.ClientSession, url: str) -> str:
        for attempt in range(3): # Auto-healing retries
            try:
                async with session.get(url, headers=self.headers, timeout=10) as response:
                    if response.status == 200:
                        return await response.text()
                    logging.warning(f"HTTP {response.status} on {url}. Attempt {attempt+1}/3")
            except Exception as e:
                logging.error(f"Network error {url}: {e}. Attempt {attempt+1}/3")
            await asyncio.sleep(2)
        return ""

    async def scrape_url(self, session: aiohttp.ClientSession, url: str):
        logging.info(f"Infiltrating target: {url}")
        html = await self.fetch_url(session, url)
        if not html:
            return

        soup = BeautifulSoup(html, 'html.parser')
        emails = set(re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,10}", soup.get_text(separator=' ')))
        
        for email in emails:
            lead = {
                "source": url,
                "email": email,
                "context": "OP-Scraped from raw DOM"
            }
            self.extracted_leads.append(lead)
            logging.info(f"Target acquired: {email}")
            await self.push_to_zenon(session, lead)

    async def push_to_zenon(self, session: aiohttp.ClientSession, lead: Dict):
        """Pushes identified lead directly into the ZENON-OMEGA matrix for real-time triage."""
        payload = {"alert": f"[OP-LEAD] Found high-value target {lead['email']} at {lead['source']}. Evaluate for automated outreach."}
        try:
            async with session.post(self.zenon_webhook, json=payload, timeout=5) as resp:
                if resp.status in (200, 202):
                    logging.info(f"Lead {lead['email']} successfully pushed to ZENON-OMEGA.")
        except Exception:
            # Silently fallback if Zenon is not listening
            pass

    async def run_async(self):
        logging.info("Initiating God Mode scraping sequence...")
        async with aiohttp.ClientSession() as session:
            tasks = [self.scrape_url(session, url) for url in self.target_urls]
            await asyncio.gather(*tasks)
            
        os.makedirs("data/reports", exist_ok=True)
        with open("data/reports/wfp_leads_report.json", "w", encoding="utf-8") as f:
            json.dump(self.extracted_leads, f, indent=4, ensure_ascii=False)
        logging.info(f"Operation complete. {len(self.extracted_leads)} targets saved. Target annihilated.")

def run_scraper():
    urls_to_scrape = [
        "https://clutch.co/it-services",
        "https://www.ycombinator.com/companies",
        "https://builtwith.com/ecommerce"
    ]
    scraper = OPLeadScraper(urls_to_scrape)
    asyncio.run(scraper.run_async())

if __name__ == "__main__":
    run_scraper()
