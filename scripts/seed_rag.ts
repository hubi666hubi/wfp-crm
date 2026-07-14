import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environmental variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

// High converting sales, marketing and prospecting knowledge seed documents
const SEED_DOCUMENTS = [
  {
    content: "SOP: Struktura VSL (Video Sales Letter) o Wysokiej Konwersji. Część 1: Hak (Hook) - Pierwsze 15-30 sekund. Zadaniem haka jest natychmiastowe zidentyfikowanie głównego bólu klienta i zaoferowanie asymetrycznej korzyści. Unikaj nudnego przywitania typu 'Cześć, nazywam się...'. Zamiast tego uderz bezpośrednio w problem: 'Marnujesz godziny na pozyskiwanie leadów, podczas gdy Twoi konkurenci automatyzują ten proces za ułamek ceny?'",
    category: "vsl_structure",
    topic: "Hook Section"
  },
  {
    content: "SOP: Struktura VSL (Video Sales Letter) o Wysokiej Konwersji. Część 2: Agitacja i Problem. Pokaż głębokie zrozumienie frustracji klienta. Opisz koszty alternatywne - tracone godziny, nieodpisane maile, wypalenie handlowców. Twój cel to sprawić, aby klient pomyślał: 'Ten człowiek dokładnie rozumie moją sytuację'.",
    category: "vsl_structure",
    topic: "Problem Agitation"
  },
  {
    content: "SOP: Struktura VSL (Video Sales Letter) o Wysokiej Konwersji. Część 3: Wprowadzenie Rozwiązania. Przedstaw swój produkt (np. System Konwersji Omega PRO) jako jedyną logiczną drogę wyjścia z problemu. Pokaż transformację stanu: z chaosu i ręcznego prospectingu do pełnej automatyzacji i stałego napływu kwalifikowanych klientów.",
    category: "vsl_structure",
    topic: "Solution Reveal"
  },
  {
    content: "SZABLON ZIMNEGO MAILA B2B (Cold Email Framework): Temat: Szybkie pytanie o proces prospectingowy w {{companyName}}. Treść: Cześć {{name}}, zauważyłem że Wasz zespół w {{companyName}} aktywnie skaluje działania marketingowe. Analizując Wasz profil, przygotowałem krótki, 2-minutowy brief wideo pokazujący jak możecie zautomatyzować kwalifikację leadów o 40% za pomocą Gemini AI. Czy mogę przesłać link do wideo? Pozdrawiam, {{senderName}}.",
    category: "cold_outreach",
    topic: "Cold Email Template"
  },
  {
    content: "OBSŁUGA OBIEKCJI: 'Brak czasu na wdrożenie'. Riposta handlowca: 'Doskonale to rozumiem, dlatego nasz system konfiguruje się w niecałe 4 minuty. Przejmujemy całą dystrybucję wideo i integracje z CRM, dzięki czemu oszczędzasz czas od pierwszego dnia roboczego.'",
    category: "objection_handling",
    topic: "No Time Objection"
  },
  {
    content: "OBSŁUGA OBIEKCJI: 'To jest za drogie'. Riposta handlowca: 'Rozumiem, że patrzysz na koszt. Spójrzmy jednak na zwrot z inwestycji (ROI). Jeden pozyskany klient pokrywa koszt subskrypcji na 12 miesięcy, a system pracuje 24/7 generując dziesiątki takich szans miesięcznie.'",
    category: "objection_handling",
    topic: "Too Expensive Objection"
  },
  {
    content: "SOP: Strategia Zapalnika CRM (Zapalnik Lead Magnet Strategy). Używaj spersonalizowanych Pitch-Cardów i spersonalizowanych analiz wideo. Kiedy system wykryje gorący trend (np. w radarze trendów Pro), natychmiast wygeneruj ofertę opartą na tym trendzie i wyślij ją przez zautomatyzowaną sekwencję maili lub wiadomości LinkedIn.",
    category: "crm_strategy",
    topic: "Zapalnik Flow"
  }
];

export async function runSeeding() {
  if (!supabaseUrl || !supabaseServiceRoleKey || !geminiApiKey) {
    console.error("[RAG SEEDER] Error: Missing environment credentials in .env file (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY).");
    return { success: false, error: "Missing environment credentials" };
  }

  console.log(`[RAG SEEDER] Initializing seeder. Preparing to embed ${SEED_DOCUMENTS.length} documents...`);
  
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  let insertedCount = 0;

  for (const doc of SEED_DOCUMENTS) {
    try {
      console.log(`[RAG SEEDER] Generating embedding for: "${doc.topic}"...`);
      const embeddingRes = await ai.models.embedContent({
        model: 'text-embedding-004',
        contents: doc.content,
      });

      if (embeddingRes?.embedding?.values) {
        const embedding = embeddingRes.embedding.values;
        
        const { error } = await supabase.from('documents').insert({
          content: doc.content,
          embedding,
          metadata: {
            category: doc.category,
            topic: doc.topic,
            source: 'system_seed'
          }
        });

        if (error) {
          console.error(`[RAG SEEDER] Supabase insert failed for "${doc.topic}":`, error.message);
        } else {
          console.log(`[RAG SEEDER] Successfully seeded "${doc.topic}" into Supabase.`);
          insertedCount++;
        }
      } else {
        console.error(`[RAG SEEDER] Failed to get embedding values for "${doc.topic}".`);
      }
    } catch (err: any) {
      console.error(`[RAG SEEDER] Error seeding "${doc.topic}":`, err.message || err);
    }
  }

  console.log(`[RAG SEEDER] Finished. Successfully seeded ${insertedCount}/${SEED_DOCUMENTS.length} documents.`);
  return { success: true, seeded: insertedCount, total: SEED_DOCUMENTS.length };
}


// NOTE: CLI runner removed — in esbuild CJS bundles, require.main === module is always true,
// causing process.exit(1) to kill the server. Run this script standalone if needed:
// npx tsx scripts/seed_rag.ts
