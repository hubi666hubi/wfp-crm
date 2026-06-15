import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { initAuth, googleSignIn, signInAsDemoUser } from './lib/auth';
import { AppLayout } from './components/layout/AppLayout';
import { startAgentBrokerListener } from './services/AgentBroker';

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const SocialMedia = lazy(() => import('./pages/SocialMedia').then(m => ({ default: m.SocialMedia })));
const Distributor = lazy(() => import('./pages/Distributor').then(m => ({ default: m.Distributor })));
const VslGenerator = lazy(() => import('./pages/VslGenerator').then(m => ({ default: m.VslGenerator })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Scouts = lazy(() => import('./pages/Scouts').then(m => ({ default: m.Scouts })));
const Podcast = lazy(() => import('./pages/Podcast').then(m => ({ default: m.Podcast })));
const Tachometer = lazy(() => import('./pages/Tachometer').then(m => ({ default: m.Tachometer })));
const Zapalnik = lazy(() => import('./pages/Zapalnik').then(m => ({ default: m.Zapalnik })));
const GmailIntegration = lazy(() => import('./pages/GmailIntegration').then(m => ({ default: m.GmailIntegration })));
const GoogleChatPage = lazy(() => import('./pages/GoogleChatPage').then(m => ({ default: m.GoogleChatPage })));
const GoogleTasksPage = lazy(() => import('./pages/GoogleTasksPage').then(m => ({ default: m.GoogleTasksPage })));
const GoogleKeepPage = lazy(() => import('./pages/GoogleKeepPage').then(m => ({ default: m.GoogleKeepPage })));
const GoogleCalendarPage = lazy(() => import('./pages/GoogleCalendarPage').then(m => ({ default: m.GoogleCalendarPage })));
const Closer = lazy(() => import('./pages/Closer').then(m => ({ default: m.Closer })));
const DopamineLoops = lazy(() => import('./pages/DopamineLoops').then(m => ({ default: m.DopamineLoops })));
const AutomationHub = lazy(() => import('./pages/AutomationHub').then(m => ({ default: m.AutomationHub })));
const LeadScraper = lazy(() => import('./pages/LeadScraper').then(m => ({ default: m.LeadScraper })));
const FacebookLeads = lazy(() => import('./pages/FacebookLeads').then(m => ({ default: m.FacebookLeads })));
const ZPulse = lazy(() => import('./pages/ZPulse').then(m => ({ default: m.ZPulse })));
const ProDashboard = lazy(() => import('./pages/ProDashboard').then(m => ({ default: m.ProDashboard })));
const ShieldPage = lazy(() => import('./pages/Shield').then(m => ({ default: m.ShieldPage })));
const PricingPage = lazy(() => import('./pages/Pricing').then(m => ({ default: m.PricingPage })));
const ProGenerators = lazy(() => import('./pages/ProGenerators').then(m => ({ default: m.ProGenerators })));
const FactoryRegistry = lazy(() => import('./pages/FactoryRegistry').then(m => ({ default: m.FactoryRegistry })));

function PlaceholderModule({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 rounded-full border border-rose-500/30 flex items-center justify-center mb-6">
        <div className="w-2 h-2 bg-rose-500 rounded-full animate-ping" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
      <p className="text-neutral-400">Moduł w trakcie inicjalizacji / synchronizacji bazy danych...</p>
    </div>
  );
}

import { toast } from 'sonner';
import { Bot } from 'lucide-react';

function App() {
  const [dbStatus, setDbStatus] = useState<string>('Connecting...');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        setDbStatus('Connected');
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          setDbStatus('Offline');
        } else {
           setDbStatus('Connected');
        }
      }
    };
    testConnection();

    const unsubscribe = initAuth(
      (currentUser) => {
        setUser(currentUser);
        setLoading(false);
      },
      () => {
        setUser(null);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Persistent background listener for completed Factory documents triggering AgentBroker listings
  useEffect(() => {
    const uid = user?.uid || "demo_tycoon_user";
    const unsubscribe = startAgentBrokerListener(uid, () => {
      console.log("[AgentBroker System Loop] Completed factory successfully priced & listed.");
    });
    return () => unsubscribe();
  }, [user]);

  const login = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        toast.success("Autoryzacja zakończona sukcesem");
      }
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')) {
        console.log("Logowanie anulowane przez użytkownika.");
        toast.info("Logowanie anulowane przez użytkownika");
      } else {
        console.error("Login failed", error);
        toast.error("Błąd podczas logowania. Wypróbuj Tryb Piaskownicy poniżej.");
      }
    }
  };

  const loginAsDemo = async () => {
    try {
      const result = await signInAsDemoUser();
      setUser(result.user);
      toast.success("Zalogowano pomyślnie w trybie piaskownicy Tycoon!");
    } catch (error) {
      console.error("Demo login failed", error);
      toast.error("Błąd podczas uruchamiania trybu piaskownicy");
    }
  };

  if (loading) {
    return (
       <div className="min-h-screen bg-black flex items-center justify-center">
         <div 
           className="text-rose-500 animate-pulse font-mono tracking-widest text-lg"
           onAnimationIteration={() => console.log('Cykl animacji inicjalizacji systemu zakończony')}
         >
            INICJALIZACJA SYSTEMU OMEGA...
         </div>
       </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-black to-black" />
        <div className="relative z-10 w-full max-w-md p-8 border border-neutral-800 bg-neutral-950/80 backdrop-blur-md rounded-2xl text-center">
           <div className="w-16 h-16 bg-rose-600 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_30px_rgba(225,29,72,0.6)] mx-auto mb-6 text-2xl">
              Ω
           </div>
           <h1 className="text-xl font-bold tracking-widest text-white mb-2 flex items-center justify-center gap-2">
             W.F.P. <Bot size={24} className="text-rose-400" />
           </h1>
           <p className="text-neutral-500 text-sm mb-8 font-mono">AUTORYZACJA WYMAGANA DO UZYSKANIA DOSTĘPU DO MODUŁÓW</p>
           
           <button 
             onClick={login} 
             className="w-full px-4 py-3 bg-white text-black text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
           >
             <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
             Inicjuj Autoryzację Google z Gmail
           </button>

           <div className="relative my-6 flex items-center justify-center">
             <div className="absolute inset-0 flex items-center">
               <span className="w-full border-t border-neutral-800" />
             </div>
             <span className="relative z-10 px-3 bg-neutral-950 text-[10px] uppercase font-mono text-neutral-500 tracking-widest">Lub tryb piaskownicy</span>
           </div>

           <button 
             onClick={loginAsDemo} 
             className="w-full px-4 py-3 border border-dashed border-rose-500 hover:border-rose-400 hover:bg-rose-500/10 text-rose-400 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
           >
             <Bot size={16} />
             Uruchom Tycoon Sandbox (Bypass Popups)
           </button>
           
           <p className="mt-4 text-[10px] text-neutral-500 font-mono leading-relaxed px-2">
             * Jeśli logowanie Google nie działa (np. zablokowane wyskakujące okienka w ramce podglądu), użyj przycisku Bypass Popups lub otwórz aplikację w Nowej Karcie.
           </p>
           
           {dbStatus === 'Offline' && (
             <p className="mt-6 text-xs text-red-500 font-mono">WARNING: Baza wektorowa (Firebase) offline.</p>
           )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout user={user}>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
           <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center font-bold text-white shadow-[0_0_20px_rgba(225,29,72,0.5)] animate-pulse">
             Ω
           </div>
           <span className="text-neutral-500 font-mono text-xs tracking-[0.2em] uppercase animate-pulse">Ładowanie modułu OMEGA...</span>
        </div>
      }>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/social-media" element={<SocialMedia />} />
          <Route path="/distributor" element={<Distributor />} />
          <Route path="/scouts" element={<Scouts />} />
          <Route path="/podcast" element={<Podcast />} />
          <Route path="/tachometer" element={<Tachometer />} />
          <Route path="/crm" element={<Zapalnik />} />
          <Route path="/shield" element={<ShieldPage />} />
          <Route path="/vsl-generator" element={<VslGenerator />} />
          <Route path="/automation" element={<AutomationHub />} />
          <Route path="/gmail" element={<GmailIntegration />} />
          <Route path="/chat" element={<GoogleChatPage />} />
          <Route path="/tasks" element={<GoogleTasksPage />} />
          <Route path="/keep" element={<GoogleKeepPage />} />
          <Route path="/calendar" element={<GoogleCalendarPage />} />
          <Route path="/dopamine-loops" element={<DopamineLoops />} />
          <Route path="/z-pulse" element={<ZPulse />} />
          <Route path="/pro-dashboard" element={<ProDashboard />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/closer" element={<Closer />} />
          <Route path="/scraper" element={<LeadScraper />} />
          <Route path="/facebook-leads" element={<FacebookLeads />} />
          <Route path="/pro-generators" element={<ProGenerators />} />
          <Route path="/factory-registry" element={<FactoryRegistry />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
}

export default App;
