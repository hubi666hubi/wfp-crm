import React, { useState } from "react";
import { Sparkles, Activity, Plus, X } from "lucide-react";
import { useVslStore } from "../../store/vslStore";

interface VslParametersFormProps {
  errors: Record<string, string | undefined>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string | undefined>>>;
  handleGenerate: () => void;
}

export const VslParametersForm = React.memo(function VslParametersForm({
  errors,
  setErrors,
  handleGenerate,
}: VslParametersFormProps) {
  const {
    topic,
    setTopic,
    parameters,
    setParameter,
    globalKeywords,
    addGlobalKeyword,
    removeGlobalKeyword,
    generating,
  } = useVslStore();

  const [newGlobalKeywordInput, setNewGlobalKeywordInput] = useState("");

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTopic(e.target.value);
    setErrors((prev) => ({ ...prev, topic: undefined }));
  };

  const handleParamChange = (key: keyof import("../../store/vslStore").VslParameters) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setParameter(key, e.target.value);
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleAddKeyword = () => {
    if (newGlobalKeywordInput.trim()) {
      addGlobalKeyword(newGlobalKeywordInput);
      setNewGlobalKeywordInput("");
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Ból Docelowego Klienta (Cel Kampanii)
          </label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={topic}
                onChange={handleTopicChange}
                placeholder="Np. Niskie konwersje na webinarze / Duży churn z SaaS-a..."
                className={`w-full bg-black border ${
                  errors.topic ? "border-rose-500" : "border-neutral-700"
                } rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors`}
                disabled={generating}
              />
              {errors.topic && (
                <p className="text-rose-500 text-xs mt-1.5">{errors.topic}</p>
              )}
            </div>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? <Activity className="animate-spin" /> : <Sparkles size={20} />}
              {generating ? "Generowanie..." : "Generuj Skrypt"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-800">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Nazwa Produktu
            </label>
            <input
              type="text"
              value={parameters.productName}
              onChange={handleParamChange("productName")}
              placeholder="Np. Omega System..."
              className={`w-full bg-black border ${
                errors.productName ? "border-rose-500" : "border-neutral-700"
              } rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
            />
            {errors.productName && (
              <p className="text-rose-500 text-xs mt-1">{errors.productName}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Grupa Docelowa
            </label>
            <input
              type="text"
              value={parameters.targetAudience}
              onChange={handleParamChange("targetAudience")}
              placeholder="Np. Właściciele agencji marketingowych..."
              className={`w-full bg-black border ${
                errors.targetAudience ? "border-rose-500" : "border-neutral-700"
              } rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
            />
            {errors.targetAudience && (
              <p className="text-rose-500 text-xs mt-1">{errors.targetAudience}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Główny Problem Klienta
            </label>
            <input
              type="text"
              value={parameters.mainProblem}
              onChange={handleParamChange("mainProblem")}
              placeholder="Np. Brak przewidywalnych przychodów..."
              className={`w-full bg-black border ${
                errors.mainProblem ? "border-rose-500" : "border-neutral-700"
              } rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
            />
            {errors.mainProblem && (
              <p className="text-rose-500 text-xs mt-1">{errors.mainProblem}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Kluczowe Korzyści
            </label>
            <input
              type="text"
              value={parameters.keyBenefits}
              onChange={handleParamChange("keyBenefits")}
              placeholder="Np. Automatyzacja leadów, wyższe ROI..."
              className={`w-full bg-black border ${
                errors.keyBenefits ? "border-rose-500" : "border-neutral-700"
              } rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors`}
            />
            {errors.keyBenefits && (
              <p className="text-rose-500 text-xs mt-1">{errors.keyBenefits}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Jakość Wideo (wskazówka dla skryptu)
            </label>
            <select
              value={parameters.videoQuality || "1080p"}
              onChange={handleParamChange("videoQuality")}
              className="w-full bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500 transition-colors"
            >
              <option value="720p">720p (HD)</option>
              <option value="1080p">1080p (Full HD)</option>
              <option value="1440p">1440p (2K)</option>
              <option value="4k">4K (Ultra HD)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <label className="block text-sm font-medium text-gray-400 mb-2">
            Globalne słowa kluczowe (AI użyje ich w promptach obrazów)
          </label>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newGlobalKeywordInput}
                onChange={(e) => setNewGlobalKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddKeyword();
                  }
                }}
                placeholder="Np. cyberpunk, mroczny klimat, profesjonalne biuro..."
                className="flex-1 bg-black border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={generating}
              />
              <button
                onClick={handleAddKeyword}
                disabled={!newGlobalKeywordInput.trim() || generating}
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium rounded-lg transition-all flex items-center gap-1 disabled:opacity-50"
              >
                <Plus size={16} /> Dodaj
              </button>
            </div>

            {globalKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {globalKeywords.map((kw, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-xs font-medium"
                  >
                    <span>{kw}</span>
                    <button
                      onClick={() => removeGlobalKeyword(kw)}
                      className="text-indigo-400 hover:text-rose-400 transition-colors p-0.5 rounded-full hover:bg-indigo-500/20"
                      title="Usuń słowo kluczowe"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
