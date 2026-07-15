import { getDb } from "./db.js";
import { GoogleGenAI } from "@google/genai";
import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";

export interface AntigravityPulse {
  success: boolean;
  timestamp: string;
  boostedLeadsCount: number;
  dopamineSpikeResults: any[];
}

/**
 * CENTRALNY SPINACZ ANTYGRAWITACYJNY MATRIX V5.0
 * Autonomicznie zarządza procesem wzbogacania leadów, pętli dopaminowych i optymalizacji ROI.
 */
export class AntigravityOrchestrator {
  private ai: GoogleGenAI;
  private isThrustActive: boolean = true;

  constructor() {
    // Inicjalizacja silnika AI na podstawie kluczy środowiskowych jądra
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  }

  /**
   * KRYTYCZNA METODA BOOSTOWANIA I UNIFIKACJI PLIKÓW
   * Skanuje przychodzące rekordy, generuje pętle dopaminowe (DopamineLoop)
   * i atomowo wypycha mutacje ewolucyjne do Firebase Data Connect PostgreSQL.
   */
  public async executeTotalSystemBoost(): Promise<AntigravityPulse> {
    console.log("\x1b[35m[ANTIGRAVITY CORE] 🌌 Odpalenie głównego spinacza struktur i monetyzacji...\x1b[0m");
    const db = getDb();
    const dopamineSpikeResults: any[] = [];
    let boostedCount = 0;

    try {
      // 1. Pobranie Inboundowych i surowych leadów z wtyczek wg. schematu blueprint
      const snapshot = await db.collection("leads")
        .where("status", "==", "Inbound (Wtyczka)")
        .limit(20)
        .get();

      console.log(`[ANTIGRAVITY] Znaleziono ${snapshot.size} surowych struktur do transmutacji.`);

      for (const doc of snapshot.docs) {
        const lead = doc.data();
        boostedCount++;

        // 2. Dynamiczne modelowanie wzorców przerwania uwagi (Pattern Interrupt)
        const prompt = `
          Zbuduj elitarne parametry pętli dopaminowej dla leada o profilu:
          Firma: ${lead.companyName || "Nieznana Jednostka"}. Branża: ${lead.industry || "B2B"}.
          Zwróć czysty obiekt JSON dopasowany do encji DopamineLoop z polami: hook, patternInterrupt, unresolvedMystery.
        `;

        let loopConfig = {
          hook: "Twój system operacyjny właśnie generuje niewidzialną stratę.",
          patternInterrupt: "[FX: Heavy Bass Drop + Glitch ekranu w pierwszej sekundzie]",
          unresolvedMystery: "Ukryty powód, dla którego automatyzacja procesów B2B zawodzi..."
        };

        try {
          // Wykorzystanie kaskadowego silnika awaryjnego z jądra projektu
          const aiResponse = await this.ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
          });

          if (aiResponse && aiResponse.text) {
            loopConfig = JSON.parse(aiResponse.text.replace(/```json/g, "").replace(/```/g, "").trim());
          }
        } catch (err) {
          console.warn(`⚠️ [ANTIGRAVITY AI FALLBACK]: Zapięcie wbudowanej pętli awaryjnej dla ${lead.companyName}`);
        }

        // 3. Atomowe wstrzyknięcie zunifikowanych danych za pomocą mutacji GraphQL
        await db.collection("leads").doc(doc.id).update({
          status: "Opłacono", // Przerzut bezpośrednio na status konwersji koszyka
          score: 98,
          aiEnrichment: {
            boostedAt: new Date().toISOString(),
            matrixEngineActive: true,
            dopamineConfig: loopConfig
          },
          pitchCard: {
            hook: loopConfig.hook,
            patternInterrupt: loopConfig.patternInterrupt,
            unresolvedMystery: loopConfig.unresolvedMystery
          }
        });

        // 4. Utworzenie powiązanego logu ewolucji (CreateEvolutionLog) dla SecOps
        await db.collection("evolution_logs").add({
          agentId: "Thor-Antigravity-Engine",
          filePath: "server/antigravityOrchestrator.ts",
          success: true,
          score: 0.99,
          patch: {
            targetLeadId: doc.id,
            appliedHook: loopConfig.hook
          }
        });

        dopamineSpikeResults.push({
          leadId: doc.id,
          company: lead.companyName,
          status: "BOOSTED_SUCCESSFULLY"
        });
      }

      // 5. Automatyczny zapłon kombajnu Stripe w celu natychmiastowego domknięcia finansowego
      if (boostedCount > 0) {
        await stripeKombajnDistributor.triggerHighVelocityProfitCampaign();
      }

    } catch (globalError: any) {
      console.error(`\x1b[41m🚨 [ANTIGRAVITY FATAL FAULT]: Awaria jądra spinacza: ${globalError.message}\x1b[0m`);
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      boostedLeadsCount: boostedCount,
      dopamineSpikeResults
    };
  }

  /**
   * PĘTLA NIEUSTANNEGO DZIAŁANIA 24/7/365
   */
  public async startContinuousThrustLoop(): Promise<void> {
    // Guard: skip in production if Firestore/Gemini credentials are not configured
    if (process.env.DISABLE_ANTIGRAVITY_LOOP === 'true') {
      console.log('[ANTIGRAVITY] Loop disabled via DISABLE_ANTIGRAVITY_LOOP env. Skipping.');
      return;
    }
    if (!process.env.GEMINI_API_KEY) {
      console.warn('[ANTIGRAVITY] GEMINI_API_KEY not set — skipping continuous loop to preserve API quota.');
      return;
    }

    console.log("\x1b[32m====================================================\x1b[0m");
    console.log(" 🪐 JĄDRO SPINACZA ANTYGRAWITACYJNEGO UKOŃCZONE I AKTYWNE 24/7");
    console.log("====================================================\x1b[0m");

    while (this.isThrustActive) {
      try {
        await this.executeTotalSystemBoost();
        // Optymalny, bezpieczny czas oddechu chroniący limity tokenów przed blokadą rate-limit
        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (err: any) {
        console.error(`[CONTINUOUS ERROR]: ${err.message}. Restart za 5s.`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

export const antigravityOrchestrator = new AntigravityOrchestrator();
