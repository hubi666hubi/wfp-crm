import React, { useState, useEffect, useRef } from 'react';
import { Magnet, Activity, Bot, Zap, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export interface LeadMagnetCreatorProps {
  sendEmail: (to: string, subject: string, body: string) => Promise<void>;
}

export const LeadMagnetCreator: React.FC<LeadMagnetCreatorProps> = React.memo(({ sendEmail }) => {
  const [email, setEmail] = useState('');
  const [pain, setPain] = useState('');
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const captureTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const handleCaptureLead = () => {
    if (!email || !pain) return;
    setGenerating(true);
    setSuccess(false);
    setErrorMessage('');

    captureTimeoutRef.current = setTimeout(async () => {
      try {
        const bodyContent = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #1f1f1f;">
            <h2 style="color: #10b981; font-family: sans-serif;">Cześć! Twój Zapalnik AI Onboarding</h2>
            <p>Nasz system przeanalizował wskazany ból operacyjny:</p>
            <blockquote style="border-left: 4px solid #10b981; padding-left: 16px; color: #a3a3a3; font-style: italic; background: #141414; padding: 12px; margin: 16px 0;">
              "${pain}"
            </blockquote>
            <p>Przygotowaliśmy dla Ciebie dedykowany schemat automatyzacji. Jeden z naszych asystentów skontaktuje się, aby omówić szczegóły.</p>
            <p style="margin-top: 30px; font-size: 12px; color: #737373;">Pozdrawiamy,<br>Zespół Zapalnik CRM PRO</p>
          </div>
        `;
        
        await sendEmail(email, "Twój spersonalizowany Plan Automatyzacji!", bodyContent);
        
        setGenerating(false);
        setSuccess(true);
        setEmail('');
        setPain('');
        toast.success("E-book i plan automatyzacji wysłany bezpośrednio przez Twoje konto Gmail!");
        
        successTimeoutRef.current = setTimeout(() => setSuccess(false), 5000);
      } catch (err: unknown) {
        console.error(err);
        setGenerating(false);
        setErrorMessage(err instanceof Error ? err.message : 'Błąd podczas wysyłania emaila.');
        toast.error("Błąd wysyłki: " + (err instanceof Error ? err.message : "Spróbuj ponownie"));
      }
    }, 4500); 
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-6">
        <h3 className="text-lg font-medium text-white mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
          <Magnet size={18} className="text-rose-400" />
          Złap Leada & Generuj E-book
        </h3>
        <p className="text-sm text-neutral-400 mb-6">
          Symulacja frontu, który widzi Twój klient. Podaje maila i główny ból, a zestaw robotów "M-Bot" natychmiast kreuje rozwiązanie i wysyła je przez Google Workspace.
        </p>

        <div className="space-y-4">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-500 text-sm">
              {errorMessage}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">E-mail Klienta</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="klient@startup.com"
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              disabled={generating || success}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Z czym klient ma TERAZ największy problem? (Pain point)</label>
            <textarea 
              value={pain}
              onChange={(e) => setPain(e.target.value)}
              placeholder="Od trzech miesięcy tracimy klientów po rejestracji, onboarding ssie..."
              rows={3}
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-text-white custom-scrollbar"
              disabled={generating || success}
            />
          </div>
          
          <button 
            onClick={handleCaptureLead}
            disabled={generating || success || !email || !pain}
            className={`w-full py-3 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              success ? 'bg-emerald-600 text-white' : 'bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.3)]'
            }`}
          >
            {generating ? <Zap className="animate-spin text-white" size={18} /> : success ? <Mail size={18} /> : <Bot size={18} />}
            {generating ? 'Generowanie strategicznego planu B2B...' : success ? 'E-book wysłany na skrzynkę!' : 'Złap Leada przez AI Magnet'}
          </button>
        </div>
        
        <AnimatePresence>
           {generating && (
             <motion.div 
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: 'auto' }}
               exit={{ opacity: 0, height: 0 }}
               className="mt-4 p-4 bg-neutral-950 border border-neutral-800 rounded-lg text-xs font-mono text-neutral-400"
             >
               <div className="flex items-center gap-2 mb-2 text-rose-400"><Bot size={14} /> Agent A: Rozczytywanie problemu...</div>
               <div className="flex items-center gap-2 mb-2 text-amber-400"><Bot size={14} /> Agent B: Draftowanie spisu treści i struktury...</div>
               <div className="flex items-center gap-2 text-emerald-400"><Bot size={14} /> Agent C: Budowanie szablonu HTML i wysyłka do {email}</div>
             </motion.div>
           )}
        </AnimatePresence>
      </div>

      <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-6">
         <h3 className="text-md font-bold text-white mb-2 flex items-center gap-2">
           <Activity size={18} className="text-emerald-500" />
           Analizy i Konwersje
         </h3>
         <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
           System monitoruje konwersję generowanych zajączków z postów na blogach lub LinkedIn w czasie rzeczywistym.
         </p>
         <div className="space-y-4">
           <div className="flex justify-between items-center p-3.5 bg-neutral-950 rounded-xl border border-neutral-850">
             <div>
                <h4 className="text-xs font-bold text-gray-200">Wysłane personalne e-booki: 41</h4>
                <p className="text-[10px] text-neutral-500 mt-1">Konwersja na spotkanie demo: 22.8%</p>
             </div>
             <div className="text-emerald-500 font-bold text-sm">+315%</div>
           </div>

           <div className="flex justify-between items-center p-3.5 bg-neutral-950 rounded-xl border border-neutral-850">
             <div>
                <h4 className="text-xs font-bold text-gray-200">Unikalne odczyty: 84%</h4>
                <p className="text-[10px] text-neutral-500 mt-1">Czas wygenerowania średnio: 4.2 sek</p>
             </div>
             <div className="text-purple-400 font-bold text-sm">Bardzo wysoki</div>
           </div>
         </div>
      </div>
    </div>
  );
});

LeadMagnetCreator.displayName = 'LeadMagnetCreator';
