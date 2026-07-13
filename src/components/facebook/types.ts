export interface FBPost {
  id: string;
  authorName: string;
  groupName: string;
  relativeTime: string;
  postText: string;
  hasDomain?: string;
}

export interface FBLead {
  id: string;
  userId: string;
  postText: string;
  authorName: string;
  groupName: string;
  yourOffer: string;
  customInstructions?: string;
  intentLevel: string;
  painSummary: string;
  estimatedValueHex: string;
  valueFirstMessengerPitch: string;
  detectedCompanyUrl?: string;
  status: string;
  createdAt: string;
  // PRO Fields
  publicCommentStrategy?: string;
  videoPitchScript?: string;
  qualificationScore?: number;
  linkedinConnectPitch?: string;
  coldEmailSubject?: string;
  coldEmailBody?: string;
  // Sentiment Analysis Fields
  sentimentScore?: number;
  sentimentLabel?: string;
  priorityScore?: number;
  priorityLabel?: string;
  emotionalTriggers?: string[];
  sentimentExplanation?: string;
  outreachPitch?: string; // Fast-lane field
}

export interface MachineNicheGroup {
  name: string;
  whyItWorks: string;
}

export interface MachineData {
  nicheGroups?: MachineNicheGroup[];
  leadMagnet?: {
    title: string;
    description: string;
    keyword: string;
  };
  viralPost?: {
    hook: string;
    bodyText: string;
    cta: string;
  };
  messengerScript?: {
    firstMessage: string;
  };
}

export interface FBAccount {
  connected: boolean;
  name: string;
  avatarUrl: string;
  profileId: string;
  tokenExpires: string;
  autopilot: boolean;
  autoComment: boolean;
  scannedGroups: string[];
}

export interface MessengerConfig {
  pageAccessToken: string;
  verifyToken: string;
  autopilotEnabled: boolean;
}

export interface SentimentResult {
  sentimentScore: number;
  sentimentLabel: string;
  priorityScore: number;
  priorityLabel: string;
  emotionalTriggers: string[];
  sentimentExplanation: string;
  tacticalActionPlan: string[];
  suggestedResponseDraft: string;
}
