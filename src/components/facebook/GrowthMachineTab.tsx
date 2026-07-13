import React from 'react';
import { Flame, RefreshCw, Compass, Sparkles, Zap, MessageSquare, Copy } from 'lucide-react';
import type { MachineData } from './types';

interface GrowthMachineTabProps {
  generatingMachine: boolean;
  growthMachine: MachineData | null;
  yourOffer: string;
  setYourOffer: (offer: string) => void;
  onGenerateGrowthMachine: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const GrowthMachineTab: React.FC<GrowthMachineTabProps> = React.memo(({
  generatingMachine,
  growthMachine,
  yourOffer,
  setYourOffer,
  onGenerateGrowthMachine,
  onCopyText,
}) => {
  return (
    <div className="space-y-6 font-sans">
      {/* Intro Hero banner */}
      <div className="p-6 bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold bg-rose-955 text-rose-400 rounded-full border border-rose-500/20 uppercase tracking-wider">
                Elite Growth Loop Engine
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Samonapędzająca się Maszyna Organiczna AI
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Wygeneruj jednym kliknięciem kompletny system pozyskiwania klientów na Facebooku. Gemini zaprojektuje magnetyczne grupy niszowe, viralowy darmowy zasób, post wyzwalający dyskusję oraz pierwszą konwersację na Messengerze dostosowane bezpośrednio do Twojej oferty.
            </p>
          </div>
          <button
            onClick={onGenerateGrowthMachine}
            disabled={generatingMachine}
            className="bg-gradient-to-r from-red-600 via-orange-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs px-5 py-3.5 rounded-2xl transition-all shadow-[0_0_25px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 uppercase tracking-wide cursor-pointer disabled:opacity-50 shrink-0 self-start md:self-auto"
          >
            {generatingMachine ? (
              <>
                <RefreshCw className="animate-spin text-white" size={14} /> Generowanie Maszyny...
              </>
            ) : (
              <>
                <Flame size={14} /> Uruchom Maszynę Organiczną AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Offer Input */}
      <div className="p-5 bg-neutral-900/30 border border-neutral-800 rounded-2xl space-y-4">
        <div>
          <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block mb-1.5">
            Twoja aktualna oferta biznesowa (na jej podstawie Gemini zaprojektuje growth loop)
          </label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={yourOffer}
              onChange={(e) => setYourOffer(e.target.value)}
              placeholder="np. Wdrożenia automatyzacji procesów AI i botów dla firm (budżet 5 000 - 15 005 zł)"
              className="flex-1 bg-neutral-950 border border-neutral-800 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:border-rose-500 text-white font-sans transition"
            />
          </div>
        </div>
      </div>

      {/* Loader */}
      {generatingMachine && (
        <div className="p-12 text-center bg-black/40 border border-neutral-900 rounded-3xl space-y-4 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-neutral-800 border-t-rose-500 animate-spin" />
            <Flame className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-rose-500 animate-pulse" size={24} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white font-bold font-mono animate-pulse">
              Sztuczna inteligencja Gemini wykuwa maszynę organiczną...
            </p>
            <p className="text-[10px] text-neutral-400">
              Odpalamy kreatywny pipeline, analizujemy psychologię wpływu, piszemy post i scenariusz Messenger...
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {!generatingMachine && growthMachine && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Niche Groups */}
          <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="text-blue-400" size={14} /> 1. Elitarne Grupy Facebookowe
                </h3>
                <span className="text-[9px] bg-blue-955/40 font-mono text-blue-400 px-2 py-0.5 rounded border border-blue-800/30 font-bold">KIERUNEK NICHINGU</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Wysoce specyficzne nisze społeczności, które przyciągną docelowego klienta z solidnym budżetem:
              </p>
              
              <div className="space-y-3 pt-2">
                {growthMachine.nicheGroups?.map((group, idx) => (
                  <div key={idx} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl space-y-1.5 relative group">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-xs font-bold text-white leading-snug">👥 {group.name}</span>
                      <button
                        type="button"
                        onClick={() => onCopyText(group.name, `nazwę grupy: ${group.name}`)}
                        className="text-neutral-500 hover:text-white transition p-1 rounded hover:bg-neutral-900 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Skopiuj nazwę grupy"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                    <p className="text-[10px] text-neutral-400 italic leading-relaxed">
                      {group.whyItWorks}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-3 text-[10px] text-neutral-500 border-t border-neutral-900 italic">
              Zyskujesz psychologiczny pancerz autorytetu od pierwszego wejrzenia.
            </div>
          </div>

          {/* Lead Magnet */}
          <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="text-amber-400" size={14} /> 2. ZAPALNIK (Viralowy Lead Magnet)
                </h3>
                <span className="text-[9px] bg-amber-955/40 font-mono text-amber-400 px-2 py-0.5 rounded border border-amber-800/30 font-bold">MAGNET PRZYCIĄGANIA</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Ten konkretny, darmowy schemat zelektryzuje docelowych przedsiębiorców i sprawi, że będą masowo komentować:
              </p>

              {growthMachine.leadMagnet && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-3.5 pt-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-amber-500 font-bold uppercase tracking-wider">Tytuł Zasobu</span>
                    <h4 className="text-xs font-bold text-white">{growthMachine.leadMagnet.title}</h4>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">Opis i Korzyści</span>
                    <p className="text-[10px] text-neutral-400 leading-normal">{growthMachine.leadMagnet.description}</p>
                  </div>
                  <div className="p-2.5 bg-amber-950/10 border border-amber-900/20 rounded-lg flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-400 font-bold">Hasło-Klucz (Trigger):</span>
                    <span className="text-xs font-mono font-black text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/20 select-all uppercase">
                      {growthMachine.leadMagnet.keyword}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="pt-3 text-[10px] text-neutral-500 border-t border-neutral-900 flex justify-between items-center italic">
              <span>Wklej hasło-klucz jako trigger w chatbocie Messenger.</span>
              <button
                type="button"
                onClick={() => {
                  if (growthMachine.leadMagnet) {
                    onCopyText(growthMachine.leadMagnet.title, "tytuł lead magnetu");
                  }
                }}
                className="text-[10px] font-mono text-amber-400 hover:underline cursor-pointer font-bold"
              >
                Skopiuj Tytuł
              </button>
            </div>
          </div>

          {/* Viral Post */}
          <div className="md:col-span-2 p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="text-red-400 animate-pulse" size={14} /> 3. ELEKTRYZUJĄCY POST (Zabójca Nudy)
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (growthMachine.viralPost) {
                    const fullPost = `${growthMachine.viralPost.hook}\n\n${growthMachine.viralPost.bodyText}\n\n${growthMachine.viralPost.cta}`;
                    onCopyText(fullPost, "Pełny Post");
                  }
                }}
                className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[10px] font-semibold transition flex items-center gap-1 border border-neutral-750 cursor-pointer"
              >
                <Copy size={11} /> Kopiuj Pełny Post
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Gotowy do opublikowania w grupach branżowych. Konstrukcja z mocnym hakiem, konkretną lekcją i CTA do automatycznej konwersji:
            </p>

            {growthMachine.viralPost && (
              <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4 text-xs">
                <div className="p-2.5 bg-red-955/10 border-l-2 border-red-500 text-neutral-200 font-bold italic leading-relaxed font-sans">
                  {growthMachine.viralPost.hook}
                </div>
                <div className="text-neutral-300 whitespace-pre-wrap leading-relaxed space-y-2">
                  {growthMachine.viralPost.bodyText}
                </div>
                <div className="p-2.5 bg-blue-950/10 border border-blue-900/20 rounded-lg text-blue-300 font-semibold italic">
                  {growthMachine.viralPost.cta}
                </div>
              </div>
            )}
          </div>

          {/* Messenger Script */}
          <div className="md:col-span-2 p-5 bg-gradient-to-r from-neutral-900/40 via-blue-950/10 to-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                <h3 className="text-xs font-mono font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="text-blue-400" size={14} /> 4. Ultra-krótki Scenariusz na Messengerze
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (growthMachine.messengerScript) {
                      onCopyText(growthMachine.messengerScript.firstMessage, "pierwszą wiadomość");
                    }
                  }}
                  className="bg-neutral-800 hover:bg-neutral-700 text-white px-2.5 py-1 rounded text-[10px] transition cursor-pointer font-bold"
                >
                  <Copy size={11} /> Kopiuj Wiadomość
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Pierwsza automatyczna wiadomość, jaką AI wyśle do osoby komentującej post na prawdziwym Messengerze. Rozpala konwersację naturalnie i przyjacielsko:
              </p>

              {growthMachine.messengerScript && (
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl relative">
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Aktywny Autopilot" />
                  <p className="text-xs text-blue-200 italic font-mono pr-4 leading-relaxed">
                    "{growthMachine.messengerScript.firstMessage}"
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-blue-955/15 border border-blue-900/20 rounded-xl text-[10px] text-blue-300 leading-normal flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
              <span>Ta linia jest zsynchronizowana z autopilotem Gemini Meta Webhook na karcie "Konta i Promocje Pro"!</span>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder */}
      {!generatingMachine && !growthMachine && (
        <div className="p-16 text-center border-2 border-dashed border-neutral-800 rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center mx-auto border border-neutral-800">
            <Flame className="text-neutral-600" size={20} />
          </div>
          <div className="space-y-1.5 max-w-sm mx-auto">
            <h4 className="text-sm font-semibold text-white">Maszyna jeszcze nieuruchomiona</h4>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Chcesz zautomatyzować wymyślanie elitarnych grup, chwytliwych schematów, viralowych postów i naturalnych skryptów Messenger? Kliknij przycisk "Uruchom Maszynę" u góry!
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

GrowthMachineTab.displayName = 'GrowthMachineTab';
