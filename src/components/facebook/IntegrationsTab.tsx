import React from 'react';
import { Share2, Flame, MessageSquare, Copy, Check, ExternalLink } from 'lucide-react';
import type { FBAccount, MessengerConfig } from './types';

interface IntegrationsTabProps {
  fbAccount: FBAccount;
  setFbAccount: (account: FBAccount) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  activePromos: string[];
  onApplyPromo: (e: React.FormEvent) => void;
  messengerConfig: MessengerConfig;
  setMessengerConfig: (config: MessengerConfig) => void;
  isSavingMessenger: boolean;
  onSaveMessengerConfig: () => void;
  onCopyText: (text: string, label: string) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = React.memo(({
  fbAccount,
  setFbAccount,
  promoCode,
  setPromoCode,
  activePromos,
  onApplyPromo,
  messengerConfig,
  setMessengerConfig,
  isSavingMessenger,
  onSaveMessengerConfig,
  onCopyText,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* FB Account Status */}
        <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Share2 className="text-blue-500" size={18} /> Profil Facebook Graph API
          </h3>

          <div className="flex items-center gap-3 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <img 
              src={fbAccount.avatarUrl} 
              alt="Avatar" 
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full border border-neutral-800"
            />
            <div>
              <h4 className="text-xs font-bold text-white">{fbAccount.name}</h4>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">ID konta: {fbAccount.profileId}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Wygaśnięcie tokenu:</span>
              <span className="font-mono text-emerald-400">{fbAccount.tokenExpires}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Status Autopilota:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={fbAccount.autopilot}
                  onChange={(e) => setFbAccount({...fbAccount, autopilot: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-neutral-400">Automatyczny pomocnik komentarzy:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={fbAccount.autoComment}
                  onChange={(e) => setFbAccount({...fbAccount, autoComment: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Promo Coupons */}
        <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Flame className="text-amber-500" size={17} /> Pakiety Elitarne i Promocje
          </h3>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Znalazłeś sekretny kod promocyjny PRO? Wpisz go poniżej, aby odblokować unikalne grupy biznesowe ze strumienia i darmowe credity Gemini Premium.
          </p>

          <form onSubmit={onApplyPromo} className="flex gap-2">
            <input 
              type="text" 
              placeholder="np. OJCIEC" 
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono uppercase"
            />
            <button 
              type="submit"
              className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Aktywuj
            </button>
          </form>

          {activePromos.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[10px] font-mono text-neutral-500 uppercase">Aktywowane pakiety</span>
              <div className="flex flex-wrap gap-1.5">
                {activePromos.map((promo) => (
                  <span key={promo} className="bg-emerald-950/30 text-emerald-400 border border-emerald-900 text-[10px] font-mono px-2.5 py-1 rounded">
                    🎁 KOD PRO: {promo} (Aktywny)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta Messenger Live Integration */}
      <div className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="text-blue-400" size={18} /> Reale Połączenie z Facebook Messengerem (Meta Webhook)
            </h3>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Podepnij swój prawdziwy Fanpage FB i pozwól sztucznej inteligencji Gemini na automatyczne odpisywanie klientom.
            </p>
          </div>
          <span className="text-[10px] bg-blue-950 font-mono text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-500/20 w-fit self-start sm:self-auto font-bold uppercase tracking-wider">
            Integracja Live API
          </span>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Webhook URL (read only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Adres URL Webhooka (Wklej w Meta Developer Portal)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  readOnly
                  value={`${window.location.origin}/api/messenger/webhook`}
                  className="flex-1 bg-neutral-950 border border-neutral-800 px-3 py-2 rounded-lg text-xs outline-none text-neutral-300 font-mono"
                />
                <button 
                  type="button"
                  onClick={() => onCopyText(`${window.location.origin}/api/messenger/webhook`, 'URL webhooka')}
                  className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white px-3 py-2 rounded-lg text-xs transition flex items-center justify-center shrink-0 cursor-pointer"
                  title="Skopiuj URL"
                >
                  <Copy size={12} />
                </button>
              </div>
              <span className="text-[9px] text-neutral-500 leading-normal block">
                Adres URL przekierowujący zdarzenia wiadomości z Meta do Twojej instancji Zapalnika.
              </span>
            </div>

            {/* Verify Token */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Meta Verify Token (Klucz weryfikacyjny)</label>
              <input 
                type="text" 
                placeholder="Wpisz dowolny tajny token (np. twój-klucz-messenger)"
                value={messengerConfig.verifyToken}
                onChange={(e) => setMessengerConfig({ ...messengerConfig, verifyToken: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono"
              />
              <span className="text-[9px] text-neutral-500 leading-normal block">
                Zabezpiecza Twój endpoint webhooka. Meta poprosi o ten sam klucz przy zatwierdzaniu weryfikacji.
              </span>
            </div>

            {/* Page Access Token */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-mono text-neutral-400 uppercase font-bold block">Page Access Token (Klucz dostępu do Fanpage)</label>
              <input 
                type="password" 
                placeholder="Wklej Page Access Token (EAAG...)"
                value={messengerConfig.pageAccessToken}
                onChange={(e) => setMessengerConfig({ ...messengerConfig, pageAccessToken: e.target.value })}
                className="w-full bg-neutral-950 border border-neutral-850 px-3 py-2 rounded-lg text-xs outline-none focus:border-blue-500 text-white font-mono"
              />
              <span className="text-[9px] text-neutral-500 leading-normal block">
                Token wygenerowany w konsoli Meta Developers, zezwalający robotom Zapalnika na pobieranie i odpisywanie na wiadomości w Twoim imieniu.
              </span>
            </div>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  🤖 Autopilot Odpowiedzi Gemini (Real-time)
                </span>
                <p className="text-[10px] text-neutral-400 leading-normal">
                  Gdy klient do Ciebie napisze na prawdziwym Messengerze, Gemini natychmiast wygeneruje magnetyczną, dopasowaną odpowiedź w 1-2 sekundy i odeśle ją do czatu.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input 
                  type="checkbox" 
                  checked={messengerConfig.autopilotEnabled}
                  onChange={(e) => setMessengerConfig({ ...messengerConfig, autopilotEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 after:border-neutral-305 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-checked:after:bg-white"></div>
              </label>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl text-[11px] text-neutral-300 space-y-2 leading-relaxed">
            <span className="text-[10px] font-mono text-neutral-400 font-bold uppercase block">📋 INSTRUKCJA PODPIĘCIA MESSENGERA:</span>
            <ol className="list-decimal list-inside space-y-1.5 pl-1 text-[11px] text-neutral-400 font-sans">
              <li>Zaloguj się na platformie <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-0.5">Meta Developers <ExternalLink size={10} /></a> i utwórz aplikację biznesową.</li>
              <li>Dodaj produkt <strong className="text-white">Messenger</strong> w panelu ustawień aplikacji.</li>
              <li>Przejdź do zakładki <strong className="text-white">Webhooks</strong> w konfiguracji Messenger i podaj:</li>
              <ul className="list-disc list-inside pl-4 text-neutral-400 py-0.5">
                <li>Callback URL: <code className="text-blue-300 font-mono bg-neutral-900 px-1 py-0.5 rounded text-[10px]">{`${window.location.origin}/api/messenger/webhook`}</code></li>
                <li>Verify Token: <code className="text-amber-300 font-mono bg-neutral-900 px-1 py-0.5 rounded text-[10px]">{messengerConfig.verifyToken || "Twój Verify Token"}</code></li>
              </ul>
              <li>Zaznacz i subskrybuj pola zdarzeń: <code className="text-neutral-300 font-mono">messages</code> oraz <code className="text-neutral-300 font-mono">messaging_postbacks</code>.</li>
              <li>Podłącz swój Fanpage do aplikacji Meta, wygeneruj <strong className="text-white">Page Access Token</strong> i wklej go wyżej. Kliknij przycisk Zapisz.</li>
            </ol>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              disabled={isSavingMessenger}
              onClick={onSaveMessengerConfig}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 uppercase tracking-wide cursor-pointer"
            >
              {isSavingMessenger ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Zapisywanie...
                </>
              ) : (
                <>
                  <Check size={12} /> Zapisz Integrację Messenger
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

IntegrationsTab.displayName = 'IntegrationsTab';
