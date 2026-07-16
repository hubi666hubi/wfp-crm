import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  role: 'user' | 'agent';
  text: string;
  toolCalls?: { tool: string; args: any; result: string }[];
  ts: number;
}

const SESSION_ID = 'crm_agent_' + Date.now().toString(36);

export default function AgentChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      text: 'Cześć! Jestem **Zenek** — Twój autonomiczny asystent CRM 🤖\n\nMogę zarządzać leadami, wzbogacać profile, generować sekwencje outreach i analizować bazę.\n\nSpróbuj: _"Pokaż wszystkie leady"_ albo _"Dodaj leadów: Jan Kowalski, CEO TechCorp"_',
      ts: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedTools, setExpandedTools] = useState<Record<number, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text, ts: Date.now() }]);
    setLoading(true);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: SESSION_ID })
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'agent',
          text: data.response || '(Agent wykonał działania — sprawdź narzędzia poniżej)',
          toolCalls: data.toolCalls,
          ts: Date.now()
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'agent', text: `⚠️ Błąd: ${data.error}`, ts: Date.now() }]);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'agent', text: `⚠️ Błąd połączenia: ${e.message}`, ts: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearSession = async () => {
    await fetch(`/api/agent/session/${SESSION_ID}`, { method: 'DELETE' });
    setMessages([{ role: 'agent', text: 'Sesja wyczyszczona. Zaczynam od nowa 🔄', ts: Date.now() }]);
  };

  const QUICK = [
    'Pokaż wszystkie leady',
    'Podaj statystyki bazy',
    'Dodaj leada: Anna Wiśniewska, Dyrektor Marketingu, firma EcoTech',
    'Wzbogać wszystkich nowych leadów',
  ];

  const renderText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code style="background:#1e293b;padding:1px 4px;border-radius:3px;font-size:0.85em">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1527 50%, #0a0f1e 100%)',
      color: '#e2e8f0', fontFamily: "'Inter', sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(99,102,241,0.2)',
        background: 'rgba(13,21,39,0.9)', backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 0 20px rgba(99,102,241,0.5)'
          }}>🤖</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>Zenek</div>
            <div style={{ fontSize: 12, color: '#6366f1' }}>Autonomiczny Asystent CRM • Gemini AI</div>
          </div>
        </div>
        <button onClick={clearSession} style={{
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#ef4444', padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
          fontSize: 12, transition: 'all 0.2s'
        }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.25)') as any}
           onMouseOut={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.15)') as any}>
          🗑 Wyczyść sesję
        </button>
      </div>

      {/* Quick Actions */}
      <div style={{ padding: '10px 24px', display: 'flex', gap: 8, flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {QUICK.map((q, i) => (
          <button key={i} onClick={() => { setInput(q); inputRef.current?.focus(); }} style={{
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
            color: '#a5b4fc', padding: '4px 12px', borderRadius: 20, fontSize: 12,
            cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
          }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.2)') as any}
             onMouseOut={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)') as any}>
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.05)',
              border: msg.role === 'agent' ? '1px solid rgba(255,255,255,0.08)' : 'none',
              fontSize: 14, lineHeight: 1.6,
              boxShadow: msg.role === 'user' ? '0 4px 20px rgba(99,102,241,0.3)' : 'none'
            }} dangerouslySetInnerHTML={{ __html: renderText(msg.text) }} />

            {/* Tool Calls */}
            {msg.toolCalls && msg.toolCalls.length > 0 && (
              <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {msg.toolCalls.map((tc, ti) => (
                  <div key={ti} style={{ border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, overflow: 'hidden' }}>
                    <button onClick={() => setExpandedTools(prev => ({ ...prev, [idx * 100 + ti]: !prev[idx * 100 + ti] }))}
                      style={{
                        width: '100%', textAlign: 'left', padding: '6px 12px',
                        background: 'rgba(16,185,129,0.08)', border: 'none', color: '#10b981',
                        fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8
                      }}>
                      <span>⚙️</span>
                      <span style={{ fontFamily: 'monospace' }}>{tc.tool}({JSON.stringify(tc.args).substring(0, 50)})</span>
                      <span style={{ marginLeft: 'auto' }}>{expandedTools[idx * 100 + ti] ? '▲' : '▼'}</span>
                    </button>
                    {expandedTools[idx * 100 + ti] && (
                      <div style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', fontSize: 12, color: '#94a3b8', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' }}>
                        {tc.result}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              padding: '12px 18px', borderRadius: '18px 18px 18px 4px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', gap: 5, alignItems: 'center'
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`
                }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#6366f1' }}>Zenek myśli...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(13,21,39,0.9)', backdropFilter: 'blur(20px)'
      }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Napisz do Zenka... (Enter = wyślij, Shift+Enter = nowa linia)"
            rows={1} style={{
              flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 12, padding: '12px 16px', color: '#e2e8f0', fontSize: 14,
              resize: 'none', outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s', maxHeight: 120, lineHeight: 1.5
            }} onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.7)')}
               onBlur={e => (e.target.style.borderColor = 'rgba(99,102,241,0.3)')} />
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            width: 44, height: 44, borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            background: loading || !input.trim() ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', fontSize: 18, transition: 'all 0.2s', flexShrink: 0,
            boxShadow: loading || !input.trim() ? 'none' : '0 4px 15px rgba(99,102,241,0.4)'
          }}>➤</button>
        </div>
        <div style={{ fontSize: 11, color: '#475569', marginTop: 6, textAlign: 'center' }}>
          Zenek może dodawać, wzbogacać i analizować leady autonomicznie
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.3); border-radius: 2px; }
      `}</style>
    </div>
  );
}
