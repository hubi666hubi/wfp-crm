export interface LeadDataInput {
  name: string;
  companyName: string;
  industry: string;
  rawNotes: string;
}

export interface SyndicateAnalysisResult {
  companyName: string;
  industry: string;
  painPoints: string[];
  automationOpportunities: string[];
  estimatedValueRange: string;
  recommendedServices: string[];
  urgencyScore: number;
  nextSteps: string[];
  pitchStrategy: string;
  estimatedROI: string;
}

export async function runSyndicatePipeline(leadData: LeadDataInput): Promise<SyndicateAnalysisResult> {
  const { companyName, industry, rawNotes } = leadData;

  // Extract pain points from raw notes
  const painPoints: string[] = [];
  if (rawNotes.toLowerCase().includes('chaos')) painPoints.push('Niezorganizowany proces');
  if (rawNotes.toLowerCase().includes('tracą czas') || rawNotes.toLowerCase().includes('czasem')) painPoints.push('Wydłużony czas operacyjny');
  if (rawNotes.toLowerCase().includes('ręczn')) painPoints.push('Zadania wykonywane ręcznie');
  if (rawNotes.toLowerCase().includes('wycen')) painPoints.push('Brak automatyzacji wyceny');
  if (rawNotes.toLowerCase().includes('kalendarzy')) painPoints.push('Zamieszanie w harmonogramowaniu');

  // Determine automation opportunities
  const automationOpportunities: string[] = [];
  if (industry.toLowerCase().includes('transportowe') || industry.toLowerCase().includes('przeprowadzki')) {
    automationOpportunities.push('Automatyczne obliczanie stawek transportu');
    automationOpportunities.push('Integracja kalendarza z systemem rezerwacji');
    automationOpportunities.push('Automatyczne SMS do klientów o statusie');
    automationOpportunities.push('Harmonogramowanie tras dostawczych');
  }

  // Calculate urgency based on pain indicators
  let urgencyScore = 50;
  if (rawNotes.toLowerCase().includes('dużo')) urgencyScore += 15;
  if (rawNotes.toLowerCase().includes('chaos')) urgencyScore += 15;
  if (rawNotes.toLowerCase().includes('tracą')) urgencyScore += 10;
  urgencyScore = Math.min(urgencyScore, 95);

  // Recommend services based on industry and pain points
  const recommendedServices: string[] = [];
  if (painPoints.includes('Zadania wykonywane ręcznie')) {
    recommendedServices.push('Workflow Automation Engine');
  }
  if (industry.toLowerCase().includes('transportowe')) {
    recommendedServices.push('Logistics Optimization Module');
  }
  if (painPoints.includes('Brak automatyzacji wyceny')) {
    recommendedServices.push('Dynamic Pricing Engine');
  }
  if (painPoints.length > 2) {
    recommendedServices.push('AI-Powered Business Process Optimization');
  }

  // Estimate value range
  const estimatedValueRange = painPoints.length > 3 ? '$2,500 - $5,000/month' : '$1,000 - $2,500/month';

  // Build next steps
  const nextSteps: string[] = [
    'Scheduled discovery call to validate pain points',
    'Process audit to identify specific automation targets',
    'ROI calculator based on current manual workload',
    'Custom solution proposal'
  ];

  // Pitch strategy
  const pitchStrategy = `Lead operates in ${industry.toLowerCase()}. Main friction: ${painPoints[0] || 'inefficiency'}. Recommend immediate focus on automating ${automationOpportunities[0] || 'core workflows'} which can reduce time spent on manual tasks by 60-70%.`;

  // Estimated ROI
  const estimatedROI = urgencyScore > 75 ? '250-350% in year 1' : '150-200% in year 1';

  return {
    companyName,
    industry,
    painPoints,
    automationOpportunities,
    estimatedValueRange,
    recommendedServices,
    urgencyScore,
    nextSteps,
    pitchStrategy,
    estimatedROI,
  };
}
