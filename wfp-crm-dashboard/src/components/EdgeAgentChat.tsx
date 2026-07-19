import { useState, useRef, useEffect } from 'react';

export const EdgeAgentChat: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'system', text: 'CONNECTION ESTABLISHED. OMEGA EDGE AI ACTIVE.' },
    { id: 2, role: 'agent', text: 'Jestem agentem WFP CRM. Mam dostęp do bazy wiedzy Supabase RAG. Jak mogę pomóc zamykać deale?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMsg = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Simulate Agent response querying RAG
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        role: 'system', 
        text: 'Querying Supabase Vector DB for objections...' 
      }]);
      
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          role: 'agent', 
          text: `Znalazłem odpowiedź w bazie wiedzy (Case Study: Agencja X). Użyj argumentu: "Wdrożenie OMEGA Engine zmniejsza koszt pozyskania leada o 40% w pierwszym kwartale".`
        }]);
      }, 1500);
    }, 500);
  };

  return (
    <div className="h-full flex flex-col p-4 bg-black/50">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded border ${
              msg.role === 'user' 
                ? 'bg-[#00ff00]/20 border-[#00ff00]/50 text-[#00ff00]' 
                : msg.role === 'system'
                ? 'bg-transparent border-none text-[#00ff00]/50 text-xs uppercase font-mono'
                : 'bg-[#00ff00]/5 border-[#00ff00]/30 text-[#00ff00]'
            }`}>
              {msg.role === 'agent' && <div className="text-xs opacity-50 mb-1 border-b border-[#00ff00]/20 pb-1">OMEGA.AGENT</div>}
              {msg.role === 'user' && <div className="text-xs opacity-50 mb-1 border-b border-[#00ff00]/20 pb-1 text-right">USER</div>}
              <div className="whitespace-pre-wrap">{msg.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="relative flex gap-2">
        <div className="absolute left-3 top-3 text-[#00ff00] animate-pulse">{'>'}</div>
        <input 
          type="text" 
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full bg-[#00ff00]/5 border border-[#00ff00]/30 rounded p-3 pl-8 text-[#00ff00] placeholder-[#00ff00]/30 focus:outline-none focus:border-[#00ff00] focus:ring-1 focus:ring-[#00ff00] transition-all"
          placeholder="Zapytaj agenta o argument sprzedażowy..."
        />
        <button 
          type="submit"
          className="bg-[#00ff00]/20 hover:bg-[#00ff00]/40 border border-[#00ff00]/50 px-6 py-2 rounded text-[#00ff00] transition-colors font-bold tracking-widest uppercase"
        >
          Send
        </button>
      </form>
      
      {/* Custom scrollbar styles can be added to index.css or directly injected */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,255,0,0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,255,0,0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,255,0,0.5); }
      `}</style>
    </div>
  );
};
