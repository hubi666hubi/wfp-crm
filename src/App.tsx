import { useEffect, useState, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { db } from './lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { initAuth, googleSignIn, signInAsDemoUser } from './lib/auth';
import { AppLayout } from './components/layout/AppLayout';
import MatrixRain from './components/layout/MatrixRain';
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
const EliteVault = lazy(() => import('./pages/EliteVault'));
const PricingPage = lazy(() => import('./pages/Pricing').then(m => ({ default: m.PricingPage })));
const ProGenerators = lazy(() => import('./pages/ProGenerators').then(m => ({ default: m.ProGenerators })));
const FactoryRegistry = lazy(() => import('./pages/FactoryRegistry').then(m => ({ default: m.FactoryRegistry })));

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = initAuth((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const brokerCleanup = startAgentBrokerListener();
      return () => brokerCleanup();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-mono text-emerald-500">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="animate-pulse tracking-widest text-xs uppercase">Initializing Omega Central...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900/50 border border-neutral-800 p-8 rounded-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-white">WFP OMEGA CENTRAL</h1>
            <p className="text-neutral-400 text-sm italic">Panel Operatorski Automatyzacji i Skalowania</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => googleSignIn()}
              className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
            >
              Kontynuuj z Google
            </button>
            <button
              onClick={() => signInAsDemoUser()}
              className="w-full py-3 bg-neutral-800 text-white font-bold rounded-xl hover:bg-neutral-700 transition-all"
            >
              Zaloguj jako Gość (Demo)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MatrixRain />
      <div className="crt-overlay" />
      <AppLayout user={user}>
        <Suspense fallback={
          <div className="p-8 flex justify-center">
            <div className="text-emerald-500 font-mono animate-pulse">Ładowanie modułu...</div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/social" element={<SocialMedia />} />
            <Route path="/distributor" element={<Distributor />} />
            <Route path="/vsl" element={<VslGenerator />} />
            <Route path="/scouts" element={<Scouts />} />
            <Route path="/podcast" element={<Podcast />} />
            <Route path="/tachometer" element={<Tachometer />} />
            <Route path="/zapalnik" element={<Zapalnik />} />
            <Route path="/gmail" element={<GmailIntegration />} />
            <Route path="/chat" element={<GoogleChatPage />} />
            <Route path="/tasks" element={<GoogleTasksPage />} />
            <Route path="/keep" element={<GoogleKeepPage />} />
            <Route path="/calendar" element={<GoogleCalendarPage />} />
            <Route path="/dopamine-loops" element={<DopamineLoops />} />
            <Route path="/z-pulse" element={<ZPulse />} />
            <Route path="/pro-dashboard" element={<ProDashboard />} />
            <Route path="/elite-vault" element={<EliteVault />} />
            <Route path="/automation-hub" element={<AutomationHub />} />
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
    </>
  );
}

export default App;
