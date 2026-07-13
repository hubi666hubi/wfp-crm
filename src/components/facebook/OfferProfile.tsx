import React from 'react';
import { Compass } from 'lucide-react';

interface OfferProfileProps {
  yourOffer: string;
  setYourOffer: (val: string) => void;
  customInstructions: string;
  setCustomInstructions: (val: string) => void;
}

export const OfferProfile: React.FC<OfferProfileProps> = React.memo(({
  yourOffer,
  setYourOffer,
  customInstructions,
  setCustomInstructions,
}) => {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5">
      <h3 className="text-sm font-mono font-semibold text-neutral-300 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Compass className="text-blue-400" size={16} /> Profil Oferty w Zleceniach
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
            Twoja Oferta Biznesowa (Dopasowanie AI)
          </label>
          <textarea
            rows={4}
            value={yourOffer}
            onChange={(e) => setYourOffer(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-2 px-3 text-xs text-neutral-200 outline-none transition font-sans leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
            Wskazówki stylu Messenger (Opcjonalnie)
          </label>
          <input
            type="text"
            placeholder="np. Bardzo luźny styl, używaj emotikonów, brak panowania"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg py-1.5 px-3 text-xs text-neutral-200 outline-none transition"
          />
        </div>
      </div>
    </div>
  );
});

OfferProfile.displayName = 'OfferProfile';
