import React from "react";
import { Send, X, Activity, Sparkles } from "lucide-react";

interface VslOutreachModalProps {
  isOpen: boolean;
  onClose: () => void;
  outreachClientName: string;
  setOutreachClientName: (name: string) => void;
  outreachClientEmail: string;
  setOutreachClientEmail: (email: string) => void;
  isGeneratingOutreach: boolean;
  generatedOutreach: { subject: string; body: string } | null;
  setGeneratedOutreach: React.Dispatch<
    React.SetStateAction<{ subject: string; body: string } | null>
  >;
  isSendingOutreach: boolean;
  handleGenerateOutreach: () => void;
  handleSendAndCreateClient: () => void;
}

export const VslOutreachModal = React.memo(function VslOutreachModal({
  isOpen,
  onClose,
  outreachClientName,
  setOutreachClientName,
  outreachClientEmail,
  setOutreachClientEmail,
  isGeneratingOutreach,
  generatedOutreach,
  setGeneratedOutreach,
  isSendingOutreach,
  handleGenerateOutreach,
  handleSendAndCreateClient,
}: VslOutreachModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setGeneratedOutreach(null);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-rose-950/20">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Send size={18} className="text-rose-400" />
            Generuj zimną kampanię e-mailową (Outreach)
          </h3>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-white transition-colors"
            title="Zamknij"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          <p className="text-sm text-neutral-400 leading-relaxed font-mono">
            System pobierze strukturę wygenerowanego skryptu VSL i przekuje go w spersonalizowaną, zimną sekwencję e-mail z precyzyjnie zaaplikowanymi wyzwalaczami uwagi z Twojej niszy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                Nazwa / Firma Klienta
              </label>
              <input
                type="text"
                value={outreachClientName}
                onChange={(e) => setOutreachClientName(e.target.value)}
                placeholder="Np. Jan Kowalski / ACME Corp"
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                E-mail Klienta
              </label>
              <input
                type="email"
                value={outreachClientEmail}
                onChange={(e) => setOutreachClientEmail(e.target.value)}
                placeholder="Np. jan@kowalski.pl"
                className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {!generatedOutreach ? (
            <button
              type="button"
              onClick={handleGenerateOutreach}
              disabled={isGeneratingOutreach}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-neutral-800 text-white font-semibold rounded-lg text-sm transition-colors shadow-lg disabled:cursor-not-allowed"
            >
              {isGeneratingOutreach ? (
                <>
                  <Activity className="animate-spin" size={16} />
                  Trwa neurobiologiczna generacja treści...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Uruchom Silnik Copywritingu i Generuj E-mail
                </>
              )}
            </button>
          ) : (
            <div className="flex flex-col gap-4 border border-rose-900/30 bg-rose-950/5 rounded-lg p-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">
                  Temat Wiadomości (Pattern Interrupt):
                </span>
                <input
                  type="text"
                  value={generatedOutreach.subject}
                  onChange={(e) =>
                    setGeneratedOutreach((prev) => (prev ? { ...prev, subject: e.target.value } : null))
                  }
                  className="bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white font-medium focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">
                  Treść Wiadomości (HTML):
                </span>
                <div className="bg-neutral-950 border border-neutral-800 rounded p-4 max-h-[220px] overflow-y-auto text-sm text-neutral-300 font-mono space-y-2">
                  <div dangerouslySetInnerHTML={{ __html: generatedOutreach.body }} />
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSendAndCreateClient}
                  disabled={isSendingOutreach}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 text-white font-bold rounded-lg text-sm transition-colors shadow-lg"
                >
                  {isSendingOutreach ? (
                    <>
                      <Activity className="animate-spin" size={16} />
                      Rejestrowanie i wysyłanie...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Zarejestruj Klienta w CRM i Wyślij Outreach!
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratedOutreach(null)}
                  className="w-full py-2 bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 rounded-lg text-xs transition-colors"
                >
                  Generuj Ponownie
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
