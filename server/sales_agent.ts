import * as fs from 'fs';
import * as path from 'path';

// OMEGA AI Sales Agent (Outbound)
// Automatyzuje wysyłkę e-maili na podstawie wykwalifikowanych leadów.

interface Lead {
  source: string;
  email: string;
  status: string;
  ai_insights: {
    ai_score: number;
    reasoning: string;
  };
}

class SalesAgent {
  private hotLeadsPath: string;

  constructor() {
    this.hotLeadsPath = path.resolve(process.cwd(), 'data/reports/wfp_hot_leads.json');
  }

  // Funkcja symulująca pobranie wektorów z bazy Supabase RAG
  private async getRAGContextForLead(lead: Lead): Promise<string> {
    console.log(`[RAG] Pobieranie kontekstu sprzedażowego dla ${lead.email}...`);
    // W produkcji wywołanie hybrid_search w Supabase
    return "Mamy idealne rozwiązanie SaaS dla Twojej infrastruktury B2B.";
  }

  // Funkcja generująca treść maila za pomocą AI (np. Gemini)
  private async generateEmailDraft(lead: Lead, context: string): Promise<string> {
    // W produkcji tutaj podpięte AI np. z @google/genai
    return `Cześć,\n\nZauważyłem, że Twoja firma (${lead.ai_insights.reasoning}) może zyskać na naszym nowym systemie OMEGA CRM.\n${context}\n\nPorozmawiajmy w tym tygodniu!\n\nPozdrawiam,\nAI Sales Agent`;
  }

  // Funkcja symulująca wysyłkę maila (np. przez SendGrid / Nodemailer)
  private async sendEmail(email: string, content: string): Promise<void> {
    console.log(`[SMTP] Wysyłanie e-maila do: ${email}`);
    console.log(`--- TREŚĆ ---\n${content}\n-------------\n`);
  }

  public async runOutboundCampaign() {
    console.log('--- START KAMPANII OUTBOUND (OMEGA AGENT) ---');
    
    if (!fs.existsSync(this.hotLeadsPath)) {
      console.error('Brak pliku wfp_hot_leads.json. Oczekuję na zakończenie pracy warstwy C (Qualifiers).');
      return;
    }

    const leads: Lead[] = JSON.parse(fs.readFileSync(this.hotLeadsPath, 'utf-8'));
    const hotLeads = leads.filter(l => l.status === 'HOT');

    console.log(`Znaleziono ${hotLeads.length} gorących leadów gotowych do ataku.`);

    for (const lead of hotLeads) {
      const context = await this.getRAGContextForLead(lead);
      const emailContent = await this.generateEmailDraft(lead, context);
      await this.sendEmail(lead.email, emailContent);
      // Symulacja opóźnienia, żeby nie dostać shadowbana
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('--- KAMPANIA ZAKOŃCZONA ---');
  }
}

// Uruchomienie agenta
const agent = new SalesAgent();
agent.runOutboundCampaign().catch(console.error);
