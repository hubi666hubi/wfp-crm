import { useState } from "react";

import { ShoppingCart, Flame, TrendingUp, Link as LinkIcon, DollarSign, Activity, BarChart3, Package, Users, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';

// Zmockowane dane telemetryczne
const revenueData = [
  { day: 'Pon', mrr: 1200, sales: 850 },
  { day: 'Wto', mrr: 1250, sales: 1100 },
  { day: 'Śro', mrr: 1300, sales: 950 },
  { day: 'Czw', mrr: 1450, sales: 1400 },
  { day: 'Pią', mrr: 1550, sales: 1800 },
  { day: 'Sob', mrr: 1700, sales: 2100 },
  { day: 'Nie', mrr: 1950, sales: 2500 }
];

const products = [
  { id: '1', name: 'Zapalnik PRO - Licencja', price: '499 PLN', sales: 124, status: 'active', conversion: '12.4%' },
  { id: '2', name: 'Skrypty VSL (Bundle)', price: '99 PLN', sales: 450, status: 'active', conversion: '8.1%' },
  { id: '3', name: 'Konsultacja OMEGA', price: '1500 PLN', sales: 12, status: 'limited', conversion: '3.2%' }
];

export function GumroadMonetization() {

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      toast.success("Połączenie z Gumroad nawiązane. Strumień danych aktywny.");
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-10">
      {/* Nagłówek */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-3">
            <ShoppingCart className="text-rose-500" size={32} />
            MONETYZACJA GUMROAD
            <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-1 rounded font-mono uppercase tracking-widest border border-rose-500/30">
              PRO_MODULE V3
            </span>
          </h1>
          <p className="text-neutral-400 mt-2 font-mono text-sm">
            Zautomatyzowane strumienie przychodów i telemetria sprzedaży cyfrowej.
          </p>
        </div>

        <div className="flex gap-3">
            <button
                onClick={handleSync}
                disabled={isSyncing}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-xl text-sm font-bold border border-neutral-800 transition-all flex items-center gap-2 font-mono uppercase"
            >
                {isSyncing ? <RefreshCw className="animate-spin text-rose-500" size={16} /> : <LinkIcon className="text-rose-500" size={16} />}
                Sync API
            </button>
            <button className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-black tracking-wider transition-all shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center gap-2 font-mono uppercase">
                <Flame size={16} />
                Nowy Produkt
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign size={64} className="text-rose-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Dzisiejszy Przychód</p>
            <h3 className="text-3xl font-black text-white font-mono">2,500 <span className="text-sm text-neutral-500">PLN</span></h3>
            <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs font-mono">
              <TrendingUp size={12} />
              <span>+18.2% od wczoraj</span>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity size={64} className="text-rose-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Aktywny MRR (Subskrypcje)</p>
            <h3 className="text-3xl font-black text-rose-500 font-mono">14,200 <span className="text-sm text-rose-900">PLN</span></h3>
            <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs font-mono">
              <TrendingUp size={12} />
              <span>+5.4% m/m</span>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users size={64} className="text-amber-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Klienci Aktywni</p>
            <h3 className="text-3xl font-black text-white font-mono">586</h3>
            <div className="mt-2 flex items-center gap-1 text-amber-400 text-xs font-mono">
              <Activity size={12} />
              <span>Stabilny wzrost</span>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <BarChart3 size={64} className="text-emerald-500" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Śr. Konwersja (Checkout)</p>
            <h3 className="text-3xl font-black text-white font-mono">8.4<span className="text-sm text-neutral-500">%</span></h3>
            <div className="mt-2 flex items-center gap-1 text-emerald-400 text-xs font-mono">
              <TrendingUp size={12} />
              <span>+1.2% po optymalizacji</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Wykres - Velocity */}
        <div className="lg:col-span-2 bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Activity size={16} className="text-rose-500" />
                Velocity Przychodów (7 Dni)
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-1">Stosunek MRR do sprzedaży jednorazowej</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px', fontFamily: 'monospace' }}
                  labelStyle={{ color: '#737373', fontSize: '10px', textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="sales" name="Sprzedaż Jednorazowa" stroke="#e11d48" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="mrr" name="MRR (Wzrost)" stroke="#34d399" strokeWidth={2} fillOpacity={1} fill="url(#colorMrr)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Zarządzanie Produktami */}
        <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Package size={16} className="text-rose-500" />
              Aktywne Produkty
            </h2>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
            {products.map((product) => (
              <div key={product.id} className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-sm font-bold text-white">{product.name}</h3>
                    <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded">
                        {product.status === 'active' ? 'AKTYWNY' : 'LIMIT'}
                    </span>
                </div>
                <div className="flex justify-between items-end mt-4">
                    <div>
                        <p className="text-[10px] text-neutral-500 font-mono uppercase">Cena</p>
                        <p className="text-sm font-mono text-emerald-400 font-bold">{product.price}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-neutral-500 font-mono uppercase">Sprzedano</p>
                        <p className="text-sm font-mono text-white font-bold">{product.sales} <span className="text-neutral-500 text-xs">szt.</span></p>
                    </div>
                </div>
                <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between items-center">
                    <span className="text-[10px] text-neutral-500 font-mono">Konwersja na str.</span>
                    <span className="text-xs font-mono font-bold text-rose-400">{product.conversion}</span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-xl text-xs font-bold text-white font-mono uppercase transition-colors">
            Zarządzaj w Gumroad ↗
          </button>
        </div>
      </div>

      {/* Konfiguracja API */}
      <div className="bg-neutral-950 border border-neutral-900 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <LinkIcon size={16} className="text-rose-500" />
            Konfiguracja Webhooków (Live Ping)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Gumroad Personal Access Token</label>
                <input
                    type="password"
                    value="sk_live_1234567890abcdef1234567890abcdef"
                    disabled
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-400 font-mono opacity-70"
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Ping Webhook URL (do wklejenia w Gumroad)</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value="https://api.wfp-omega.pl/v1/webhooks/gumroad"
                        readOnly
                        className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono"
                    />
                    <button
                        onClick={() => toast.success("Skopiowano do schowka")}
                        className="bg-neutral-800 hover:bg-neutral-700 px-4 rounded-xl text-white font-bold transition-colors"
                    >
                        Kopiuj
                    </button>
                </div>
            </div>
        </div>
        <p className="text-xs text-neutral-500 mt-4 font-sans">
            Wklej powyższy URL w zakładce Advanced {'>'} Ping w panelu Gumroad, aby aktywować natychmiastowe spływanie transakcji do Zapalnika.
        </p>
      </div>
    </div>
  );
}
