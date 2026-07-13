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
  status: string;
  aiEnrichment?: AIEnrichment;
  dmSequence?: DMStep[];
  chatHistory?: ChatMessage[];
  pitchCard?: PitchCardData;
  tacticalBrief?: TacticalBriefData;
}

export const PIPELINE_COLUMNS = [
  { key: "Inbound (Wtyczka)", label: "Inbound (Wtyczka)", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  { key: "Zakwalifikowane", label: "Zakwalifikowane", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  { key: "Wysłana wiadomość", label: "Wysłana wiadomość", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  { key: "Rozmowa w toku", label: "Rozmowa w toku", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
  { key: "Zamknięte / Sukces", label: "Zamknięte / Sukces", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" }
];
