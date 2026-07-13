import React from 'react';
import { motion } from 'motion/react';
import { Plus, X, RefreshCw } from 'lucide-react';

export interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLeadName: string;
  setNewLeadName: (val: string) => void;
  newLeadBio: string;
  setNewLeadBio: (val: string) => void;
  newLeadSource: string;
  setNewLeadSource: (val: string) => void;
  isCreatingLead: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = React.memo(({
  isOpen,
  onClose,
  newLeadName,
  setNewLeadName,
  newLeadBio,
  setNewLeadBio,
  newLeadSource,
  setNewLeadSource,
  isCreatingLead,
  onSubmit
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black cursor-pointer"
      />
      
      {/* Modal Body */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl z-10 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Plus size={16} />
            </span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Dodaj leada do Pipeline</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Imię i Nazwisko / Nazwa</label>
            <input
              type="text"
              required
              value={newLeadName}
              onChange={(e) => setNewLeadName(e.target.value)}
              placeholder="np. Robert Kubica"
              className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Platforma Źródłowa</label>
            <select
              value={newLeadSource}
              onChange={(e) => setNewLeadSource(e.target.value)}
              className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-neutral-300 focus:outline-none"
            >
              <option value="LinkedIn">LinkedIn</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="E-mail">E-mail</option>
              <option value="strony www">Strona WWW</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">Bio / Opis / Kontekst zawodowy</label>
            <textarea
              required
              value={newLeadBio}
              onChange={(e) => setNewLeadBio(e.target.value)}
              placeholder="np. Head of Sales w Tech-Startup. Skalujemy kampanie outbound..."
              rows={4}
              className="w-full bg-black border border-neutral-700 focus:border-emerald-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none custom-scrollbar"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isCreatingLead}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {isCreatingLead ? <RefreshCw className="animate-spin" size={13} /> : <Plus size={13} />}
              Stwórz Leada
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
});

AddLeadModal.displayName = 'AddLeadModal';
