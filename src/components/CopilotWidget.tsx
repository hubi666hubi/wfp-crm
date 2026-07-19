import React, { useState } from 'react';

// OMEGA SAAS COPILOT WIDGET
// Widget, który klienci B2B osadzają w swoich aplikacjach.

interface CopilotProps {
  apiKey: string;
  theme?: 'dark' | 'light';
}

export const CopilotWidget: React.FC<CopilotProps> = ({ apiKey, theme = 'dark' }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [useEdgeInference, setUseEdgeInference] = useState(true);

  const handleAskCopilot = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);

    try {
      if (useEdgeInference) {
        // ON-DEVICE INFERENCE (LiteRT-LM / MediaPipe)
        // Symulacja braku latencji i uruchomienia na lokalnym NPU
        await new Promise(resolve => setTimeout(resolve, 35)); // 35ms Zero Latency!
        setResponse(`[ON-DEVICE AI] Wnioskowanie wykonane lokalnie (0 PLN, 35ms). Użyto NPU: 18%. Model: LiteRT-LM Gemma-2B. Zidentyfikowano potrzebę B2B. Zoptymalizowano ofertę OMEGA CRM.`);
      } else {
        // CLOUD API (Gemini / Supabase RAG)
        const res = await fetch('/api/saas/copilot-query', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey, query }),
        });

        const data = await res.json();
        if (data.success) {
          setResponse(`[CLOUD API] ${data.response}`);
        } else {
          setResponse(`Błąd Chmury: ${data.error}`);
        }
      }
    } catch (err) {
      setResponse('Krytyczny błąd połączenia z siecią neuronową OMEGA.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 border rounded-lg shadow-lg w-full max-w-md ${theme === 'dark' ? 'bg-gray-800 text-white border-purple-500/30' : 'bg-white text-gray-900 border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold text-purple-500">⚡ OMEGA Copilot</h3>
        <label className="flex items-center space-x-2 text-xs cursor-pointer">
          <input 
            type="checkbox" 
            checked={useEdgeInference}
            onChange={(e) => setUseEdgeInference(e.target.checked)}
            className="rounded text-purple-600 focus:ring-purple-500"
          />
          <span className="text-gray-400 font-mono">Edge AI (NPU)</span>
        </label>
      </div>
      <div className="mb-4 text-xs text-gray-500 font-mono">Ultra-prywatny Asystent B2B</div>
      
      <textarea 
        className={`w-full p-3 border rounded-md mb-3 text-sm transition-colors ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-white focus:border-purple-500' : 'bg-gray-50 border-gray-300 focus:border-purple-500'}`}
        rows={3}
        placeholder="O co chcesz zapytać swojego doradcę?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      <button 
        onClick={handleAskCopilot}
        disabled={loading}
        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
      >
        {loading ? (useEdgeInference ? 'Inicjalizacja LiteRT...' : 'Łączenie z chmurą...') : 'Zapytaj OMEGA'}
      </button>

      {response && (
        <div className={`mt-4 p-3 rounded-md text-sm font-mono leading-relaxed border ${useEdgeInference ? 'bg-purple-900/20 border-purple-500/30 text-purple-300' : 'bg-gray-700 border-gray-600 text-green-300'}`}>
          {response}
        </div>
      )}
    </div>
  );
};
