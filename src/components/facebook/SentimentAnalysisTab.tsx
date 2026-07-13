import React, { useState } from 'react';
import { Sparkles, RefreshCw, X, Check, Copy } from 'lucide-react';
import type { SentimentResult } from './types';

interface SentimentAnalysisTabProps {
  analyzingSentiment: boolean;
  sentimentResult: SentimentResult | null;
  setSentimentResult: (res: SentimentResult | null) => void;
  onAnalyzeSentiment: (text: string) => void;
}

export const SentimentAnalysisTab: React.FC<SentimentAnalysisTabProps> = React.memo(({
  analyzingSentiment,
  sentimentResult,
  setSentimentResult,
  onAnalyzeSentiment,
}) => {
  const [sentimentText, setSentimentText] = useState('');
  const [copiedResponse, setCopiedResponse] = useState(false);

  const handleAnalyze = () => {
    if (!sentimentText.trim()) return;
    onAnalyzeSentiment(sentimentText);
  };

  const copyResponse = () => {
    if (!sentimentResult) return;
    navigator.clipboard.writeText(sentimentResult.suggestedResponseDraft);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-950/15 border border-blue-900/20 rounded-xl space-y-2">
        <h4 className="text-xs font-bold font-mono uppercase text-blue-400 flex items-center gap-1.5">
          <Sparkles size={14} className="text-blue-400 animate-pulse" /> AI Analizator Wydźwięku i Priorytetu Komentarzy
        </h4>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Wklej tutaj dowolny komentarz, dyskusję lub post z grupy na Facebooku. Silnik AI Gemini przeprowadzi głęboką analizę emocjonalną, skompiluje zapalniki psychologiczne i określi priorytet handlowy dla Twojej ogólnej oferty.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-widest mb-1.5">
            Treść posta lub komentarza ze społeczności <span className="text-blue-500">*</span>
          </label>
          <textarea
            rows={5}
            required
            placeholder="Napisz lub wklej tutaj np.: 'Strasznie denerwuje mnie cały ten Zapier...'"
            value={sentimentText}
            onChange={(e) => setSentimentText(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-3 px-4 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed whitespace-pre-wrap"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!sentimentText.trim() || analyzingSentiment}
            onClick={handleAnalyze}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-6 rounded-lg text-xs tracking-wider transition uppercase flex items-center gap-2 disabled:bg-blue-800 shadow-[0_0_15px_rgba(24,119,242,0.15)] cursor-pointer"
          >
            {analyzingSentiment ? (
              <>
                <RefreshCw size={12} className="animate-spin" /> Przetwarzanie profilu emocjonalnego...
              </>
            ) : (
              <>
                <Sparkles size={12} /> Analizuj Wydźwięk & Priorytet AI
              </>
            )}
          </button>
        </div>
      </div>

      {sentimentResult && (
        <div className="mt-8 bg-neutral-900/40 p-5 rounded-2xl border border-neutral-800 space-y-6 animate-fade-in">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-1">
              📊 Raport Wydźwięku Inteligentnego
            </span>
            <button
              onClick={() => setSentimentResult(null)}
              className="text-neutral-500 hover:text-white transition cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Sentiment Gauges */}
            <div className="space-y-4 font-sans">
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl relative overflow-hidden">
                <span className="block text-[10px] font-mono text-neutral-505 uppercase tracking-widest mb-1">
                  Wydźwięk Emocjonalny (Sentiment)
                </span>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white">Strumień emocji:</span>
                  <span className={`text-xs font-bold font-mono px-2.5 py-0.5 rounded ${
                    sentimentResult.sentimentScore < -20 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                      : sentimentResult.sentimentScore > 20
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-neutral-500/10 text-neutral-400 border border-neutral-500/20'
                  }`}>
                    {sentimentResult.sentimentLabel} ({sentimentResult.sentimentScore >= 0 ? '+' : ''}{sentimentResult.sentimentScore}%)
                  </span>
                </div>

                <div className="relative bg-neutral-900 h-2.5 rounded-full overflow-hidden mt-3 flex">
                  <div className="w-1/2 flex justify-end bg-neutral-900 border-r border-neutral-800">
                    {sentimentResult.sentimentScore < 0 && (
                      <div 
                        className="h-full bg-red-500 rounded-l" 
                        style={{ width: `${Math.min(100, Math.abs(sentimentResult.sentimentScore))}%` }}
                      />
                    )}
                  </div>
                  <div className="w-1/2 bg-neutral-900">
                    {sentimentResult.sentimentScore >= 0 && (
                      <div 
                        className="h-full bg-emerald-500 rounded-r" 
                        style={{ width: `${Math.min(100, sentimentResult.sentimentScore)}%` }}
                      />
                    )}
                  </div>
                </div>
                
                <div className="flex justify-between text-[10px] text-neutral-600 mt-2 font-mono">
                  <span>-100% (Ból / Frustracja)</span>
                  <span>0% (Neutral)</span>
                  <span>+100% (Szał Zakupowy)</span>
                </div>

                {sentimentResult.sentimentScore < 0 && (
                  <p className="text-[10px] text-amber-500 font-sans mt-3.5 italic leading-relaxed">
                    💡 Wskazówka: Wykryto ujemny wydźwięk ({sentimentResult.sentimentScore}%). To wysoki ból uniemożliwiający normalne działanie. Doskonała okazja, aby wejść z outreach i zaoferować darmową wartość niwelujących ból!
                  </p>
                )}
              </div>

              {/* Priority */}
              <div className="p-4 bg-neutral-950/70 border border-neutral-800 rounded-xl">
                <span className="block text-[10px] font-mono text-neutral-505 uppercase tracking-widest mb-1">
                  Priorytetyzacja Handlowa AI
                </span>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Priorytet kontaktu:</span>
                  <span className="text-xs font-black font-mono text-blue-400">
                    {sentimentResult.priorityLabel} ({sentimentResult.priorityScore}%)
                  </span>
                </div>

                <div className="w-full bg-neutral-900 h-2 rounded-full overflow-hidden mb-2">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${sentimentResult.priorityScore}%` }}
                  />
                </div>

                <div className="flex justify-between text-[9px] font-mono text-neutral-600">
                  <span>Ignoruj / Zimny</span>
                  <span>Średni priorytet</span>
                  <span>Wymaga pilnego kontaktu!</span>
                </div>
              </div>
            </div>

            {/* Explanation & Triggers */}
            <div className="space-y-4 font-sans">
              <div className="p-4 bg-neutral-950/40 border border-neutral-800/50 rounded-xl space-y-2">
                <span className="block text-[10px] font-mono text-neutral-505 uppercase tracking-widest">
                  Uzasadnienie Psychologiczne
                </span>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  {sentimentResult.sentimentExplanation}
                </p>
              </div>

              <div className="p-4 bg-neutral-950/40 border border-neutral-800/50 rounded-xl space-y-2">
                <span className="block text-[10px] font-mono text-neutral-505 uppercase tracking-widest">
                  Zapalniki Emocjonalne (Emotional Triggers)
                </span>
                <div className="flex flex-wrap gap-2 pt-1">
                  {sentimentResult.emotionalTriggers.map((trig, idx) => (
                    <span 
                      key={idx} 
                      className="bg-red-950/15 text-red-400 border border-red-500/20 text-[10px] px-2.5 py-1 rounded-md font-medium"
                    >
                      🎯 {trig}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tactical Advice & Suggested Reply */}
          <div className="grid grid-cols-1 gap-5 pt-3 border-t border-neutral-900 font-sans">
            <div className="p-4 bg-neutral-950/60 border border-neutral-800 rounded-xl space-y-2.5">
              <span className="block text-[10px] font-mono text-neutral-405 uppercase tracking-widest">
                🛡️ Taktyka Kontaktu i Likwidacji Bólu
              </span>
              <ul className="space-y-1.5">
                {sentimentResult.tacticalActionPlan.map((step, idx) => (
                  <li key={idx} className="text-xs text-neutral-300 flex items-start gap-2 leading-relaxed">
                    <span className="text-blue-500 font-mono font-bold mt-0.5">{idx + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 bg-blue-950/10 border border-blue-500/20 rounded-xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono uppercase text-blue-400 font-black tracking-wider">
                  🤖 Wygenerowany Szkic Odpowiedzi (Dostrojony Emocjonalnie)
                </span>
                <button
                  type="button"
                  onClick={copyResponse}
                  className="bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white px-2.5 py-1 text-[10px] rounded transition flex items-center gap-1.5 font-bold cursor-pointer"
                >
                  {copiedResponse ? <Check size={10} /> : <Copy size={10} />} Kopiuj
                </button>
              </div>
              <p className="text-xs text-neutral-200 leading-relaxed bg-neutral-950 border border-neutral-900 p-3.5 rounded-lg border-l border-l-blue-500 italic whitespace-pre-wrap">
                "{sentimentResult.suggestedResponseDraft}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SentimentAnalysisTab.displayName = 'SentimentAnalysisTab';
