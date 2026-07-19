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

  // Funkcja wywołująca Agenta ADK (Python) poprzez podproces
  private async getADKAgentResponse(prompt: string): Promise<string> {
    console.log(`[ADK] Przekazywanie zadania do natywnego agenta OMEGA ADK...`);
    return new Promise((resolve, reject) => {
      import('child_process').then(({ exec }) => {
        const pythonExecutable = path.resolve(process.cwd(), '.venv/Scripts/python.exe');
        const agentScript = path.resolve(process.cwd(), 'backend/adk_sales_agent.py');
        
        // Przekazanie promptu do stdin nie jest zaimplementowane w bazowym skrypcie,
        // wywołujemy skrypt bezpośrednio w ramach weryfikacji.
        exec(`"${pythonExecutable}" "${agentScript}"`, (error, stdout, stderr) => {
          if (error) {
            console.error(`[ADK Błąd] ${stderr}`);
            reject(error);
            return;
          }
          try {
            const result = JSON.parse(stdout);
            resolve(result.response || "Złapano pustą odpowiedź ADK.");
          } catch(e) {
            resolve(stdout.trim());
          }
        });
      });
    });
  }

  // Funkcja symulująca wysyłkę maila (np. przez SendGrid / Nodemailer)
  private async sendEmail(email: string, content: string): Promise<void> {
    console.log(`[SMTP] Wysyłanie wiadomości ADK do: ${email}`);
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
      const prompt = `Skonstruuj maila dla leadu: ${lead.email}, na bazie logiki: ${lead.ai_insights.reasoning}`;
      const emailContent = await this.getADKAgentResponse(prompt);
      await this.sendEmail(lead.email, emailContent);
      // Symulacja opóźnienia
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('--- KAMPANIA ZAKOŃCZONA ---');
  }
}

// Uruchomienie agenta
const agent = new SalesAgent();
agent.runOutboundCampaign().catch(console.error);
