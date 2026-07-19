import { useState, useEffect } from 'react';
import { LeadAnalytics } from './components/LeadAnalytics';
import { EdgeAgentChat } from './components/EdgeAgentChat';
import { RAGStatus } from './components/RAGStatus';

function App() {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Add dark mode by default for the matrix vibe
    document.documentElement.classList.add('dark');
    
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f14] text-[#00ff00] font-mono selection:bg-[#00ff00] selection:text-black overflow-hidden relative">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none" 
           style={{ 
             backgroundImage: 'linear-gradient(rgba(0, 255, 0, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 0, 0.1) 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }} 
      />
      
      {/* Header */}
      <header className="relative z-10 glass border-b border-[#00ff00]/20 px-6 py-4 flex justify-between items-center shadow-[0_0_15px_rgba(0,255,0,0.1)]">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-[#00ff00] rounded-full animate-pulse shadow-[0_0_10px_#00ff00]" />
          <h1 className="text-xl font-bold tracking-widest uppercase">OMEGA Command Center</h1>
          <span className="text-xs ml-4 px-2 py-1 bg-[#00ff00]/10 border border-[#00ff00]/30 rounded">SYSTEM_ACTIVE</span>
        </div>
        <div className="text-sm tracking-wider font-mono">
          [ {currentTime} ]
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="relative z-10 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-73px)]">
        
        {/* Left Column: Data & Analytics */}
        <div className="lg:col-span-8 flex flex-col gap-6 h-full">
          <section className="glass rounded-lg border border-[#00ff00]/20 p-5 shadow-lg flex-1">
             <h2 className="text-sm uppercase tracking-widest text-[#00ff00]/70 mb-4 border-b border-[#00ff00]/20 pb-2">Challenger Sale Analytics</h2>
             <LeadAnalytics />
          </section>
          
          <section className="glass rounded-lg border border-[#00ff00]/20 p-5 shadow-lg h-64">
             <h2 className="text-sm uppercase tracking-widest text-[#00ff00]/70 mb-4 border-b border-[#00ff00]/20 pb-2">Supabase RAG Status</h2>
             <RAGStatus />
          </section>
        </div>

        {/* Right Column: Edge AI Agent */}
        <div className="lg:col-span-4 h-full">
          <section className="glass rounded-lg border border-[#00ff00]/20 shadow-lg h-full flex flex-col">
             <div className="p-4 border-b border-[#00ff00]/20 bg-[#00ff00]/5 flex justify-between items-center">
                <h2 className="text-sm uppercase tracking-widest text-[#00ff00]">Edge AI Chat</h2>
                <div className="w-2 h-2 bg-[#00ff00] rounded-full animate-ping" />
             </div>
             <div className="flex-1 overflow-hidden">
               <EdgeAgentChat />
             </div>
          </section>
        </div>

      </main>
    </div>
  );
}

export default App;
