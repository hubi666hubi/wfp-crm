import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Offer {
  offer: string;
  cvr: string;
  win: boolean;
}

export interface Metric {
  label: string;
  val: string;
  trend: string;
  color: string;
}

interface TachometerState {
  offers: Offer[];
  metrics: Metric[];
  setOffers: (offers: Offer[]) => void;
  setMetrics: (metrics: Metric[]) => void;
  updateMetric: (label: string, value: string, trend: string) => void;
}

export const useTachometerStore = create<TachometerState>()(
  persist(
    (set) => ({
      offers: [
        { offer: '[Oferta A] Kwantowy VSL + Bonus', cvr: '5.8%', win: true },
        { offer: '[Oferta B] Standardowy Checkout', cvr: '1.2%', win: false },
        { offer: '[Oferta C] Pętla 7-dniowa Email', cvr: '7.4%', win: true },
        { offer: '[Oferta D] Webinar Na Żywo', cvr: '3.1%', win: false },
      ],
      metrics: [
        { label: 'Współczynnik Konwersji VSL', val: '4.2%', trend: '+0.8%', color: 'text-emerald-500' },
        { label: 'Odrzucenia Lejków (Churn)', val: '12.5%', trend: '-2.1%', color: 'text-rose-500' },
        { label: 'Pojemność Pętli Dopaminowej', val: '86h', trend: '+14h', color: 'text-yellow-500' },
        { label: 'Testy A/B Aktywne', val: '14', trend: 'Stabilnie', color: 'text-blue-500' },
      ],
      setOffers: (offers) => set({ offers }),
      setMetrics: (metrics) => set({ metrics }),
      updateMetric: (label, val, trend) => set((state) => ({
        metrics: state.metrics.map(m => m.label === label ? { ...m, val, trend } : m)
      }))
    }),
    { name: "tachometer-store" }
  )
);
