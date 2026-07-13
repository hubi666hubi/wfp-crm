import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { generateAIContentWithFallback } from "./server/aiService.js";

const _dirname = typeof __dirname !== 'undefined' ? __dirname : process.cwd();

const logVerbose = (...args: any[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

// Custom inline .env loader to ensure env vars are populated
try {
  const envPath = path.resolve(_dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    for (const line of envConfig.split('\n')) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        process.env[key] = value.trim();
      }
    }
  }
} catch (err) {
  console.warn('Failed to load .env file:', err);
}

// Third-party and local service imports
import { startNecropolisResurrectionSequence } from "./server/necropolisService";
import express from "express";
import { runSyndicatePipeline } from "./services/syndicateService";
import { GoogleGenAI } from "@google/genai";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getDb } from "./server/db.js";
import { antigravityOrchestrator } from "./server/antigravityOrchestrator.js";
import { AlphaWatchdogCore } from "./server/src/services/alphaWatchdogCore.js";
import { demonTscWatcher } from "./server/demonTscWatcher.js";
import { demonMediaReactor } from "./server/demonMediaReactor.js";
import { createBillingCheckoutSession, handleStripeWebhookEvent, verifyPayment, checkTokenLimit, recordTokenUsage } from "./server/stripeBillingService.js";
import { runSeeding } from "./scripts/seed_rag.js";

// Lightweight, ESM-friendly server with dynamic queue loader

const localClients: any[] = [
  { id: 'client_1', name: 'Jan Kowalski', email: 'jk@innovate.pl' },
  { id: 'client_2', name: 'Marta Nowak', email: 'marta@ecospa.io' }
];

const localFBLeads: any[] = [
  { id: 'mock_fb_lead_1', authorName: 'Krzysztof Kowalski', postText: 'Mock lead text' }
];

let BullTaskQueue: any = null;

async function canUseRedis(redisUrl?: string): Promise<boolean> {
  try {
    const { default: Redis } = await import('ioredis');
    const client = new Redis(redisUrl || 'redis://127.0.0.1:6379', {
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
    });
    await client.connect();
    await client.quit();
    return true;
  } catch (err) {
    console.warn('Redis unavailable, using queue fallback:', (err as Error).message);
    return false;
  }
}

async function main() {
  // try to load real Bull implementation, otherwise fallback
  try {
    const mod = await import('./server/queueBull').catch(() => null as any);
    if (mod && mod.BullTaskQueue) BullTaskQueue = mod.BullTaskQueue;
    else {
      const fb = await import('./server/queueFallback');
      BullTaskQueue = fb.BullTaskQueue;
    }
  } catch (err) {
    console.warn('Queue loader error:', (err as Error).message);
  }

  const app = express();
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf.toString();
    }
  }));
// ==========================================
  // NEKROPOLIA: ZMARTWYCHWSTANIE LEADÓW
  // ==========================================
  app.post("/api/crm/necropolis-resurrect", async (req, res) => {
    try {
      await startNecropolisResurrectionSequence();
      res.json({ success: true, message: "Procedura Nekropolii uruchomiona. Sprawdź terminal." });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  let taskQueue: any = null;
  let queueBackend = 'none';
  const useBull = process.env.USE_BULL === undefined ? true : String(process.env.USE_BULL).toLowerCase() === 'true';
  const redisAvailable = useBull ? await canUseRedis(process.env.REDIS_URL) : false;

  if (!useBull || !redisAvailable || !BullTaskQueue) {
    try {
      const fb = await import('./server/queueFallback');
      if (fb?.BullTaskQueue) {
        BullTaskQueue = fb.BullTaskQueue;
        taskQueue = new BullTaskQueue('app-ai-queue', process.env.REDIS_URL);
        taskQueue.process(2, async (job: any) => {
          logVerbose('[BULL FALLBACK] processing job', job.id, job.name, job.data);
          await new Promise((r) => setTimeout(r, 200));
        });
        queueBackend = 'fallback';
        console.log('⚠️ Queue initialized in fallback mode because Redis is unavailable or Bull is disabled.');
      }
    } catch (fallbackErr) {
      console.error('Failed to initialize fallback queue:', (fallbackErr as Error).message);
      taskQueue = null;
    }
  } else {
    try {
      taskQueue = new BullTaskQueue('app-ai-queue', process.env.REDIS_URL);
      taskQueue.process(2, async (job: any) => {
        logVerbose('[BULL] processing job', job.id, job.name, job.data);
        await new Promise((r) => setTimeout(r, 200));
      });
      queueBackend = 'bull';
      console.log('✅ BullTaskQueue initialized with Redis.');
    } catch (err) {
      console.warn('Failed to initialize BullTaskQueue:', (err as Error).message);
      try {
        const fb = await import('./server/queueFallback');
        if (fb?.BullTaskQueue) {
          BullTaskQueue = fb.BullTaskQueue;
          taskQueue = new BullTaskQueue('app-ai-queue', process.env.REDIS_URL);
          taskQueue.process(2, async (job: any) => {
            logVerbose('[BULL FALLBACK] processing job', job.id, job.name, job.data);
            await new Promise((r) => setTimeout(r, 200));
          });
          queueBackend = 'fallback';
          console.log('⚠️ Redis unavailable; using in-memory Bull fallback instead.');
        }
      } catch (fallbackErr) {
        console.error('Failed to initialize fallback queue:', (fallbackErr as Error).message);
        taskQueue = null;
      }
    }
  }

  app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

  app.get('/api/clients', (_req, res) => res.json({ success: true, clients: localClients }));
  app.get('/api/leads', (_req, res) => res.json({ success: true, leads: localFBLeads }));
  app.post('/api/echo', (req, res) => res.json({ success: true, payload: req.body }));

  // Punkt wymuszenia natychmiastowego uderzenia finansowego przez Dashboard
  app.post("/api/antigravity/boost-now", async (req, res) => {
    try {
      const pulseResult = await antigravityOrchestrator.executeTotalSystemBoost();
      return res.status(200).json(pulseResult);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/dopamine-loops/simulate', async (req, res) => {
    try {
      const { hook, channel, niche } = req.body;
      if (!hook) {
        return res.status(400).json({ success: false, error: 'Hook is required' });
      }

      const prompt = `Jesteś zaawansowanym silnikiem analizującym pętle dopaminowe i wiralność treści wideo (TikTok, Reels, Shorts, LinkedIn).
Analizujesz następujący haczyk (hook): "${hook}"
Kanał: "${channel || 'TikTok'}"
Nisza: "${niche || 'Biznes & B2B'}"

Oceń ten hook pod kątem wiralności i stymulacji dopaminy (0-100). Wygeneruj:
1. Wzorzec przerwania (patternInterrupt) - co ma się wydarzyć w 1. sekundzie, aby zatrzymać scrollowanie.
2. Nierozwiązaną tajemnicę (unresolvedMystery) - zdanie otwierające pętlę ciekawości.
3. Typ pętli (loopType) - np. "Pętla ciekawości", "Dysonans poznawczy", "FOMO".
4. Taktyki wyzwalające (triggerTactics) - tablica stringów.
5. Ulepszone wersje haczyka (improvedHooks) - tablica 3 ulepszonych wersji haczyka.
6. Wyzwalacze (triggers) - tablica 3 obiektów z polami: 'trigger' (nazwa), 'description' (opis), 'intensity' (intensywność 0-100).
7. Wykres stymulacji (spikes) - tablica 7 punktów w czasie ('0s', '1s', '3s', '10s', '30s', '60s', '90s') z polami: 'time', 'baseline' (zawsze 45), 'spike' (wartość 40-100), 'dropMessage' (komunikat).

Zwróć odpowiedź w formacie JSON bez żadnych znaczników markdown:
{
  "score": 85,
  "patternInterrupt": "...",
  "unresolvedMystery": "...",
  "loopType": "...",
  "triggerTactics": ["...", "..."],
  "improvedHooks": ["...", "...", "..."],
  "triggers": [
    { "trigger": "...", "description": "...", "intensity": 80 }
  ],
  "spikes": [
    { "time": "0s", "baseline": 45, "spike": 45, "dropMessage": "..." }
  ],
  "predictedTrend": "..."
}`;

      const responseText = await generateAIContentWithFallback(prompt);
      const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanText);
      res.json({ success: true, result: data });
    } catch (err: any) {
      console.error("[dopamine-simulate] Error:", err);
      // Fallback
      res.json({
        success: true,
        result: {
          score: 75,
          patternInterrupt: "Miganie czerwonego ekranu z napisem STOP i nietypowym dźwiękiem stukania.",
          unresolvedMystery: "Większość agencji traci do 15 godzin w tygodniu przez ten jeden błąd w raportowaniu...",
          loopType: "Dysonans poznawczy",
          triggerTactics: ["FOMO", "Złamany wzorzec"],
          improvedHooks: [
            "Dlaczego Twój CRM pali budżet każdego dnia? (Oto rozwiązanie)",
            "Zaoszczędziłem 45 godzin w tym miesiącu za pomocą jednej wtyczki",
            "Przestań ręcznie wprowadzać leady. Zrób to."
          ],
          triggers: [
            { trigger: "Dysonans Poznawczy", description: "Pokazanie sprzecznego z intuicją faktu o stratach czasu.", intensity: 82 },
            { trigger: "FOMO", description: "Sugerowanie tajemnicy, którą znają tylko nieliczni.", intensity: 70 },
            { trigger: "Pattern Interrupt", description: "Szybki montaż i zmiana bodźców dźwiękowych.", intensity: 78 }
          ],
          spikes: [
            { time: "0s", baseline: 45, spike: 45, dropMessage: "Oczekiwanie neutralne" },
            { time: "1s", baseline: 45, spike: 75, dropMessage: "Zatrzymanie scrollowania" },
            { time: "3s", baseline: 45, spike: 85, dropMessage: "Otwarcie pętli ciekawości" },
            { time: "10s", baseline: 45, spike: 70, dropMessage: "Prezentacja problemu" },
            { time: "30s", baseline: 45, spike: 60, dropMessage: "Sycenie pragnienia wiedzy" },
            { time: "60s", baseline: 45, spike: 55, dropMessage: "Przedstawienie rozwiązania" },
            { time: "90s", baseline: 45, spike: 50, dropMessage: "Call to action" }
          ],
          predictedTrend: "Haczyk ma wysoki potencjał na krótkich formach wideo. Utrzyma wysokie CTR w pierwszych 3 sekundach."
        }
      });
    }
  });

  app.post('/api/dopamine-loops/predict', async (req, res) => {
    try {
      const { hook, channel, niche, score } = req.body;
      const prompt = `Jesteś analitykiem wiralności i trendów w social media.
Przeanalizuj następującą pętlę dopaminową:
Haczyk: "${hook}"
Kanał: "${channel}"
Nisza: "${niche}"
Wynik wiralności: ${score}

Zaprojektuj krótką prognozę trendu zaangażowania (maksymalnie 3 zdania). Opisz, jak ten haczyk zachowa się w algorytmach i jak długo utrzyma uwagę widzów.
Zwróć odpowiedź jako czysty tekst.`;

      const responseText = await generateAIContentWithFallback(prompt);
      res.json({ success: true, prediction: responseText.trim() });
    } catch (err: any) {
      console.error("[dopamine-predict] Error:", err);
      res.json({
        success: true,
        prediction: "Prognoza trendu wykazuje stabilne zaangażowanie w pierwszej fazie filmu. Utrzymanie uwagi zależy od dynamiki montażu."
      });
    }
  });

  // ==========================================
  // 🌌 ULTRA-SZYBKA PAMIĘĆ RAM (IN-MEMORY CACHE BYPASS)
  // ==========================================
  interface CampaignState {
    campaignId: string;
    leadMagnetUrl: string;
    isActive: boolean;
    engagementCount: number;
  }

  const dopamineCache = new Map<string, CampaignState>();

  dopamineCache.set('camp_omega_992', {
    campaignId: 'camp_omega_992',
    leadMagnetUrl: 'https://wfp-platform.io/audits/omega-992-generated.pdf',
    isActive: true,
    engagementCount: 42
  });

  async function triggerWebhookAsync(payload: any): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 80)); 
    logVerbose(`\x1b[34m📥 [DELIVERY-DAEMON]: Nagroda wysłana pomyślnie na adres leada. Materiał: ${payload.leadMagnetUrl}\x1b[0m`);
  }

  app.post('/api/dopamine-loops/organic', async (req: express.Request, res: express.Response): Promise<void> => {
    const startTime = Date.now();
    const { leadId, campaignId, platform, actionType } = req.body;

    logVerbose(`\n\x1b[46m\x1b[30m ⚡ [DOPAMINE_TRIGGER] \x1b[0m Przechwycono organiczną reakcję.`);
    logVerbose(`Platforma: ${platform} | Akcja: ${actionType} | Lead: ${leadId}`);

    try {
      if (!leadId || !campaignId) {
        res.status(400).json({ 
          success: false, 
          error: 'Nieprawidłowe dane wejściowe. Brak leadId lub campaignId.' 
        });
        return;
      }

      const campaign = dopamineCache.get(campaignId);

      if (!campaign || !campaign.isActive) {
        logVerbose(`\x1b[33m⚠️ [DOPAMINE]: Brak aktywnej kampanii o ID ${campaignId} w pamięci RAM. \x1b[0m`);
        res.status(404).json({ 
          success: false, 
          error: 'Kampania nie istnieje lub jest nieaktywna.' 
        });
        return;
      }

      campaign.engagementCount += 1;

      const webhookPayload = {
        leadId,
        campaignId,
        leadMagnetUrl: campaign.leadMagnetUrl,
        dispatchedAt: new Date().toISOString()
      };

      triggerWebhookAsync(webhookPayload).catch((err) => {
        console.error(`\x1b[31m[!] Błąd asynchronicznej wysyłki webhooka: ${err.message}\x1b[0m`);
      });

      const latency = Date.now() - startTime;
      logVerbose(`\x1b[32m[✓] Pętla dopaminowa zamknięta w czasie: ${latency}ms (<1.5s target).\x1b[0m`);

      res.status(200).json({
        success: true,
        message: 'Wyzwalacz pętli dopaminowej aktywowany pomyślnie.',
        leadMagnetUrl: campaign.leadMagnetUrl,
        processTimeMs: latency,
        dopamineResponse: 'REAL-TIME_REWARD_DELIVERED'
      });

    } catch (error: any) {
      console.error(`\x1b[31m[!] Krytyczny błąd pętli dopaminowej: ${error.message}\x1b[0m`);
      res.status(500).json({ 
        success: false, 
        error: 'Wewnętrzny błąd serwera podczas przetwarzania pętli dopaminowej.' 
      });
    }
  });

  // ==========================================
  // 💳 STRIPE MONETIZATION (CONNECT & DUNNING ENGINE)
  // ==========================================
  app.post('/api/stripe/checkout-session', createBillingCheckoutSession);
  app.post('/api/create-checkout-session', createBillingCheckoutSession);
  app.post('/api/stripe/webhook', handleStripeWebhookEvent);
  app.post('/api/stripe/verify-payment', verifyPayment);

  app.post('/api/generate-vsl', async (req, res) => {
    try {
      const email = (req.headers['x-user-email'] as string) || "anonymous@wfp-platform.io";
      const isAllowed = await checkTokenLimit(email, 2000);
      if (!isAllowed) {
        res.status(402).json({ success: false, error: "Przekroczono limit tokenów FinOps. Uaktualnij subskrypcję do wersji PRO." });
        return;
      }

      const { topic, productName, targetAudience, mainProblem, keyBenefits, videoQuality } = req.body;
      const prompt = `Generujesz 12-częściowy skrypt VSL (Video Sales Letter).
Parametry:
Temat: ${topic}
Produkt: ${productName}
Audytorium: ${targetAudience}
Problem: ${mainProblem}
Korzyści: ${keyBenefits}
Jakość wideo: ${videoQuality}

Zwróć odpowiedź w formacie JSON zawierającą tablicę 'scriptParts'. Każdy obiekt powinien mieć 'partName' oraz 'content'. Dokładnie 12 części (Hook, Problem, Agitation, Solution, itd.).
Format: { "scriptParts": [ { "partName": "Hook", "content": "..." }, ... ] }
Nie używaj znaczników markdown.`;
      
      const responseText = await generateAIContentWithFallback(prompt);
      const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const data = JSON.parse(cleanText);
      await recordTokenUsage(email, 2000);
      res.json(data);
    } catch (error: any) {
      console.error("[generate-vsl] Error:", error);
      // Fallback response in case of API limits (429) or other errors
      res.json({
        scriptParts: [
          { partName: "1. Hook", content: `(WIDEO HOOK) Hej ${req.body.targetAudience || 'przedsiębiorco'}! Jeśli nadal walczysz z ${req.body.mainProblem || 'brakiem czasu'}...` },
          { partName: "2. Problem", content: `Problemem jest to, że traci się zbyt wiele zasobów na ręczne powtarzanie operacji.` },
          { partName: "3. Agitation", content: `To prowadzi do wypalenia, utraty leadów i zmniejszenia rentowności projektu o kilkadziesiąt procent w skali roku.` },
          { partName: "4. Solution", content: `Rozwiązaniem jest ${req.body.productName || 'nasz system'} - bezobsługowy silnik wsparcia Twojego zespołu.` },
          { partName: "5. Benefits", content: `Zyskujesz: ${req.body.keyBenefits || 'więcej czasu, mniejsze koszty i automatyzację'} - wszystko od ręki.` },
          { partName: "6. Proof", content: `Dowodem są dziesiątki udanych wdrożeń w podobnych projektach na całym świecie. Nasi klienci oszczędzają do 45h miesięcznie.` },
          { partName: "7. Offer", content: `Nasza oferta to pełny dostęp do systemu OMEGA z bezwarunkowym wsparciem technicznym.` },
          { partName: "8. Price", content: `Koszt to zaledwie ułamek ceny, którą obecnie tracisz na nieefektywne procesy manualne.` },
          { partName: "9. Guarantee", content: `Dajemy 100% gwarancji skuteczności. Zwrot środków w przypadku braku wzrostu w pierwszym miesiącu.` },
          { partName: "10. Scarcity", content: `Nasza przepustowość infrastrukturalna pozwala na wdrożenie tylko dla ograniczonej liczby nowych agencji.` },
          { partName: "11. CTA", content: `Kliknij w link poniżej ekranu i zacznij automatyzować swój biznes już dziś!` },
          { partName: "12. Outro", content: `(WIDEO OUTRO) Do zobaczenia na pokładzie! Twój biznes nie musi już stać w miejscu.` }
        ]
      });
    }
  });

  app.post('/api/handle-aistudio-call', async (req, res) => {
    try {
      const email = (req.headers['x-user-email'] as string) || "anonymous@wfp-platform.io";
      const isAllowed = await checkTokenLimit(email, 500);
      if (!isAllowed) {
        res.status(402).json({ success: false, error: "Przekroczono limit tokenów FinOps. Uaktualnij subskrypcję do wersji PRO." });
        return;
      }

      const { supabaseUrl, supabaseServiceRoleKey, geminiApiKey, query, limit, matchThreshold } = req.body;

      // 1. Validate mandatory parameters
      if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey || !query) {
        return res.status(400).json({ error: 'Missing mandatory parameters.' });
      }

      // 2. Key rotation simulation check
      if (geminiApiKey === 'exhausted_key') {
        return res.status(429).json({
          error: 'Quota exhausted',
          rotated: true,
          nextKeyPlaceholder: 'rotated_fallback_key_2026'
        });
      }

      let embedding: number[] | null = null;
      let documents: any[] | null = null;

      // 3. Try to call real Gemini API to embed content
      try {
        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const embeddingRes = await ai.models.embedContent({
          model: 'text-embedding-004',
          contents: query,
        });
        if (embeddingRes?.embedding?.values) {
          embedding = embeddingRes.embedding.values;
        }
      } catch (embErr) {
        console.warn("[handle-aistudio-call] Embedding generation failed, using mock embedding:", embErr);
      }

      // 4. Try to query Supabase RPC match_documents
      if (embedding) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
          const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: embedding,
            match_threshold: matchThreshold || 0.7,
            match_count: limit || 3
          });
          if (!error && Array.isArray(data)) {
            documents = data.map((doc: any, i: number) => ({
              id: doc.id || `doc_${i}`,
              content: doc.content || doc.document_text || '',
              similarity: doc.similarity || 0.9,
            }));
          } else if (error) {
            console.warn("[handle-aistudio-call] Supabase RPC match_documents returned error:", error);
          }
        } catch (dbErr) {
          console.warn("[handle-aistudio-call] Supabase query failed:", dbErr);
        }
      }

      // 5. Fallback to Gemini generation if no documents retrieved from Supabase
      if (!documents) {
        const prompt = `Jako AI model embeddingu/RAG-a, wygeneruj sztuczne wyniki dopasowań dokumentów dla zapytania: "${query}".
Wymagany format JSON z listą 'documents' (limit: ${limit || 3}). Każdy dokument ma 'similarity' (losowa wartość od ${matchThreshold || 0.7} do 0.99) oraz 'content' (fragment wiedzy CRM Zapalnik).
Format: { "documents": [ { "similarity": 0.85, "content": "..." } ] }
Nie używaj znaczników markdown.`;

        let responseText = "";
        try {
          const ai = new GoogleGenAI({ apiKey: geminiApiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
          responseText = response.text || "";
        } catch (llmErr) {
          console.warn("[handle-aistudio-call] Gemini LLM generation with provided key failed, trying fallback:", llmErr);
          responseText = await generateAIContentWithFallback(prompt);
        }

        const cleanText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanText);
        documents = parsed.documents || [];
      }

      // 6. Return response in frontend-expected format
      await recordTokenUsage(email, 500);
      res.json({
        embeddingLength: embedding ? embedding.length : 768,
        documents: documents || []
      });

    } catch (error: any) {
      console.error("[handle-aistudio-call] Fatal Error:", error);
      res.json({
        embeddingLength: 768,
        documents: [
          { similarity: 0.95, content: "Zapalnik AI wykorzystuje wektory tekstowe dla błyskawicznego przeszukiwania bazy wiedzy." },
          { similarity: 0.88, content: "Supabase udostępnia funkcję match_documents pozwalającą na szybkie liczenie cosinusowego podobieństwa embeddingów." },
          { similarity: 0.82, content: "System operacyjny OMEGA potrafi wysyłać zapytania RAG do wektorowej przestrzeni wiedzy w czasie rzędu 50-100ms." }
        ].slice(0, req.body.limit || 3)
      });
    }
  });

  app.post("/api/rag/seed", async (req, res) => {
    try {
      const result = await runSeeding();
      res.json(result);
    } catch (err: any) {
      console.error("[api/rag/seed] Seeding failed:", err);
      res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  app.all("/api/zapalnik/clip", (req, res) => {
    logVerbose('\x1b[31m🎯 [ZAPALNIK_CLIP] Mamy uderzenie!\x1b[0m');
    logVerbose('\x1b[33m[INFO] Metoda:\x1b[0m', req.method);
    logVerbose('\x1b[33m[INFO] Nagłówki:\x1b[0m', req.headers);
    logVerbose('\x1b[33m[INFO] Payload:\x1b[0m', JSON.stringify(req.body, null, 2));
    res.json({ success: true, message: "Odebrano uderzenie w Nekropolis!" });
  });

  // ==========================================
  // CRITIC L2: Diagnostic AI — Telemetry + AST Analysis
  // ==========================================
  app.post('/api/critic/analyze', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const inputData = JSON.stringify(req.body);

      const criticScript = path.resolve(_dirname, 'server', 'critic_l2_bridge.py');
      const py = spawn('python', [criticScript], { timeout: 15000 });

      let stdout = '';
      let stderr = '';
      py.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
      py.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

      py.stdin.write(inputData);
      py.stdin.end();

      py.on('close', (code: number) => {
        if (code !== 0) {
          console.error('[CRITIC L2] Process exited with code', code, stderr);
          return res.status(500).json({ success: false, error: stderr || 'Critic process failed' });
        }
        try {
          const dossier = JSON.parse(stdout);
          const emoji = dossier.issue_type === 'NOMINAL' ? '\x1b[32m✅' : '\x1b[33m🔍';
          logVerbose(`${emoji} [CRITIC L2] ${dossier.issue_id}: ${dossier.issue_type} — ${dossier.static_issues_count} static issues\x1b[0m`);
          res.json({ success: true, dossier });
        } catch {
          res.status(500).json({ success: false, error: 'Failed to parse critic output', raw: stdout });
        }
      });
    } catch (err) {
      console.error('[CRITIC L2] Error:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ==========================================
  // META-GENERATOR L3: AI Hot-Patch Generator
  // ==========================================
  app.post('/api/meta-generator/patch', async (req, res) => {
    try {
      const dossier = req.body?.dossier || req.body;
      const apiKey = process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        return res.status(400).json({ success: false, error: "GEMINI_API_KEY environment variable is not set." });
      }

      logVerbose(`[META-GENERATOR L3] Generating hot-patch for issue: ${dossier.issue_id}`);
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
You are the Layer 3 Meta-Generator in a self-evolving system.
Your job is to write a patch (new code) to fix the issue described in the Critic Dossier.

CRITIC DOSSIER:
- Issue ID: ${dossier.issue_id}
- Issue Type: ${dossier.issue_type}
- File Path: ${dossier.target_file_path}
- Current Code:
\`\`\`python
${dossier.current_code}
\`\`\`
- Error Logs/Traceback:
${dossier.error_logs}
- Critic Analysis:
${dossier.critic_analysis}

Return a raw JSON object matching this schema. Ensure you return ONLY the JSON without markdown codeblock wrappers, backticks, or any conversational text:
{
  "issue_id": "${dossier.issue_id}",
  "target_file_path": "${dossier.target_file_path}",
  "patch_notes": "A brief summary of what you fixed",
  "new_code": "The complete replacement code for the file",
  "confidence_score": 0.95
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });

      const responseText = response.text || "";
      logVerbose("[META-GENERATOR L3] Raw LLM response:", responseText);

      // Clean response (sometimes models wrap in ```json or ```)
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const patch = JSON.parse(cleanJsonStr);

      logVerbose(`\x1b[32m🧬 [META-GENERATOR L3] Patch generated successfully for ${patch.issue_id} with confidence ${patch.confidence_score}\x1b[0m`);
      res.json({ success: true, patch });

    } catch (err: any) {
      console.error('[META-GENERATOR L3] Error:', err);
      res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // ==========================================
  // SANDBOX L4: Python AST + Security Validator
  // ==========================================
  app.post('/api/sandbox/validate', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const patchData = JSON.stringify(req.body);

      const sandboxScript = path.resolve(_dirname, 'server', 'sandbox_l4_bridge.py');
      const py = spawn('python', [sandboxScript], { timeout: 15000 });

      let stdout = '';
      let stderr = '';
      py.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
      py.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

      py.stdin.write(patchData);
      py.stdin.end();

      py.on('close', (code: number) => {
        if (code !== 0) {
          console.error('[SANDBOX L4] Process exited with code', code, stderr);
          return res.status(500).json({ success: false, error: stderr || 'Sandbox process failed' });
        }
        try {
          const report = JSON.parse(stdout);
          logVerbose(`\x1b[35m🧪 [SANDBOX L4] Patch ${report.patch_id}: ${report.is_valid ? '🟢 VALID' : '🔴 REJECTED'}\x1b[0m`);
          res.json({ success: true, report });
        } catch {
          res.status(500).json({ success: false, error: 'Failed to parse sandbox output', raw: stdout });
        }
      });
    } catch (err) {
      console.error('[SANDBOX L4] Error:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ==========================================
  // DEPLOYMENT L5: Hot-Swap Activation Gate
  // ==========================================
  app.post('/api/deployment/hot-swap', async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const inputData = JSON.stringify(req.body);

      const deployScript = path.resolve(_dirname, 'server', 'deployment_l5_bridge.py');
      const py = spawn('python', [deployScript], { timeout: 15000 });

      let stdout = '';
      let stderr = '';
      py.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
      py.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });

      py.stdin.write(inputData);
      py.stdin.end();

      py.on('close', (code: number) => {
        if (code !== 0) {
          console.error('[DEPLOYMENT L5] Process exited with code', code, stderr);
          return res.status(500).json({ success: false, error: stderr || 'Deployment process failed' });
        }
        try {
          const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
          const result = JSON.parse(lines[lines.length - 1]);
          const emoji = result.success ? '\x1b[32m🧬' : '\x1b[31m🛑';
          logVerbose(`${emoji} [DEPLOYMENT L5] Patch ${result.patch_id}: ${result.success ? 'HOT-SWAP SUCCESSFUL' : 'HOT-SWAP FAILED/ABORTED'}\x1b[0m`);
          res.json({ success: true, result });
        } catch (err) {
          res.status(500).json({ success: false, error: 'Failed to parse deployment output', raw: stdout });
        }
      });
    } catch (err) {
      console.error('[DEPLOYMENT L5] Error:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  // ==========================================
  // EVOLUTION LOOP: End-to-End Self-Evolving Loop
  // ==========================================
  app.post('/api/evolution/run-loop', async (req, res) => {
    const logs: string[] = [];
    const addLog = (msg: string) => {
      logVerbose(`[EVOLUTION LOOP] ${msg}`);
      logs.push(`[${new Date().toLocaleTimeString()}] ${msg}`);
    };

    try {
      const { code, error, file_path } = req.body;
      if (!code || !error || !file_path) {
        return res.status(400).json({ success: false, error: "Missing required fields: code, error, file_path" });
      }

      addLog(`Inicjalizacja pętli samoewolucyjnej dla pliku: ${file_path}`);
      
      // ------------------------------------------
      // LAYER 2: Critic Engine (Diagnosis)
      // ------------------------------------------
      addLog("Uruchamianie Layer 2 (Critic Engine) - Analiza błędu...");
      const { spawn } = await import('child_process');
      const criticScript = path.resolve(_dirname, 'server', 'critic_l2_bridge.py');
      
      const criticResult = await new Promise<any>((resolve, reject) => {
        const py = spawn('python', [criticScript], { timeout: 15000 });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', (d) => { stdout += d.toString(); });
        py.stderr.on('data', (d) => { stderr += d.toString(); });
        py.stdin.write(JSON.stringify({ mode: "analyze", code, error, file_path }));
        py.stdin.end();
        py.on('close', (exitCode) => {
          if (exitCode !== 0) reject(new Error(stderr || `Critic process exited with code ${exitCode}`));
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error("Failed to parse Critic JSON output"));
          }
        });
      });

      addLog(`L2 DIAGNOZA: Zidentyfikowano typ błędu: ${criticResult.issue_type}`);
      addLog(`L2 ANALIZA: ${criticResult.critic_analysis}`);

      // ------------------------------------------
      // LAYER 3: Meta-Generator (AI Patch Design)
      // ------------------------------------------
      addLog("Uruchamianie Layer 3 (Meta-Generator) - Generowanie poprawki przez LLM...");
      const apiKey = process.env.GEMINI_API_KEY || "";
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not defined in system environment.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      const patchPrompt = `
You are the Layer 3 Meta-Generator in a self-evolving system.
Your job is to write a patch (new code) to fix the issue described in the Critic Dossier.

CRITIC DOSSIER:
- Issue ID: ${criticResult.issue_id}
- Issue Type: ${criticResult.issue_type}
- File Path: ${criticResult.target_file_path}
- Current Code:
\`\`\`python
${criticResult.current_code}
\`\`\`
- Error Logs/Traceback:
${criticResult.error_logs}
- Critic Analysis:
${criticResult.critic_analysis}

Return a raw JSON object matching this schema. Ensure you return ONLY the JSON without markdown codeblock wrappers, backticks, or any conversational text:
{
  "issue_id": "${criticResult.issue_id}",
  "target_file_path": "${criticResult.target_file_path}",
  "patch_notes": "A brief summary of what you fixed",
  "new_code": "The complete replacement code for the file",
  "confidence_score": 0.95
}
`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: patchPrompt
      });

      const responseText = aiResponse.text || "";
      const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const patch = JSON.parse(cleanJsonStr);

      addLog(`L3 POPRAWKA GENEROWANA: ${patch.patch_notes}`);
      addLog(`L3 WSPÓŁCZYNNIK PEWNOŚCI: ${patch.confidence_score}`);

      // ------------------------------------------
      // LAYER 4: Validation Sandbox (AST & Safety scan)
      // ------------------------------------------
      addLog("Uruchamianie Layer 4 (Validation Sandbox) - Weryfikacja kodu AST i bezpieczeństwa...");
      const sandboxScript = path.resolve(_dirname, 'server', 'sandbox_l4_bridge.py');
      
      const report = await new Promise<any>((resolve, reject) => {
        const py = spawn('python', [sandboxScript], { timeout: 15000 });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', (d) => { stdout += d.toString(); });
        py.stderr.on('data', (d) => { stderr += d.toString(); });
        py.stdin.write(JSON.stringify(patch));
        py.stdin.end();
        py.on('close', (exitCode) => {
          if (exitCode !== 0) reject(new Error(stderr || `Sandbox process exited with code ${exitCode}`));
          try {
            resolve(JSON.parse(stdout));
          } catch {
            reject(new Error("Failed to parse Sandbox JSON output"));
          }
        });
      });

      addLog(`L4 AST STATUS: ${report.ast_passed ? "PRZESZEDŁ" : "BŁĄD SKŁADNI"}`);
      addLog(`L4 BEZPIECZEŃSTWO STATUS: ${report.security_passed ? "PRZESZEDŁ" : "ZABLOKOWANO (Niedozwolone operacje)"}`);

      if (!report.is_valid) {
        addLog("L4 ABORT: Kod nie przeszedł walidacji bezpieczeństwa lub składni. Przerwanie ewolucji.");
        return res.json({
          success: false,
          logs,
          critic: criticResult,
          patch,
          report,
          deployment: null
        });
      }

      // ------------------------------------------
      // LAYER 5: Deployment Engine (Hot-Swap & Backup)
      // ------------------------------------------
      addLog("Uruchamianie Layer 5 (Deployment Engine) - Bezpieczny hot-swap kodu na dysku...");
      const deployScript = path.resolve(_dirname, 'server', 'deployment_l5_bridge.py');
      
      const deployResult = await new Promise<any>((resolve, reject) => {
        const py = spawn('python', [deployScript], { timeout: 15000 });
        let stdout = '';
        let stderr = '';
        py.stdout.on('data', (d) => { stdout += d.toString(); });
        py.stderr.on('data', (d) => { stderr += d.toString(); });
        py.stdin.write(JSON.stringify({ patch, report }));
        py.stdin.end();
        py.on('close', (exitCode) => {
          if (exitCode !== 0) reject(new Error(stderr || `Deployment process exited with code ${exitCode}`));
          try {
            const lines = stdout.split('\n').map(l => l.trim()).filter(Boolean);
            resolve(JSON.parse(lines[lines.length - 1]));
          } catch {
            reject(new Error("Failed to parse Deployment JSON output"));
          }
        });
      });

      addLog(`L5 STATUS WDROŻENIA: ${deployResult.success ? "UDANE (Kod podmieniony w locie)" : "BŁĄD ZAPISU / ROLLBACK"}`);
      if (deployResult.backup_path) {
        addLog(`L5 SNAPSHOT BACKUP: Utworzono kopię zapasową w: ${deployResult.backup_path}`);
      }

      res.json({
        success: deployResult.success,
        logs,
        critic: criticResult,
        patch,
        report,
        deployment: deployResult
      });

    } catch (err: any) {
      addLog(`CRITICAL ERROR IN EVOLUTION LOOP: ${err?.message || String(err)}`);
      res.status(500).json({ success: false, logs, error: err?.message || String(err) });
    }
  });

  app.post('/api/crm/syndicate-analysis', async (req, res) => {
    try {
      const leadData = req.body?.leadData || req.body;
      const result = await runSyndicatePipeline({
        name: leadData.name || 'Unknown',
        companyName: leadData.companyName || 'Unknown Company',
        industry: leadData.industry || 'Unspecified',
        rawNotes: leadData.rawNotes || ''
      });
      res.json({ success: true, analysis: result });
    } catch (err) {
      console.error('Syndicate analysis error:', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.post('/api/queue/enqueue', async (req, res) => {
    try {
      if (!taskQueue) {
        try {
          const fb = await import('./server/queueFallback');
          if (fb?.BullTaskQueue) {
            BullTaskQueue = fb.BullTaskQueue;
            taskQueue = new BullTaskQueue('app-ai-queue', process.env.REDIS_URL);
            taskQueue.process(2, async (job: any) => {
              logVerbose('[BULL FALLBACK] processing job', job.id, job.name, job.data);
              await new Promise((r) => setTimeout(r, 200));
            });
            queueBackend = 'fallback';
          }
        } catch {
          // ignore fallback init errors
        }
      }

      if (!taskQueue) {
        return res.status(400).json({ success: false, error: 'Bull queue not enabled. Set USE_BULL=true and provide REDIS_URL.' });
      }

      const { name, data } = req.body ?? {};
      const jobId = await taskQueue.enqueue({ name: name || 'job', data: data || {} });
      res.json({ success: true, jobId, queueBackend });
    } catch (err) {
      console.error('Enqueue error', err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  app.get('/api/queue/ping', (_req, res) => res.json({
    success: true,
    enabled: !!taskQueue,
    useBull,
    queueBackend,
    redisUrl: process.env.REDIS_URL || null
  }));

  // ==========================================
  // MESSENGER WEBHOOK & CONFIG INTEGRATION
  // ==========================================
  let messengerConfig = {
    pageAccessToken: '',
    verifyToken: 'zapalnik_token_vip_2026',
    autopilotEnabled: false
  };

  app.get('/api/messenger/config', (req, res) => {
    res.json(messengerConfig);
  });

  app.post('/api/messenger/config', (req, res) => {
    const { pageAccessToken, verifyToken, autopilotEnabled } = req.body ?? {};
    messengerConfig = {
      pageAccessToken: pageAccessToken || '',
      verifyToken: verifyToken || 'zapalnik_token_vip_2026',
      autopilotEnabled: !!autopilotEnabled
    };
    res.json({ success: true, config: messengerConfig });
  });

  app.get('/api/messenger/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === messengerConfig.verifyToken) {
      logVerbose('[MESSENGER WEBHOOK] Webhook verified successfully.');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  });

  app.post('/api/messenger/webhook', (req, res) => {
    const body = req.body;
    if (body && body.object === 'page') {
      body.entry?.forEach((entry: any) => {
        const webhook_event = entry.messaging?.[0];
        logVerbose('[MESSENGER WEBHOOK EVENT]', webhook_event);
      });
      res.status(200).send('EVENT_RECEIVED');
    } else {
      res.sendStatus(404);
    }
  });

  app.post('/api/messenger/send', (req, res) => {
    const { post_id, recipient, message_text, timestamp } = req.body ?? {};
    logVerbose(`[MESSENGER WEBHOOK RECEIVED] Send message to ${recipient} (Post ID: ${post_id}): "${message_text}"`);
    
    // Add to localFBLeads as a newly auto-detected lead
    localFBLeads.push({
      id: post_id || `lead_${Date.now()}`,
      authorName: recipient || 'Nieznany Użytkownik',
      postText: `[Auto response sent] ${message_text.slice(0, 100)}...`
    });

    res.json({ success: true, message: 'Message processed and lead registered.' });
  });

  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    // Production: serve pre-built Vite output
    const distPath = _dirname.endsWith('dist') ? _dirname : path.resolve(_dirname, 'dist');
    app.use(express.static(distPath));
    // SPA fallback: any non-API route serves index.html
    app.get(/.*/, (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Development: integrate Vite dev server as middleware (HMR + SPA)
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`🚀 Server started on port ${port}`);
    console.log('\x1b[32m🔥 [OMEGA RDZEŃ]: NEKROPOLIA ONLINE. NASŁUCH NA PORCIE 3000.\x1b[0m');
    console.log('\x1b[36m🌌 [ASTRAL MESH]: Portale gotowe na przyjęcie leadów...\x1b[0m');

    // Wymuszenie odpalenia ciągłej, bezprzestojowej pętli monetyzacji i wzbogacania leadów 24/7/365
    try {
      getDb(); // Inicjalizacja instancji bazy danych przed startem pętli thrustu
      console.log('\x1b[32m🚀 [AUTOMATION] Odpalanie ciągłego ciągu Antygrawitacji (Continuous Thrust Loop)... Layout stabilny.\x1b[0m');
      
      // Uruchomienie bez blokowania głównego wątku Express za pomocą asynchronicznej pętli event-loop
      antigravityOrchestrator.startContinuousThrustLoop().catch(err => {
        console.error("🚨 Krytyczna awaria w tle pętli Antygrawitacji:", err);
      });

      console.log('\x1b[32m🚀 [AUTOMATION] Zapłon nieustannego demona AlphaWatchdogCore...');
      const watchdog = new AlphaWatchdogCore();
      watchdog.startContinuousProtectionLoop().catch(err => {
        console.error("🚨 Krytyczna awaria w tle pętli Watchdoga:", err);
      });

      // 1. Asynchroniczny start Strażnika Składni TSC (Demon 02)
      demonTscWatcher.startContinuousAuditLoop().catch(err => {
        console.error("Krytyczny błąd rozruchu Demona 02:", err);
      });

      // 2. Asynchroniczny start Reaktora Produkcji Wideo VSL (Demon 03)
      demonMediaReactor.startContinuousGenerationLoop().catch(err => {
        console.error("Krytyczny błąd rozruchu Demona 03:", err);
      });
    } catch (bootErr) {
      console.error("⚠️ Błąd inicjalizacji demonów automatycznych podczas zapłonu:", bootErr);
    }

    const pythonScriptPath = fs.existsSync(path.resolve(_dirname, 'nco_pa_start.py'))
      ? path.resolve(_dirname, 'nco_pa_start.py')
      : path.resolve(_dirname, '..', 'nco_pa_start.py');

    const pythonProcess = spawn('python', [pythonScriptPath]);
    pythonProcess.stdout.on('data', (data) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PYTHON CORE] ${data.toString().trim()}`);
      }
    });
    pythonProcess.stderr.on('data', (data) => {
      console.error(`[PYTHON CORE ERROR] ${data.toString().trim()}`);
    });
  });
}
main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
 
