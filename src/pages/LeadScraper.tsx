import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { 
  Globe, 
  Search, 
  Sparkles, 
  Trash2, 
  Check, 
  Copy, 
  ExternalLink, 
  ChevronRight, 
  X, 
  Mail, 
  Flame, 
  Briefcase, 
  FileText,
  RotateCcw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface ResearchedLead {
  id: string;
  userId: string;
  companyUrl: string;
  companyName: string;
  inputCompanyName?: string;
  industry: string;
  yourOffer: string;
  customInstructions?: string;
  leadPriority: string;
  perceivedPain: string;
  strategicIcebreaker: string;
  valuePitchHtml: string;
  followUpAngle: string;
  companyDescription: string;
  createdAt: string;
}

export function LeadScraper() {
  const [leads, setLeads] = useState<ResearchedLead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState<ResearchedLead | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Form states
  const [companyUrl, setCompanyUrl] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('url') || '');
  const [companyName, setCompanyName] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('name') || '');
  const [industry, setIndustry] = useState(() => new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('industry') || '');
  const [yourOffer, setYourOffer] = useState(
    'Wdrożenie zaawansowanych automatyzacji procesów AI, budowa spersonalizowanych agentów wirtualnych dla działów wsparcia/CRM oraz system automatycznych follow-upów zwiększających konwersję o 40%.'
  );
  const [customInstructions, setCustomInstructions] = useState('');

  const loadingSteps = [
    'Inicjalizacja połączenia oraz detekcja nagłówków serwera...',
    'Wysyłanie Agentów Zwiadowczych w celu przeanalizowania URL przez Google Search...',
    'Klimatyzowanie bazy pod analizę strukturalną oferty firmy...',
    'Uruchamianie silnika Gemini 3.5-flash do syntezy przewagi konkurencyjnej...',
    'Generowanie emocjonalnego "The Hook" oraz bolesnego "The Pain Point"...',
    'Zapisywanie spersonalizowanego profilu leada w bazie Firebase...'
  ];

  const fetchLeads = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;
      const res = await fetch(`/api/researched-leads?userId=${userId}`);
      if (!res.ok) throw new Error('Nie udało się pobrać leadów.');
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      console.error(err);
      toast.error('Błąd podczas ładowania listy przeanalizowanych leadów');
    }
  };

  useEffect(() => {
    let active = true;
    const runFetch = async () => {
      await Promise.resolve();
      if (active) {
        fetchLeads();
      }
    };
    runFetch();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading, loadingSteps.length]);

  const handleCreateResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyUrl) {
      toast.error('Adres URL firmy jest wymagany!');
      return;
    }

    setLoadingStep(0);
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      const response = await fetch('/api/research-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyUrl,
          companyName,
          industry,
          yourOffer,
          customInstructions,
          userId,
        }),
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Błąd podczas analizy leada.');
      }

      toast.success(`Analiza ukończona pomyślnie dla ${resData.lead.companyName || companyUrl}!`);
      
      // Reset form fields
      setCompanyUrl('');
      setCompanyName('');
      setIndustry('');
      setCustomInstructions('');
      
      // Refresh list
      await fetchLeads();
      
      // Auto select the newly created lead
      if (resData.lead) {
        setSelectedLead(resData.lead);
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd serwera.';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Czy na pewno chcesz usunąć ten przeanalizowany profil leada?')) return;

    try {
      const response = await fetch('/api/researched-leads/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadId }),
      });

      if (!response.ok) throw new Error('Błąd usuwania.');

      toast.success('Lead został usunięty.');
      setLeads((prev) => prev.filter((l) => l.id !== leadId));
      if (selectedLead?.id === leadId) {
        setSelectedLead(null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Nie udało się usunąć leada z bazy danych');
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Skopiowano ${fieldName}!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const filteredLeads = leads.filter((lead) => {
    const query = searchQuery.toLowerCase();
    const matchQuery =
      lead.companyName.toLowerCase().includes(query) ||
      lead.companyUrl.toLowerCase().includes(query) ||
      lead.industry.toLowerCase().includes(query) ||
      lead.perceivedPain.toLowerCase().includes(query);

    if (priorityFilter === 'All') return matchQuery;
    return matchQuery && lead.leadPriority.toLowerCase() === priorityFilter.toLowerCase();
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Krytyczny':
        return 'bg-red-500/15 text-red-400 border-red-500/30';
      case 'Wysoki':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'Średni':
      default:
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-8" id="lead-scraper-root">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1 px-2.5 rounded bg-rose-500/10 text-rose-500 text-xs font-mono font-medium border border-rose-500/20 uppercase tracking-widest">
              PRO MODULE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Skaner Leadów Value-First <Sparkles className="text-rose-400 animate-pulse" />
          </h1>
          <p className="text-neutral-400 mt-1 max-w-3xl">
            Innowacyjny system crawleringowy oparty na Google Search i modelach AI. Podaj adres URL, a inteligencja wyciągnie z profilu klienta jego realne słabości i sformułuje zabójczą ofertę emocjonalną.
          </p>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 rounded-full border-t-4 border-rose-600 animate-spin flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(225,29,72,0.4)]">
            <Globe className="text-rose-400 animate-pulse" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-wide font-sans mb-3 text-center">
            PROWADZENIE GŁĘBOKIEJ ANALIZY LEAD INTEGRATOR...
          </h2>
          <p className="text-rose-400 font-mono text-sm max-w-xl animate-pulse">
            {loadingSteps[loadingStep]}
          </p>
          <div className="mt-8 text-xs text-neutral-500 max-w-md">
            Wyszukujemy informacje w Google Search, analizujemy landing page firmy i mapujemy idealny Value-Pitch. Proces ten trwa z reguły 10-15 sekund.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Create Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/5 rounded-full blur-3xl" />
            
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="text-rose-500" size={18} /> Inicjuj Skanowanie Firmy
            </h2>

            <form onSubmit={handleCreateResearch} className="space-y-5">
              <div>
                <label className="block text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Adres URL Witryny (Wymagany) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={18} />
                  <input
                    type="url"
                    required
                    placeholder="https://nazwafirmy.pl"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg py-2.5 pl-10 pr-4 text-sm text-neutral-200 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Nazwa firmy lub kontakt (Opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. BrandMaker Sp. z o.o."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg py-2.5 px-4 text-sm text-neutral-200 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Sugerowana Branża (Opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Agencja Reklamowa, E-commerce lekki"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg py-2.5 px-4 text-sm text-neutral-200 outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Twoja Oferta Biznesowa / Propozycja Wartości
                </label>
                <textarea
                  rows={4}
                  value={yourOffer}
                  onChange={(e) => setYourOffer(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg py-2.5 px-4 text-sm text-neutral-200 outline-none transition font-sans leading-relaxed"
                />
                <p className="text-neutral-500 text-[11px] mt-1">
                  Do jakich zalet Twoich technologii lub usług system ma dopasować błędy na przeskanowanej witrynie.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider mb-2">
                  Specjalne instrukcje dla Agenta (Opcjonalnie)
                </label>
                <input
                  type="text"
                  placeholder="np. Skoncentruj się na optymalizacji prędkości mobilnej lub braku konwersji widgetu"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-lg py-2.5 px-4 text-sm text-neutral-200 outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-medium py-3 rounded-lg text-sm transition shadow-[0_0_20px_rgba(225,29,72,0.2)]"
              >
                <Sparkles size={16} />
                Rozpocznij Skanowanie & AI Research
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Results Grid & List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6">
            
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 justify-between border-b border-neutral-800 pb-6 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-rose-400" size={18} /> Wyniki Analiz ({filteredLeads.length})
              </h2>
              
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                  <input
                    type="text"
                    placeholder="Szukaj..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 rounded px-2.5 py-1.5 pl-8 outline-none focus:border-rose-500 w-36 sm:w-48 transition"
                  />
                </div>
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-xs text-neutral-200 rounded px-2.5 py-1.5 outline-none focus:border-rose-500"
                >
                  <option value="All">Wszystkie priorytety</option>
                  <option value="Krytyczny">Krytyczny</option>
                  <option value="Wysoki">Wysoki</option>
                  <option value="Średni">Średni</option>
                </select>
              </div>
            </div>

            {/* List */}
            {filteredLeads.length === 0 ? (
              <div className="py-16 text-center text-neutral-500">
                <Globe size={48} className="mx-auto text-neutral-700 mb-4 animate-pulse" />
                <p className="text-sm">Brak przeskanowanych witryn spełniających kryteria</p>
                <p className="text-xs text-neutral-600 mt-1">Użyj formularza po lewej stronie, aby stworzyć pierwszą głęboką analizę outreach.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[650px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 hover:bg-neutral-900/80 transition cursor-pointer flex items-start gap-4 relative overflow-hidden group"
                  >
                    <div className="mt-1 p-2 bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-rose-400 rounded-lg">
                      <Globe size={18} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                          {lead.companyName}
                        </h3>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${getPriorityColor(lead.leadPriority)}`}>
                          {lead.leadPriority}
                        </span>
                      </div>
                      
                      <p className="text-xs text-neutral-400 font-mono truncate mb-2">
                        {lead.companyUrl}
                      </p>
                      
                      <p className="text-xs text-neutral-400 bg-neutral-950 p-2 rounded border border-neutral-900 border-l border-l-rose-500 line-clamp-2">
                        {lead.perceivedPain}
                      </p>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Briefcase size={12} /> {lead.industry || 'Auto-wykryte'}
                        </span>
                        <span>{new Date(lead.createdAt).toLocaleDateString('pl-PL')}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteLead(lead.id, e)}
                      className="p-1 px-2 rounded hover:bg-red-500/10 hover:text-red-400 text-neutral-600 transition"
                      title="Usuń profil leada"
                    >
                      <Trash2 size={14} />
                    </button>
                    
                    <ChevronRight size={16} className="text-neutral-700 opacity-0 group-hover:opacity-100 transition absolute right-2 top-11" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Slideout Side Drawer */}
      <AnimatePresence>
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setSelectedLead(null)}
            />

            {/* Content panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl bg-neutral-950 border-l border-neutral-800 h-full overflow-y-auto p-6 md:p-8 flex flex-col justify-between"
            >
              <div>
                {/* Header inside slideout */}
                <div className="flex items-center justify-between pb-6 border-b border-neutral-800 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
                      <Globe size={20} />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-tight">
                        {selectedLead.companyName}
                      </h3>
                      <a
                        href={selectedLead.companyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-rose-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        {selectedLead.companyUrl} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Metadata Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Prioriti</span>
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border inline-block ${getPriorityColor(selectedLead.leadPriority)}`}>
                        {selectedLead.leadPriority}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Branża</span>
                      <span className="text-xs text-neutral-200 font-semibold truncate block">
                        {selectedLead.industry || 'Wykryte'}
                      </span>
                    </div>
                    <div className="p-3 bg-neutral-900 border border-neutral-800/80 rounded-xl">
                      <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Data skanowania</span>
                      <span className="text-xs text-neutral-400 block font-mono">
                        {new Date(selectedLead.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  </div>

                  {/* Company Description inferred */}
                  {selectedLead.companyDescription && (
                    <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                      <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
                        <Briefcase size={14} className="text-neutral-500" /> Profil Witryny
                      </span>
                      <p className="text-sm text-neutral-300 leading-relaxed">
                        {selectedLead.companyDescription}
                      </p>
                    </div>
                  )}

                  {/* Perceived Pain Point */}
                  <div className="p-4 bg-red-950/10 border border-red-900/30 rounded-xl space-y-2">
                    <span className="text-xs font-mono uppercase text-red-400 flex items-center gap-1.5">
                      <Flame size={14} className="text-red-500" /> Perceived Pain (Zdiagnozowany Problem)
                    </span>
                    <p className="text-sm text-red-200 leading-relaxed font-semibold">
                      {selectedLead.perceivedPain}
                    </p>
                  </div>

                  {/* Strategic Icebreaker */}
                  <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-mono uppercase text-neutral-400 flex items-center gap-1.5">
                        <Search size={14} className="text-neutral-500" /> Strategic Icebreaker (Łamacz lodu)
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedLead.strategicIcebreaker, 'Lód-łamacz')}
                        className="text-[10px] text-neutral-500 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-900 px-2 py-1 rounded"
                      >
                        {copiedField === 'Lód-łamacz' ? <Check size={10} /> : <Copy size={10} />} Skopiuj
                      </button>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed italic">
                      "{selectedLead.strategicIcebreaker}"
                    </p>
                  </div>

                  {/* Value Outreach Email HTML preview */}
                  <div className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30">
                    <div className="p-3 bg-neutral-900 border-b border-neutral-850 flex justify-between items-center px-4">
                      <span className="text-xs font-mono uppercase text-neutral-200 flex items-center gap-1.5">
                        <Mail size={14} className="text-rose-500" /> Value-First Message Template (Outreach)
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => copyToClipboard(selectedLead.valuePitchHtml, 'Wiadomość HTML')}
                          className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1 border border-neutral-800 bg-neutral-950 px-2 py-1 rounded"
                        >
                          {copiedField === 'Wiadomość HTML' ? <Check size={10} /> : <Copy size={10} />} Kopiuj Kod HTML
                        </button>
                      </div>
                    </div>
                    <div className="p-5 font-sans text-sm text-neutral-300 space-y-3 bg-neutral-950/80 max-h-[300px] overflow-y-auto">
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedLead.valuePitchHtml }} 
                        className="prose prose-sm prose-invert"
                      />
                    </div>
                  </div>

                  {/* Follow Up Angle */}
                  <div className="p-4 bg-rose-950/10 border border-rose-900/20 rounded-xl space-y-2">
                    <span className="text-xs font-mono uppercase text-rose-300 flex items-center gap-1.5">
                      <RotateCcw size={14} className="text-rose-500" /> Follow-Up Angle (Krok w sekwencji)
                    </span>
                    <p className="text-sm text-neutral-300 leading-relaxed font-sans">
                      {selectedLead.followUpAngle}
                    </p>
                  </div>

                  {/* Offer sync */}
                  <div className="p-3 bg-neutral-950 rounded-lg text-[11px] text-neutral-500 border border-neutral-900">
                    <span className="font-semibold text-neutral-400 block mb-1">Dopasowana Oferta Własna:</span>
                    <p className="italic line-clamp-2">"{selectedLead.yourOffer}"</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-neutral-850 pt-4 flex items-center justify-end">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="bg-neutral-900 text-neutral-300 hover:text-white px-5 py-2.5 rounded-lg border border-neutral-850 text-sm font-semibold transition"
                >
                  Zamknij portal leada
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
