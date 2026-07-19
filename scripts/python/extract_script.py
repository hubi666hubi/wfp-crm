import json

with open(r'C:\Users\brend\.gemini\antigravity\brain\86f206dd-1b4f-4948-b262-116fcd263c91\.system_generated\logs\transcript_full.jsonl', encoding='utf-8') as f:
    lines = f.readlines()

with open('extract.txt', 'w', encoding='utf-8') as out:
    for line in lines:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT' and 'ValidationSandbox' in data.get('content', ''):
                out.write(data['content'] + '\n\n====================\n\n')
        except:
            pass
