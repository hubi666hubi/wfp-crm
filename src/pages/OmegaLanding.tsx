import React, { useEffect } from 'react';
import { Bot } from 'lucide-react';

interface OmegaLandingProps {
  onLogin: () => void;
  onDemo: () => void;
  dbStatus: string;
}

export function OmegaLanding({ onLogin, onDemo, dbStatus }: OmegaLandingProps) {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.animation = `slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
        }
      });
    });

    document.querySelectorAll('.feature-card').forEach((card, index) => {
      (card as HTMLElement).style.opacity = '0';
      (card as HTMLElement).style.animationDelay = `${index * 0.15}s`;
      observer.observe(card);
    });
    
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(138,43,226,0.4)_0%,transparent_60%)] -z-10 blur-[80px] animate-pulse" />

      {/* Navigation */}
      <nav className="flex justify-between items-center p-8 backdrop-blur-md border-b border-white/10 fixed w-full top-0 z-50">
        <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white to-[#8A2BE2] bg-clip-text text-transparent">
          OMEGA
        </div>
        <div className="hidden md:flex gap-8 font-semibold text-neutral-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#auth" className="hover:text-white transition-colors">Access Console</a>
        </div>
        <button onClick={onLogin} className="bg-gradient-to-br from-[#8A2BE2] to-[#4A00E0] text-white px-6 py-2 rounded-full font-bold shadow-[0_4px_15px_rgba(138,43,226,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_25px_rgba(138,43,226,0.5)] transition-all">
          Initialize API
        </button>
      </nav>

      {/* Hero */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-4 mt-16">
        <div className="bg-white/5 border border-white/10 px-5 py-2 rounded-full text-[#8A2BE2] text-sm font-semibold mb-8 backdrop-blur-md animate-[slideUp_0.8s_cubic-bezier(0.16,1,0.3,1)]">
          ✨ RAG-Powered Sales Copilot
        </div>
        <h1 className="text-5xl md:text-7xl font-black leading-tight mb-6 max-w-4xl animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.1s_backwards]">
          Enable God Mode for <br />
          <span className="bg-gradient-to-r from-[#8A2BE2] to-[#00d2ff] bg-clip-text text-transparent">B2B Outbound</span>
        </h1>
        <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mb-12 animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.2s_backwards]">
          The autonomous monetization engine that scrapes, qualifies, and closes leads using advanced Vector Search and Agentic AI. Stop clicking. Start earning.
        </p>
        
        <div id="auth" className="w-full max-w-md p-8 border border-white/10 bg-black/50 backdrop-blur-xl rounded-3xl animate-[slideUp_1s_cubic-bezier(0.16,1,0.3,1)_0.3s_backwards]">
          <h2 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
            W.F.P. <Bot className="text-[#8A2BE2]" />
          </h2>
          <button 
            onClick={onLogin}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 mb-4"
          >
             <svg width="24" height="24" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Access with Google
          </button>
          
          <div className="relative my-6 text-center">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
             <span className="relative px-4 bg-black text-xs font-mono text-neutral-500">OR</span>
          </div>

          <button 
            onClick={onDemo}
            className="w-full py-4 border border-dashed border-[#8A2BE2] text-[#8A2BE2] hover:bg-[#8A2BE2]/10 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Bot size={20} /> Try Sandbox (Bypass)
          </button>

          {dbStatus === 'Offline' && (
            <p className="mt-4 text-xs text-red-500 font-mono text-center">WARNING: Firebase Vector DB is offline.</p>
          )}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-4 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="feature-card bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:-translate-y-2 hover:bg-white/10 hover:border-[#8A2BE2]/40 transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(138,43,226,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl mb-6">🔍</div>
            <h3 className="text-2xl font-bold mb-4 font-sans">Data Ingestion</h3>
            <p className="text-neutral-400">Custom Python modules autonomously extract and pre-qualify high-value leads across the web. Say goodbye to manual research.</p>
          </div>
          <div className="feature-card bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:-translate-y-2 hover:bg-white/10 hover:border-[#8A2BE2]/40 transition-all relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(138,43,226,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl mb-6">🧠</div>
            <h3 className="text-2xl font-bold mb-4 font-sans">RAG Vector Search</h3>
            <p className="text-neutral-400">Powered by Supabase pgvector. The system achieves a flawless understanding of your business context and customer pain points.</p>
          </div>
          <div className="feature-card bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-md hover:-translate-y-2 hover:bg-white/10 hover:border-[#8A2BE2]/40 transition-all relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(138,43,226,0.1),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="text-4xl mb-6">⚡</div>
            <h3 className="text-2xl font-bold mb-4 font-sans">Autonomous Agent</h3>
            <p className="text-neutral-400">A relentless Node.js daemon that crafts hyper-personalized outreach and negotiates at scale. It doesn't sleep, it sells.</p>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
