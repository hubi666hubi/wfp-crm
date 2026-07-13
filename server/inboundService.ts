import { GoogleGenAI } from "@google/genai";
import { getDb } from "./db";
import { initializeApp, getApps, getApp } from 'firebase/app';
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listLeads, upsertLead, getLead } from '@zapalnik/crm-dataconnect';
import crypto from 'crypto';

const clientApp = getApps().length === 0 
  ? initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID || 'zapalnik-crm' })
  : getApp();

const dc = getDataConnect(clientApp, connectorConfig);
if (process.env.NODE_ENV !== 'production') {
  try {
    connectDataConnectEmulator(dc, '127.0.0.1', 9399);
  } catch (err) {
    // Suppress emulator errors if already connected
  }
}


const logVerbose = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

async function generateInboundContentWithFallback(ai: GoogleGenAI, params: any) {
  try {
    params.model = "gemini-3.5-flash";
    return await ai.models.generateContent(params);
  } catch (err1: any) {
    logVerbose(`[Inbound Fallback] gemini-3.5-flash failed, trying gemini-3.1-flash-lite. Error: ${err1?.message || err1}`);
    try {
      params.model = "gemini-3.1-flash-lite";
      return await ai.models.generateContent(params);
    } catch (err2: any) {
      logVerbose(`[Inbound Fallback] gemini-3.1-flash-lite failed, trying gemini-2.5-flash. Error: ${err2?.message || err2}`);
      try {
        params.model = "gemini-2.5-flash";
        return await ai.models.generateContent(params);
      } catch (err3: any) {
        logVerbose(`[Inbound Fallback] gemini-2.5-flash failed, trying gemini-1.5-flash. Error: ${err3?.message || err3}`);
        try {
          params.model = "gemini-1.5-flash";
          return await ai.models.generateContent(params);
        } catch (err4) {
          throw err1; // Throw original error to trigger local route-specific fallback values
        }
      }
    }
  }
}

export interface AIEnrichment {
  icebreakers: string[];
  budgetPotential: 'niski' | 'średni' | 'wysoki' | string;
  objections: { objection: string; riposte: string }[];
}

export interface DMStep {
  step: number;
  delay: string;
  label: string;
  text: string;
}

export interface ChatMessage {
  sender: 'seller' | 'lead';
  text: string;
  timestamp: string;
  coachScore?: number;
  coachFeedback?: string;
}

export interface PitchCardData {
  companyName: string;
  leadName: string;
  industryChallenges: string[];
  proposedSolutions: string[];
  estimatedRoi: {
    timeSavedHours: string;
    costReductionPct: string;
    paybackMonths: string;
    financialGain: string;
  };
  timeline: {
    milestone: string;
    duration: string;
    description: string;
  }[];
  htmlEmailTemplate: string;
}

export interface TacticalBriefData {
  missionObjective: string;
  vulnerabilityAssessment: string[];
  meddpiccTable: {
    metrics: string;
    economicBuyer: string;
    decisionCriteria: string;
    decisionProcess: string;
    identifyPain: string;
    champion: string;
  };
  combatObjections: { objection: string; combatshield: string }[];
  opScript: {
    phase1Hook: string;
    phase2Pain: string;
    phase3Proof: string;
    phase4Cta: string;
  };
  readinessRating: number;
}

export interface InboundLead {
  id: string;
  name: string;
  bio: string;
  source: string;
  timestamp: string;
  isHighTicket: boolean;
  score: number;
  draftMessage: string;
  status: string; // 'Inbound (Wtyczka)' | 'Zakwalifikowane' | 'Wysłana wiadomość' | 'Rozmowa w toku' | 'Zamknięte / Sukces'
  aiEnrichment?: AIEnrichment;
  dmSequence?: DMStep[];
  chatHistory?: ChatMessage[];
  pitchCard?: PitchCardData;
  tacticalBrief?: TacticalBriefData;
}

class InboundService {
  public makeWebhook: string = "";
  private inMemoryLeads: InboundLead[] = [];

  constructor() {
    this.inMemoryLeads = [];
  }

  private async saveLeadToDb(lead: InboundLead) {
    try {
      await upsertLead(dc, {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        bio: lead.bio,
        source: lead.source,
        isHighTicket: lead.isHighTicket,
        score: lead.score,
        draftMessage: lead.draftMessage,
        status: lead.status,
        aiEnrichment: lead.aiEnrichment,
        chatHistory: lead.chatHistory,
        dmSequence: lead.dmSequence,
        pitchCard: lead.pitchCard,
        tacticalBrief: lead.tacticalBrief,
      });
    } catch (e) {
      console.warn("[InboundService] Failed to save lead to Data Connect:", e);
    }
  }

  private async seedLeadsIfEmpty() {
    try {
      const { data } = await listLeads(dc, { limit: 1 });
      if (!data || !data.leads || data.leads.length === 0) {
        logVerbose("[InboundService] PostgreSQL database is empty. Seeding default premium leads...");
        const defaultLeads: InboundLead[] = [
          {
            id: "11111111-1111-1111-1111-111111111111",
            name: "Michał Wiśniewski",
            bio: "CEO w ScaleFlow Media. Pomagamy markom e-commerce skalować przychody z reklam FB/IG Ads. Zespół 12 osób, szukamy automatyzacji raportowania i routowania leadów z CRM.",
            source: "LinkedIn",
            timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
            score: 89,
            isHighTicket: true,
            draftMessage: "Cześć Michał!\n\nWidzę, że ScaleFlow Media ma już zespół 12 osób. Skalowanie e-commerce przy ręcznym raportowaniu to wąskie gardło, które potrafi zająć handlowcom ponad 10h tygodniowo.\n\nWdrożyliśmy system Inbound AI Autopilot dla podobnej agencji, co skróciło czas raportowania do zera i podniosło szybkość reakcji na leady do 3 minut. Otwarty na krótki diagram wideo (Loom)?",
            status: "Inbound (Wtyczka)"
          },
          {
            id: "22222222-2222-2222-2222-222222222222",
            name: "Anna Kowalska",
            bio: "Co-founder w SmartSaaS. Budujemy system do rezerwacji online dla branży Beauty. Poszukuję asystenta AI do obsługi zapytań e-mailowych na pierwszym linii wsparcia.",
            source: "LinkedIn",
            timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
            score: 72,
            isHighTicket: true,
            draftMessage: "Cześć Anna!\n\nGratulacje z okazji rozwoju SmartSaaS. Obsługa powtarzalnych zapytań Beauty na pierwszej linii wsparcia to klasyczne wąskie gardło, które pali budżet i czas założycieli.\n\nMamy gotowy moduł Asystenta AI wsparcia e-mailowego, który automatycznie odpisuje na 80% pytań z precyzją 98%. Zerkniesz na krótki diagram pokazujący architekturę?",
            status: "Inbound (Wtyczka)"
          }
        ];
        for (const lead of defaultLeads) {
          await upsertLead(dc, {
            id: lead.id,
            name: lead.name,
            bio: lead.bio,
            source: lead.source,
            isHighTicket: lead.isHighTicket,
            score: lead.score,
            draftMessage: lead.draftMessage,
            status: lead.status
          });
        }
      }
    } catch (e) {
      console.warn("[InboundService] Failed to seed default leads in Data Connect:", e);
    }
  }

  public async getLeads() {
    try {
      await this.seedLeadsIfEmpty();
      const { data } = await listLeads(dc);
      const leads: InboundLead[] = [];
      if (data && data.leads) {
        data.leads.forEach(l => {
          leads.push({
            id: l.id,
            name: l.name,
            email: l.email || undefined,
            bio: l.bio || "",
            source: l.source || "",
            timestamp: l.createdAt,
            isHighTicket: l.isHighTicket,
            score: l.score || 0,
            draftMessage: l.draftMessage || "",
            status: l.status,
            priority: l.priority || undefined,
            aiEnrichment: l.aiEnrichment as AIEnrichment | undefined,
            chatHistory: l.chatHistory as ChatMessage[] | undefined,
            dmSequence: l.dmSequence as DMStep[] | undefined,
            pitchCard: l.pitchCard as PitchCardData | undefined,
            tacticalBrief: l.tacticalBrief as TacticalBriefData | undefined,
          } as any);
        });
      }
      this.inMemoryLeads = leads;
    } catch (e) {
      console.warn("[InboundService] Failed to load leads from Data Connect, using memory:", e);
    }
    return [...this.inMemoryLeads].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private async fetchLead(id: string): Promise<InboundLead | null> {
    try {
      const { data } = await getLead(dc, { id });
      if (data && data.lead) {
        const l = data.lead;
        const lead: InboundLead = {
          id: l.id,
          name: l.name,
          email: l.email || undefined,
          bio: l.bio || "",
          source: l.source || "",
          timestamp: l.createdAt,
          isHighTicket: l.isHighTicket,
          score: l.score || 0,
          draftMessage: l.draftMessage || "",
          status: l.status,
          aiEnrichment: l.aiEnrichment as any,
          chatHistory: l.chatHistory as any,
          dmSequence: l.dmSequence as any,
          pitchCard: l.pitchCard as any,
          tacticalBrief: l.tacticalBrief as any,
        } as any;
        
        const index = this.inMemoryLeads.findIndex(l => l.id === id);
        if (index !== -1) {
          this.inMemoryLeads[index] = lead;
        } else {
          this.inMemoryLeads.push(lead);
        }
        return lead;
      }
    } catch (e) {
      console.warn("[InboundService] Failed to fetch lead from Data Connect, using memory:", e);
    }
    return this.inMemoryLeads.find(l => l.id === id) || null;
  }

  public async processInboundLead(name: string, bio: string, source: string) {
    let draftMessage = "Zainicjuj kontakt.";
    let isHighTicket = false;
    let score = 50;
    
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Jesteś AI Closerem i rekruterem dla mojego biznesu B2B (sprzedaję systemy automatyzacji dla firm i agencji za 15 000 PLN).
Otrzymujesz profil leada, który do nas napisał lub wykazał aktywność.
Imię: ${name}
Platforma: ${source}
Bio / Opis profilu: ${bio}

1. Oceń (1-100), jak bardzo to jest "High-Ticket Lead" na podstawie BIO. Szukamy właścicieli, CEO, osób skalujących biznesy, e-commerce, decydentów. Odrzucaj uczniów, hobbystów, łowców darmówek.
2. Zdecyduj, czy isHighTicket (zwróć true jeśli score > 60).
3. Wygeneruj DR Message (Direct Message) - potężną, opartą o DR Marketing pierwszą wiadomość DM do wysłania. Użyj "Nowego Mechanizmu" (np. "System Inbound AI") z krótkim "Nóż w ranę" (np. "Skalowanie po 12h dziennie to pułapka"). Daj miękki Call to Action ("Otwarty na krótki loom video?"). Krótko, mocno.

Odpowiedz TYLKO i WYŁĄCZNIE czystym, prawidłowym formatem JSON bez żadnych bloków kodowych (żadnych znaczników \`\`\`json):
{
  "score": (liczba),
  "isHighTicket": (true/false),
  "message": "(treść DM - używaj \\n do łamania linii)"
}`;

        let response = await generateInboundContentWithFallback(ai, {
           contents: prompt
        });
        
        const text = response.text || "";
        let cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const data = JSON.parse(cleanText);
        score = data.score;
        isHighTicket = data.isHighTicket;
        draftMessage = data.message;
      }
    } catch(err: any) {
      logVerbose("[Inbound Service] Fallback triggered for processInboundLead due to service limits/errors:", err.message || err);
      score = 78;
      isHighTicket = true;
      draftMessage = `Cześć ${name.split(' ')[0]}!\n\nZapisuję nasz formularz z platformy ${source}. Widzę, że zajmujesz się skalowaniem działań biznesowych.\n\nCzy wiesz, że robienie powtarzalnych zadań ręcznie każdego dnia potrafi spowolnić firmę o ponad 15 godzin w tygodniu? Posiadamy gotowy, zwinny schemat integracji, który to eliminuje.\n\nCzy interesuje Cię krótka (2-minutowa) prezentacja wideo opisująca jak to ułożyć u siebie bez kodowania?`;
    }
    
    const newLead: InboundLead = {
      id: crypto.randomUUID(),
      name,
      bio, 
      source,
      timestamp: new Date().toISOString(),
      score,
      isHighTicket,
      draftMessage,
      status: "Inbound (Wtyczka)"
    };
    
    this.inMemoryLeads.push(newLead);
    await this.saveLeadToDb(newLead);
    return newLead;
  }

  public async sendDM(leadId: string) {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;

    if (this.makeWebhook) {
      try {
        await fetch(this.makeWebhook, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              action: "send_dm",
              leadId: lead.id,
              name: lead.name,
              platform: lead.source,
              message: lead.draftMessage
           })
        });
      } catch (e) {
        console.error("Błąd podczas wysyłania do webhooka Make.com", e);
      }
    }

    lead.status = "Wysłana wiadomość";
    const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
    if (index !== -1) this.inMemoryLeads[index] = lead;
    await this.saveLeadToDb(lead);
    return lead;
  }

  // PRO Features: Status Updates
  public async updateLeadStatus(leadId: string, newStatus: string): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;
    lead.status = newStatus;
    const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
    if (index !== -1) this.inMemoryLeads[index] = lead;
    await this.saveLeadToDb(lead);
    return lead;
  }

  // PRO Features: AI Profiling & Enrichment
  public async enrichLeadWithAI(leadId: string): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych serwera.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Analizujesz leada biznesowego w systemie CRM Zapalnik. Wygeneruj pogłębiony, strategiczny profil B2B leada w oparciu o jego dane:
Imię: ${lead.name}
Profil/Bio: ${lead.bio}
Platforma źródłowa: ${lead.source}

Wygeneruj strukturę JSON zawierającą:
1. "icebreakers" - dokładnie 3 bardzo spersonalizowane tematy do rozmowy / otwarcia dyskusji (Icebreakers) w języku polskim, powiązane z pozycją zawodową leada lub jego branżą.
2. "budgetPotential" - jedno z trzech słów: "niski", "średni" lub "wysoki" (potencjał budżetowy).
3. "objections" - lista dokładnie 2-3 potencjalnych obiekcji (objection) klienta podczas rozmowy oraz natychmiastowe profesjonalne riposty (riposte) zbijające tę obiekcję, sformułowane w języku polskim.

Odpowiedz wyłącznie czystym kodem JSON. Nie dołączaj znaczników \`\`\`json ani innych obudowań markdown.

Struktura wyjściowa musi odpowiadać dokładnie temu schematowi:
{
  "icebreakers": ["...", "...", "..."],
  "budgetPotential": "niski" | "średni" | "wysoki",
  "objections": [
    { "objection": "...", "riposte": "..." },
    { "objection": "...", "riposte": "..." }
  ]
}`;

    try {
      const response = await generateInboundContentWithFallback(ai, {
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Pusta odpowiedź od modelu Gemini.");
      }

      let cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const enrichmentData = JSON.parse(cleanText) as AIEnrichment;
      
      // Save the enrichment to lead
      lead.aiEnrichment = enrichmentData;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    } catch (e: any) {
      logVerbose("[Inbound Service] Fallback triggered for enrichLeadWithAI:", e.message || e);
      const fallbackEnrichment: AIEnrichment = {
        icebreakers: [
          `Gratuluję świetnego profilu na ${lead.source}! Podoba mi się Twoje nastawienie na optymalizację i rozwój.`,
          `Zauważyłem w Twoim opisie pasję do automatyzacji powtarzalnych procesów biznesowych.`,
          `Jak radzicie sobie obecnie z przepływem nowych leadów w bieżącym kwartale?`
        ],
        budgetPotential: "średni",
        objections: [
          { objection: "Brak wolnego czasu na wdrożenia w tym miesiącu", riposte: "Zupełnie to rozumiem. Nasze wdrożenie przebiega w 100% samodzielnie po naszej stronie - Twój zespół nie traci ani minuty cennego czasu." },
          { objection: "Sami piszemy automatyzacje na Zapier", riposte: "Zapier jest świetny na start, ale przy skali potrzebna jest certyfikowana architektura odporna na błędy API i pętlę webhooków." }
        ]
      };
      lead.aiEnrichment = fallbackEnrichment;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    }
  }

  // PRO Feature: Strategic Message Sequence (4 Steps)
  public async generateSequenceWithAI(leadId: string): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych serwera.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Jesteś genialnym dyrektorem sprzedaży B2B (SDR Manager). Analizujesz profil leada B2B w celu stworzenia bezlitośnie skutecznej, strategicznej, 4-etapowej sekwencji wiadomości Direct Message (DM) do wysłania w odstępach czasowych.
Dane leada:
Imię: ${lead.name}
Bio / Profil: ${lead.bio}
Platforma: ${lead.source}

Zaprojektuj kampanię złożoną z 4 kroków o następującej strategii:
Krok 1 (Dzień 1): Spersonalizowany Icebreaker (unikalne, nienachalne nawiązanie bezpośrednio do jego profilu/statusu) + silnie pociągający haczyk biznesowy (tzw. "nóż w ranę" lub rzucenie wyzwania branżowego).
Krok 2 (Dzień 3): Podrzucenie darmowej wartości merytorycznej powiązanej z jego branżą (np. link do niesamowitego, wymyślonego ale realistycznego case study jak podwoiliśmy ROI w podobnym SaaS/Agencji, albo pigułka taktyczna).
Krok 3 (Dzień 7): Miękka propozycja nagrania krótkiego, spersonalizowanego wideo-looma (np. 3-minutowy audit wideo) z precyzyjną analizą jego marki / profilu pod kątem automatyzacji powtarzalnych procesów.
Krok 4 (Dzień 12): Profesjonalna, skracająca dystans wiadomość rozstaniowa (Breakup message), zamykająca pętlę komunikacyjną, która stawia Cię w pozycji eksperta, dając ostatnią szansę na bezpłatną konsultację.

Zwróć odpowiedź wyłącznie w czystym, poprawnym formacie JSON bez markdownu (bez znaczników \`\`\`json) o następującej strukturze tablicy 4 kroków:
[
  {
    "step": 1,
    "delay": "Dzień 1",
    "label": "Spersonalizowany Icebreaker",
    "text": "Tekst wiadomości z personalizacją do ${lead.name} ..."
  },
  {
    "step": 2,
    "delay": "Dzień 3",
    "label": "Darmowa Wartość (Case Study)",
    "text": "Tekst wiadomości ..."
  },
  {
    "step": 3,
    "delay": "Dzień 7",
    "label": "Miękka Propozycja Loom Video",
    "text": "Tekst wiadomości ..."
  },
  {
    "step": 4,
    "delay": "Dzień 12",
    "label": "Wiadomość Rozstaniowa (Breakup)",
    "text": "Tekst wiadomości ..."
  }
]`;

    try {
      const response = await generateInboundContentWithFallback(ai, {
        contents: prompt,
        config: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Pusta odpowiedź z Gemini.");
      }

      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const steps = JSON.parse(cleanText) as DMStep[];
      
      lead.dmSequence = steps;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    } catch (e: any) {
      logVerbose("[Inbound Service] Fallback triggered for generateSequenceWithAI:", e.message || e);
      const recipientFirstName = lead.name ? lead.name.split(' ')[0] : "Szanowny Kliencie";
      const fallbackSteps: DMStep[] = [
        {
          step: 1,
          delay: "Dzień 1",
          label: "Spersonalizowany Icebreaker",
          text: `Cześć ${recipientFirstName}! Super profil na ${lead.source}. Zauważyłem, że skupiasz się na skalowaniu biznesu. Często wąskim gardłem staje się rozproszona, ręczna praca administracyjna. Otwarty na krótki diagram pokazujący, jak to zautomatyzować u Ciebie?`
        },
        {
          step: 2,
          delay: "Dzień 3",
          label: "Darmowa Wartość (Case Study)",
          text: `Hej ${recipientFirstName}! Podsyłam krótkie, 2-stronicowe case study, gdzie krok po kroku pokazaliśmy, jak podobna firma uwolniła 20 godzin na pracownika miesięcznie dzięki prostym integracjom. Mam nadzieję, że wyciągniesz z tego garść inspiracji!`
        },
        {
          step: 3,
          delay: "Dzień 7",
          label: "Miękka Propozycja Loom Video",
          text: `Szybkie pytanie, ${recipientFirstName}. Zamiast suchych opisów, nagrałem krótki (2-minutowy) spersonalizowany filmik pokazujący dokładnie Twój proces i potencjalne miejsca ucieczki klientów. Dokąd mogę go podesłać?`
        },
        {
          step: 4,
          delay: "Dzień 12",
          label: "Wiadomość Rozstaniowa (Breakup)",
          text: `Wygląda na to, że automatyzacje nie są teraz Twoim priorytetem, co w pełni rozumiem, ${recipientFirstName}. Zamykam ze swojej strony kontakt, ale gdyby temat odzyskiwania wolnego czasu wrócił w kolejnym kwartale, wiesz gdzie mnie znaleźć. Powodzenia!`
        }
      ];
      lead.dmSequence = fallbackSteps;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    }
  }

  // PRO Feature: Chat History Saver/Updater
  public async saveChatHistory(leadId: string, history: ChatMessage[]): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;
    lead.chatHistory = history;
    const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
    if (index !== -1) this.inMemoryLeads[index] = lead;
    await this.saveLeadToDb(lead);
    return lead;
  }

  // PRO Feature: Generate Premium Personalized B2B Pitch-Card
  public async generatePitchCardWithAI(leadId: string): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych serwera.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Jesteś wybitnym partnerem wdrożeniowym automatyzacji AI i doradcą biznesowym dla zarządów oraz założycieli firm B2B. Twoim celem jest przygotowanie niesamowitej, zindywidualizowanej oferty wdrożenia automatyzacji (tzw. "B2B Pitch-Card" / One-Pager) dla klienta:
- Imię: ${lead.name}
- Profil operacyjny / Bio: ${lead.bio}
- Platforma kontaktu: ${lead.source}

Zaprojektuj ofertę wdrożenia automatyzacji, która bezlitośnie obnaża wąskie gardła leada i oferuje bezdyskusyjną wartość. Domuśl się lub stwórz realistyczną nazwę firmy na podstawie jego Bio (np. jeśli prowadzi agencję e-commerce, stwórz np. "${lead.name} Media" lub "${lead.name} Logistics" - bądź tak sprytny i realistyczny jak to możliwe).

Twoja odpowiedź musi być wyłącznie poprawnym kodem JSON mającym następujące pola:
1. "companyName": realistyczna lub rzeczywista nazwa firmy leada.
2. "leadName": "${lead.name}".
3. "industryChallenges": tablica dokładnie 3 konkretnych, bolesnych wyzwań w jego branży/dziedzinie (np. "Utrata do 15h tygodniowo na powtarzalny data entry", "Wąskie gardło przy ręcznym copy-paste i braku integracji", "Słaba konwersja leadów przez opóźnione maile o 24h").
4. "proposedSolutions": tablica dokładnie 3 idealnie dopasowanych systemów automatyzacji AI, które wdrożymy (np. "System Inbound Lead Autopilot z natychmiastowym dispatchingiem", "Inteligentny Asystent AI synchronizujący HubSpot/ActiveCampaign w tle", "Automatyczny generator spersonalizowanych filmów wideo One-Click").
5. "estimatedRoi": Obiekt z szacunkami:
   - "timeSavedHours": szacowane godziny zaoszczędzone przez zespół (np. "55 godzin / miesiąc")
   - "costReductionPct": procentowa redukcja kosztów operacyjnych na przetwarzanie danych (np. "40%")
   - "paybackMonths": okres zwrotu z inwestycji (np. "2 miesiące")
   - "financialGain": roczna oszczędność lub dodatkowy zysk netto w PLN (np. "60 000 PLN")
6. "timeline": tablica 4 kamieni milowych wdrożenia. Każdy element musi mieć:
   - "milestone": krótka, profesjonalna nazwa (np. "Audyt Technologiczny", "Integracja Silnika AI i Webhooków", "Testy i Uruchomienie", "Dedykowane Szkolenie")
   - "duration": np. "Dni 1-3", "Dni 4-10", "Tydzień 2", "Tydzień 3"
   - "description": rzetelny, precyzyjny opis taktyczny tego etapu.
7. "htmlEmailTemplate": Cudowny, w pełni responsywny szablon e-mail w formacie HTML z wbudowanymi stylami inline CSS (inline-styles), gotowy do skopiowania i wysłania w Gmailu lub Outlooku.
   - Kolorystyka: nowoczesny styl premium. Dark mode z akcentem indygo/fiolet (#6366f1) lub szmaragdu (#10b981), dystyngowana czcionka bezszeryfowa.
   - Treść szablonu musi być w całości po polsku, personalizowana i merytoryczna. Musi zawierać piękne tabele z ROI lub podsumowaniem wyzwań, elegancki layout, przyciski Call-To-Action (np. "Zarezerwuj wdrożenie demo") oraz przejrzyste, stylowe obramowania sekcji. Nie stosuj tagów dynamicznych, tylko wstaw już wygenerowane, sfinalizowane wartości (np. wygenerowaną nazwę firmy, ROI itd.).

Zwróć wyłącznie czysty, poprawny JSON, bez markdownowych znaczników \`\`\`json ani innych obudowań tekstu.`;

    try {
      const response = await generateInboundContentWithFallback(ai, {
        contents: prompt,
        config: {
          temperature: 0.78,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Pusta odpowiedź z Gemini podczas generowania Pitch-Carda.");
      }

      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanText) as PitchCardData;
      
      lead.pitchCard = data;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    } catch (e: any) {
      logVerbose("[Inbound Service] Fallback triggered for generatePitchCardWithAI:", e.message || e);
      const computedCompany = lead.bio.match(/[A-Za-z0-9\sęóąśłżźćńÓĄŚŁŻŹĆŃ]{3,20}\s(S.A.|Sp.\sz\so.o.|Agency|Group|Studio|Interactive)/i)?.[0] || `${lead.name} Enterprises`;
      const fallbackPitchCard: PitchCardData = {
        companyName: computedCompany,
        leadName: lead.name,
        industryChallenges: [
          "Utrata do 15 godzin tygodniowo na rutynowy, manualny data entry",
          "Opóźnienia w kontakcie z leadami przekraczające 12 godzin (strata konwersji)",
          "Brak centralnego systemu zarządzania relacjami (losowe gubienie kontaktów)"
        ],
        proposedSolutions: [
          "System Inbound Lead Autopilot z natychmiastowym routingiem i powiadomieniami",
          "Inteligentny asystent e-mailowy automatycznie konstruujący spersonalizowane drafts",
          "Dedykowany kokpit analityczny z monitoringiem wąskich gardeł w czasie rzeczywistym"
        ],
        estimatedRoi: {
          timeSavedHours: "45 godzin / miesiąc",
          costReductionPct: "35%",
          paybackMonths: "2 miesiące",
          financialGain: "48 000 PLN"
        },
        timeline: [
          { milestone: "Audyt i Analiza Procesów", duration: "Dni 1-3", description: "Identyfikacja wszystkich miejsc ręcznego przepisywania danych i mapowanie architektury integracji." },
          { milestone: "Wdrożenie Integracji Core", duration: "Dni 4-10", description: "Połączenie systemów CRM, formularzy i automatycznych powiadomień Slack/e-mail." },
          { milestone: "Konfiguracja Asystenta AI", duration: "Dni 11-15", description: "Podpięcie inteligentnych modeli językowych do szybkiego generowania spersonalizowanych odpowiedzi." },
          { milestone: "Testy i Akceptacja Techniczna", duration: "Dni 16-20", description: "Przeprowadzenie symulacji obciążeniowych, poprawki UX oraz szkolenie zespołu z obsługi." }
        ],
        htmlEmailTemplate: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0b0f19; color: #f3f4f6; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);">
          <div style="border-bottom: 1px solid #1e293b; padding-bottom: 20px; text-align: center;">
            <span style="font-size: 20px; font-weight: 800; color: #6366f1; letter-spacing: -0.5px;">CRM ZAPALNIK AI</span>
            <p style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin: 5px 0 0 0;">Strategiczna Oferta Automatyzacji B2B</p>
          </div>
          <div style="padding: 24px 0;">
            <p style="font-size: 15px; line-height: 1.6; color: #d1d5db;">Cześć <strong>${lead.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Przeanalizowałem profil operacyjny <strong>${computedCompany}</strong>. Zidentyfikowałem kluczowe obszary, w których proste, odporne na błędy automatyzacje mogą uwolnić cenny czas i zabezpieczyć uciekające przychody.</p>
            
            <div style="background-color: #111827; border-radius: 8px; border: 1px solid #1f2937; padding: 20px; margin: 24px 0;">
              <h3 style="font-size: 12px; text-transform: uppercase; color: #6366f1; margin-top: 0; margin-bottom: 15px; letter-spacing: 1px;">Kluczowe Szacunki ROI (Rocznie)</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1f2937;">Zaoszczędzony czas zespołu:</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #10b981; text-align: right; border-bottom: 1px solid #1f2937;">45 godz / mc</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1f2937;">Redukcja kosztów operacyjnych:</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #10b981; text-align: right; border-bottom: 1px solid #1f2937;">35%</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #94a3b8; border-bottom: 1px solid #1f2937;">Okres zwrotu z inwestycji:</td>
                  <td style="padding: 8px 0; font-size: 13px; font-weight: bold; color: #10b981; text-align: right; border-bottom: 1px solid #1f2937;">2 miesiące</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 13px; color: #94a3b8;">Prognozowany zysk finansowy:</td>
                  <td style="padding: 8px 0; font-size: 14px; font-weight: 900; color: #6366f1; text-align: right;">48 000 PLN</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8;">Wdrożymy zintegrowany <strong>System Inbound Lead Autopilot</strong>, który błyskawicznie połączy Wasze formularze z systemami powiadomień i CRM, skracając czas reakcji na zapytania klientów do poniżej 5 minut.</p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://zapalnik.ai/meeting" style="background-color: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 6px; display: inline-block; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">Zarezerwuj wdrożenie demo (20 min)</a>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #64748b; font-style: italic; text-align: center;">Kalkulacja strategiczna wygenerowana automatycznie i certyfikowana przez Zapalnik CRM.</p>
          </div>
          <div style="border-top: 1px solid #1e293b; padding-top: 20px; text-align: center; font-size: 11px; color: #64748b;">
            &copy; 2026 CRM Zapalnik LLC. Wszelkie prawa zastrzeżone.
          </div>
        </div>`
      };
      lead.pitchCard = fallbackPitchCard;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    }
  }

  // PRO Feature: Military-Style Outbound Tactical Brief Generator
  public async generateTacticalBriefWithAI(leadId: string): Promise<InboundLead | null> {
    const lead = await this.fetchLead(leadId);
    if (!lead) return null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Klucz API Gemini nie jest skonfigurowany w zmiennych środowiskowych serwera.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Jesteś elitarnym Dowódcą Operacji Outboundowych (Field Commander SDR) i wybitnym taktykiem sprzedaży B2B High-Ticket. Słyniesz z przygotowywania bezwzględnie precyzyjnych i skutecznych odpraw bojowych (Tactical Battle Briefs / Battlecards) dla zespołów sprzedażowych przed "desantem" (rozmową lub zimnym kontaktem).

Przygotuj kompletną, merytoryczną odprawę taktyczną (Battlecard) dla klienta:
- Imię: ${lead.name}
- Profil operacyjny / Bio: ${lead.bio}
- Platforma kontaktu: ${lead.source}

Twoja odpowiedź musi być wyłącznie poprawnym kodem JSON posiadającym następujące pola:
1. "missionObjective": jednozdaniowa, zwięzła i niezwykle konkretna "Misja Bojowa" (np. "Przełamać opór Michała poprzez natychmiastowe wskazanie marnotrawstwa 15 godzin/tydzień na manualną wysyłkę ofert i zalockować demo na czwartek, godz. 11:00.").
2. "vulnerabilityAssessment": tablica dokładnie 3 precyzyjnie zdiagnozowanych słabych punktów operacyjnych leada w oparciu o jego profil (np. "Brak automatycznej dystrybucji leadów - odpowiedź następuje po >12h", "Zależność przychodów od jednoosobowej pracy założyciela", "Wysoki koszt manualnego rekrutowania partnerów").
3. "meddpiccTable": obiekt z kategoryzacją MEDDPICC:
   - "metrics": konkretne wyliczenie finansowe straty lub oszczędności (np. "Strata operacyjna szacowana na ok. 5400 PLN/mc przez czas poświęcony na manualny data entry")
   - "economicBuyer": wskazanie głównego płatnika i jego roli (np. "${lead.name} (Founder) - samodzielnie decyduje o budżecie do wysokości 20k PLN")
   - "decisionCriteria": krytyczne parametry oceny rozwiązania przez klienta (np. "Prędkość uruchomienia w max 14 dni, brak skomplikowanej instalacji u wewnętrznego zespołu")
   - "decisionProcess": ścieżka decyzyjna (np. "Jedna krótka rozmowa, wymagana faktura VAT oraz próbne wdrożenie pilotażowe na 7 dni")
   - "identifyPain": zdefiniowany, bolesny i kłujący punkt oporu (np. "Agencja traci 4 na 10 spływających zapytań z powodu braku natychmiastowego feedbacku w weekendy")
   - "champion": zaufany sojusznik wewnątrz firmy (np. "Asystent operacyjny Michała lub on sam, o ile zdejmiemy z niego presję rutynowych zadań")
4. "combatObjections": tablica dokładnie 3 najcięższych spodziewanych obiekcji operacyjnych klienta wraz z pancerną, "bojową" obroną (combatshield):
   - Element 1: "objection": np. "Nie mam na to czasu w tym kwartale" | "combatshield": np. "Rozumiem. Właśnie dlatego dzwonię: nasz system wdrażamy w całości my - Pański zespół nie poświęca ani minuty, a od 3. dnia odzyskują Państwo 3 godziny wolnej pracy dziennie. Przejdźmy do szczegółów?"
   - Element 2: "objection": np. "Zrobimy to sami na Make/Zapier" | "combatshield": np. "To genialny pomysł, dopóki webhook nie pęknie w nocy przy kampanii za 50 tys. PLN. My dajemy certyfikowaną architekturę ze SLA, wsparciem 24/7 i pełną odpornością na błędy sieciowe. Chce Pan pisać skrypty czy skalować biznes?"
   - Element 3: "objection": np. "Za drogo, nie mam wolnego budżetu" | "combatshield": np. "Budżet na straty czasu ma Pan już teraz - ucieka z każdym dniem. My te pieniądze po prostu przekierujemy z nieefektywności na gotowy system, który spłaca się sam w niecałe 50 dni. Czy kalkulacja zwrotu 5x brzmi rozsądnie?"
5. "opScript": obiekt ze scenariuszem ataku telemarketingowego / cold-outreach (Op-Script):
   - "phase1Hook": Faza 1: Hak taktyczny (pierwsze 10 sekund) na przełamanie asertywności
   - "phase2Pain": Faza 2: Precyzyjne uderzenie w zdiagnozowany punkt bólu
   - "phase3Proof": Faza 3: Uwiarygodnienie i niepodważalny dowód (case study)
   - "phase4Cta": Faza 4: Bezpośrednie, zdecydowane wezwanie do akcji (CTA)
6. "readinessRating": liczba całkowita od 40 do 98 reprezentująca "Indeks Gotowości Bojowej" (Combat Readiness Index) oparty na profilu i szansach zamknięcia.

Zwróć wyłącznie czysty, poprawny JSON, bez markdownowych znaczników \`\`\`json ani innych obudowań tekstu.`;

    try {
      const response = await generateInboundContentWithFallback(ai, {
        contents: prompt,
        config: {
          temperature: 0.70,
          responseMimeType: "application/json"
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Pusta odpowiedź z Gemini podczas generowania Odprawy Taktycznej.");
      }

      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanText) as TacticalBriefData;
      
      lead.tacticalBrief = data;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    } catch (e: any) {
      logVerbose("[Inbound Service] Fallback triggered for generateTacticalBriefWithAI:", e.message || e);
      const fallbackBrief: TacticalBriefData = {
        missionObjective: `Przełamać opór operacyjny leada ${lead.name} wskazując na marnowanie cennego czasu na manualny data entry oraz zamknąć spotkanie demo na prezentację pilotażową.`,
        vulnerabilityAssessment: [
          "Brak scentralizowanego sytemu dystrybucji zapytań od klientów",
          "Opóźnienia czasowe w kontakcie zwrotnym (powyżej 12 godzn)",
          "Manualne, podatne na błędy ludzkie przepisywanie leadów z formularzy"
        ],
        meddpiccTable: {
          metrics: "Szacowana strata operacyjna wynosząca około 4500 PLN miesięcznie z powodu wąskich gardeł administracyjnych.",
          economicBuyer: `${lead.name} (Founder / Decydent Główny) - posiada pełną swobodę dysponowania budżetem wdrożeniowym w granicach 15 000 PLN.`,
          decisionCriteria: "Liczy się prędkość konfiguracji (poniżej 14 dni), bezawaryjność 24/7 oraz brak zaangażowania wewnętrznego zespołu IT.",
          decisionProcess: "Jedna skondensowana rozmowa strategiczna, wystawienie FV, uruchomienie 7-dniowego etapu pilotażowego.",
          identifyPain: "Firma bezpowrotnie traci około 30% napływających zapytań z powodu braku natychmiastowej reakcji systemowej.",
          champion: `${lead.name} we własnej osobie, o ile zdejmiemy z niego brzemię codziennych, powtarzalnych obowiązków.`
        },
        combatObjections: [
          { objection: "Brak czasu na wdrożenia w tym kwartale", combatshield: "Rozumiem Pańskie obawy. Właśnie dlatego w całości to my bierzemy na siebie integrację - Pański zespół nie poświęca ani minuty, a od 3. dnia odzyskuje 3 godziny." },
          { objection: "Zrobimy to sami wewnętrznie na Zapier", combatshield: "Własne wdrożenie jest super, ale pęknięcie webhooka przy kampanii marketingowej potrafi sparaliżować sprzedaż. My dajemy certyfikowaną infrastrukturę i pełne wsparcie 24/7." },
          { objection: "Budżet na ten miesiąc jest już zablokowany", combatshield: "Budżet na straty czasu uchodzi Panu z każdym dniem. My te środki po prostu przekierujemy z nieefektywności na system, który spłaci się sam w niecałe 50 dni." }
        ],
        opScript: {
          phase1Hook: "Dzień dobry! Nawiązując krótko do Pańskich wyzwań ze skalowalnością, zauważyłem jeden element w profilu...",
          phase2Pain: "Większość partnerów w Pańskiej niszy marnuje ponad 15 godzin tygodniowo na rutynowy data entry zamiast skupić się na sprzedaży.",
          phase3Proof: "Spięliśmy ostatnio podobną operację integracyjną w niecałe 10 dni, co zaowocowało redukcją kosztów operacyjnych o 35%.",
          phase4Cta: "Czy znajdzie Pan 5 minut w ten czwartek o 11:00 na krótki rzut oka na ten sprawdzony schemat?"
        },
        readinessRating: 84
      };
      lead.tacticalBrief = fallbackBrief;
      const index = this.inMemoryLeads.findIndex(l => l.id === lead.id);
      if (index !== -1) this.inMemoryLeads[index] = lead;
      await this.saveLeadToDb(lead);
      return lead;
    }
  }
}

export const inboundService = new InboundService();
