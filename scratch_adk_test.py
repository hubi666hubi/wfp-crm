import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from google.adk.agents import Agent
    print("Agent importowany pomyslnie.")
    
    agent = Agent(
        name="test_agent",
        model="gemini-1.5-flash",
        instruction="Odpowiedz krótko: OK.",
        tools=[]
    )
    
    # Próba uruchomienia agenta
    try:
        response = agent("Test")
        print("Call agent() zwrocil:", type(response))
    except Exception as e:
        print("Błąd agent():", e)
        
    try:
        response2 = agent.run("Test 2")
        print("Call agent.run() zwrocil:", type(response2))
    except Exception as e:
        print("Błąd agent.run():", e)
        
except Exception as e:
    print("Blad glowny:", e)
