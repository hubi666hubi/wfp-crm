import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, Zap, Video, Calendar, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MobileActionSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { id: 'new-lead', title: 'Dodaj Leada (Zapalnik)', icon: Users, path: '/crm', color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { id: 'launch-vsl', title: 'Generuj VSL', icon: Video, path: '/vsl-generator', color: 'text-rose-400', bg: 'bg-rose-500/10' },
    { id: 'new-campaign', title: 'Nowa Kampania', icon: Zap, path: '/automation', color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { id: 'schedule', title: 'Zaplanuj Call', icon: Calendar, path: '/closer', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const handleNavigate = (path: string) => {
    setIsOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Floating Action Button (Mobile Only) */}
      <div className="fixed bottom-6 right-6 z-40 lg:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-rose-600 rounded-full flex items-center justify-center text-white shadow-[0_0_20px_rgba(225,29,72,0.6)] cursor-pointer active:scale-95 transition-transform"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] lg:hidden"
            />
            
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 rounded-t-3xl z-[9999] lg:hidden pt-2 pb-8 px-5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              {/* Drag Handle */}
              <div className="w-12 h-1.5 bg-neutral-700 rounded-full mx-auto mb-6" />
              
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-white">Szybkie Akcje</h3>
                <button onClick={() => setIsOpen(false)} className="p-2 text-neutral-500 hover:text-white bg-neutral-800/50 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {actions.map(action => (
                  <button
                    key={action.id}
                    onClick={() => handleNavigate(action.path)}
                    className="flex items-center justify-between p-4 bg-neutral-800/50 hover:bg-neutral-800 rounded-2xl transition-colors cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                        <action.icon size={24} />
                      </div>
                      <span className="text-white font-medium text-base">{action.title}</span>
                    </div>
                    <ArrowRight size={20} className="text-neutral-600" />
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
