import React from "react";
import { TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useVslStore } from "../../store/vslStore";

interface VslTrendsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VslTrendsModal = React.memo(function VslTrendsModal({
  isOpen,
  onClose,
}: VslTrendsModalProps) {
  const { setTopic, setParameter } = useVslStore();

  if (!isOpen) return null;

  const handleTrendSelect = (
    topicVal: string,
    targetAudienceVal: string,
    mainProblemVal: string,
    keyBenefitsVal: string,
    trendName: string
  ) => {
    setTopic(topicVal);
    setParameter("targetAudience", targetAudienceVal);
    setParameter("mainProblem", mainProblemVal);
    setParameter("keyBenefits", keyBenefitsVal);
    onClose();
    toast.success(`🔥 Wczytano Trend: ${trendName}`);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-800/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-400" />
            Skaner Trendów AI (Real-Time)
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Zamknij"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[75vh] custom-scrollbar">
          <p className="text-sm text-neutral-400 leading-relaxed font-mono">
            Wybierz gorący trend rynkowy AI zidentyfikowany przez system w ciągu ostatnich 24h. Wczytanie trendu automatycznie uzupełni temat oraz parametry skryptu (ból klienta, grupa docelowa, problem, korzyści), pozwalając na natychmiastowe wygenerowanie zoptymalizowanego pod konwersję wideo.
          </p>

          <div className="space-y-4">
            {/* Trend 1 */}
            <div
              className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
              onClick={() =>
                handleTrendSelect(
                  "AI Voice Agents (Vapi / Bland AI) zastępują recepcje i działy obsługi",
                  "Właściciele klinik, restauracji i małych e-commerce",
                  "Koszty zatrudniania ludzi do obierania setek powtarzalnych telefonów i umawiania wizyt",
                  "Agent głosowy 24/7 odbierający 10,000 rozmów na raz, umawiający z 98% skutecznością",
                  "AI Voice Agents"
                )
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-bold text-white">
                  1. Głosowi Agenci AI (Voice Automation)
                </h4>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                  <TrendingUp size={12} /> Viral
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Gigantyczny wzrost wyszukań tematu Voice AI na X i LinkedIn. Ludzie mają dość płacenia za infolinię. Niesamowity popyt na wdrożenia.
              </p>
            </div>

            {/* Trend 2 */}
            <div
              className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
              onClick={() =>
                handleTrendSelect(
                  "Autonomiczne Systemy Cold Email - Zastępowanie SDRów przez AI",
                  "Agencje B2B, Software House'y, SaaS",
                  "Palenie setek dolarów na lead generation bez odpowiedzi, wpadanie do SPAMu",
                  "Sieć 50 skrzynek rozgrzewana i prowadzona przez Agentów z auto-pisaniem personalizowanych wiadomości",
                  "Autonomiczny Cold Email"
                )
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-bold text-white">
                  2. Autonomiczny Outbound AI
                </h4>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                  <TrendingUp size={12} /> Rosnący
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Trend na systemy takie jak Smartlead+Clay zmiksowane w jedno rozwiązanie przez AI. Wysoki ROAS z kampanii promujących to.
              </p>
            </div>

            {/* Trend 3 */}
            <div
              className="group relative bg-black border border-neutral-800 hover:border-indigo-500/50 rounded-lg p-4 cursor-pointer transition-all overflow-hidden"
              onClick={() =>
                handleTrendSelect(
                  "SaaS Wrappers śmierć - Przejście na Micro-narzędzia Workflow",
                  "Solopreneurzy, Agencje Marketingowe i Twórcy",
                  "Klicenci anulują subskrypcje ChatGPT-wrapperów, brakuje twardego utility i oszczędności pracy",
                  "Dostarczane na tacy kompleksowe, ukryte automatyzacje w backendzie, które dają natychmiastowy 'Aha Moment'",
                  "Micro-Narzędzia Workflow"
                )
              }
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-md font-bold text-white">
                  3. Prawdziwe AI Automations & Workflows
                </h4>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                  <TrendingUp size={12} /> Stabilny Wzrost
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Biznes woli zapłacić 2000$ wdrożeniowcowi n8n/Make, niż kupić kolejny abonament za 20$/msc i robić to samemu.
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs text-white font-semibold rounded-lg transition-colors"
          >
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
});
