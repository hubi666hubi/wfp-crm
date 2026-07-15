import { getDb } from './db.js';
import { GoogleGenAI } from "@google/genai";
import nodemailer from 'nodemailer';

export interface ProfitCampaignPayload {
  campaign: string;
  timestamp: string;
  competitorWeaknesses: string[];
  dopamineHooks: Record<string, any>;
  highValueUsers: any[];
}

/**
 * ELITARNY KOMBAJN PRZYCHODOWY PRO V7.0
 * Autonomicznie zarządza potokiem monetyzacji i masowym outreach'em 24/7/365.
 */
export class StripeKombajnDistributor {
  private ai: GoogleGenAI;
  private MAKE_WEBHOOK_URL: string = process.env.MAKE_WEBHOOK_URL || '';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  /**
   * CYLINDER MONECO MAX: Wyciąga leady High-Ticket i odpala masowy outreach z pełnym zabezpieczeniem.
   */
  public async triggerHighVelocityProfitCampaign(): Promise<boolean> {
    console.log('\x1b[32m🔌 [KOMBAJN ROZRUCH]: Łączę transakcyjnie z bazą i potokiem pocztowym...\x1b[0m');
    const db = getDb();
    
    const competitorWeaknesses = [
      "Wysoka bariera wejścia i długa konfiguracja (time-to-value > 4h)",
      "Brak wbudowanych szablonów VSL i asystenta copywritingu AI",
      "Sztywne plany taryfowe bez rozliczeń Pay-on-Performance"
    ];

    try {
      // 1. Pobieranie zakwalifikowanych leadów High-Ticket
      const leadsSnapshot = await db.collection('leads')
        .where('score', '>=', 85)
        .where('isHighTicket', '==', true)
        .limit(50)
        .get();

      const highValueUsers: any[] = [];
      leadsSnapshot.forEach(doc => {
        const data = doc.data();
        highValueUsers.push({
          id: doc.id,
          email: data.email || "hubi666hubi@gmail.com",
          companyName: data.companyName || "Wykryta Firma VIP",
          qualificationScore: data.score || 95
        });
      });

      if (highValueUsers.length === 0) {
        highValueUsers.push(
          { id: "1408", email: "hubi666hubi@gmail.com", companyName: "Hubix Enterprises", qualificationScore: 99 }
        );
      }

      // 2. Synteza spersonalizowanych haczyków marketingowych PAS via Gemini
      const prompt = `Zbuilduj bezwzględną strukturę copywritingową PAS (Problem-Agitate-Solve) dla platformy automatyzacji. Zwróć obiekt JSON z polami: hook, problemAgitation, grandSlamOffer.`;
      let dopamineHooks = {
        hook: "Czy Twój system operacyjny generuje niewidzialne straty?",
        problemAgitation: "Tracisz gorące leady przez brak natychmiastowej reakcji systemów.",
        grandSlamOffer: "WFP Antigravity Monetization Engine - aktywacja 24/7."
      };

      try {
        const aiResponse = await this.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt
        });
        if (aiResponse && aiResponse.text) {
          dopamineHooks = JSON.parse(aiResponse.text.replace(/```json/g, "").replace(/```/g, "").trim());
        }
      } catch (err) {
        console.warn('⚠️ [KOMBAJN AI FALLBACK]: Uruchomienie lokalnej matrycy struktur.');
      }

      // 3. Masowa wysyłka powiadomień i ofert przez wbudowany transporter Nodemailer
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.mailtrap.io",
        port: parseInt(process.env.SMTP_PORT || "2525"),
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || ""
        }
      });

      for (const user of highValueUsers) {
        const mailOptions = {
          from: '"W.F.P. Matrix Core" <automation@antigravity.dev>',
          to: user.email,
          subject: `🔥 Pilne: Optymalizacja procesów dla ${user.companyName}`,
          html: `<h1>Cześć!</h1><p>${dopamineHooks.hook}</p><p><b>Problem:</b> ${dopamineHooks.problemAgitation}</p><p><b>Rozwiązanie:</b> ${dopamineHooks.grandSlamOffer}</p>`
        };
        
        // Only send email if SMTP is configured
        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
          await transporter.sendMail(mailOptions);
          console.log(`[OUTREACH SUCCESS]: Wiadomosc wyslana do: ${user.email}`);
        } else {
          console.warn('[KOMBAJN] SMTP not configured — email skipped for:', user.email);
        }
      }

      // 4. Wypchnięcie danych do webhooka Make.com (tylko jeśli skonfigurowany)
      if (this.MAKE_WEBHOOK_URL) {
        const payload: ProfitCampaignPayload = {
          campaign: "COMPETITIVE_SWOT_STRIPE_ATTACK",
          timestamp: new Date().toISOString(),
          competitorWeaknesses,
          dopamineHooks,
          highValueUsers
        };

        const response = await fetch(this.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          console.log('[KOMBAJN COMPLETE]: Make.com zsynchronizowane.');
          return true;
        }
        return false;
      } else {
        console.log('[KOMBAJN] MAKE_WEBHOOK_URL not configured — skipping webhook. Set env var to activate.');
        return true;
      }

    } catch (error: any) {
      console.error(`🚨 [KOMBAYN ERROR]: Potok przychodów przerwany: ${error.message}`);
      return false;
    }
  }
}

export const stripeKombajnDistributor = new StripeKombajnDistributor();
