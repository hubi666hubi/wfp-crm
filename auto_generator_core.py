import os
import httpx
import asyncio

PROJECT_ROOT = r"C:\Users\brend\Desktop\XX2"
API_URL = "http://localhost:8000"

async def check_backend_health():
    async with httpx.AsyncClient() as c:
        try:
            r = await c.get(f"{API_URL}/docs")
            if r.status_code == 200:
                print("Polaczenie stabilne.")
                return True
        except:
            print("Brak polaczenia z AI.")
            return False

async def create_task(txt, title):
    p = {
        "avatar_id": 1,
        "voice_id": 1,
        "text": txt,
        "title": title,
        "options": {"speed": 1.0, "temperature": 0.7}
    }
    async with httpx.AsyncClient() as c:
        try:
            print(f"Wstrzykiwanie: {title}...")
            r = await c.post(f"{API_URL}/api/tasks", json=p, timeout=30.0)
            if r.status_code == 200:
                print(f"Task OK: {r.json().get('task_id')}")
            else:
                print(f"Blad: {r.status_code}")
        except Exception as e:
            print(f"Blad komunikacji: {e}")

async def main():
    os.environ["PROJECT_ROOT"] = PROJECT_ROOT
    if not await check_backend_health():
        return
    leads = [
        {"t": "Lead_Chlopaki_01", "txt": "Czesc! Wygenerowalem to wideo automatycznie przez AI."},
        {"t": "Lead_Automation_02", "txt": "Dzien dobry, ten glos i awatar to w stu procentach sztuczna inteligencja."}
    ]
    for l in leads:
        await create_task(l["txt"], l["t"])
        await asyncio.sleep(2)

if __name__ == "__main__":
    asyncio.run(main())