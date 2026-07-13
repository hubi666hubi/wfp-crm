// server/necropolisService.ts
// [SYSTEM OVERRIDE: OMEGA PRO V2+ | NECROMANCY ACTIVE]

import { getDb } from './db'; 
import { generateAIContentWithFallback } from './aiService';

export async function startNecropolisResurrectionSequence() {
    console.log(`[NECROPOLIS] Skan krypt...`);
    const db = getDb();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    try {
        // Skan krypt - Finding 'Dead' Leads (Rejected, No Contact)
        const deadLeadsQuery = db.collection('leads')
            .where('status', 'in', ['Rejected', 'No Contact', 'BabylonInactive']);

        const leadsSnapshot = await deadLeadsQuery.get();
        
        // Filter in memory for lastContact < thirtyDaysAgo or missing lastContact
        const deadLeads = leadsSnapshot.docs.filter(doc => {
            const data = doc.data();
            if (!data.lastContact) return true; // Treat as dead if no contact date exists
            const lastContactDate = data.lastContact.toDate ? data.lastContact.toDate() : new Date(data.lastContact);
            return lastContactDate < thirtyDaysAgo;
        });

        console.log(`[NECROPOLIS] Znaleziono ${deadLeads.length} martwych leadów.`);

        let count = 0;
        for (const docRef of deadLeads) {
            const leadData = docRef.data();

            console.log(`[NECROPOLIS] Alchemia aktywna [${++count}/${deadLeads.length}]. Generowanie Szoku Poznawczego dla: ${leadData.companyName || leadData.name}`);

            // negative Reverse Selling Protocol [Cloak of Undead King].
            // Tone: Toxic, relentless logic.
            const spellPrompt = `
                Neg Reverse Selling Protocol [Cloak of Undead King].
                Input Analysis (Leads History): ${leadData.rejectionReason || 'Unknown Inactivity'}.
                Generate 'Resurrection Spell' (Cold Email).
                Message: "Zamilkłeś, więc zakładam, że zrezygnowałeś z optymalizacji i wolisz tonąć w ręcznej pracy. Zamykam Twój plik i archiwizuję projekt. Chyba, że wciąż zależy Ci na uwolnieniu 20 godzin tygodniowo? Mój system właśnie zwolnił jeden slot."
            `;

            try {
                // Generate AI output using fallback chain
                const aiResponse = await generateAIContentWithFallback(spellPrompt);
                console.log(`[NECROPOLIS] ZMARTWYCHWSTAŁY: ${leadData.companyName || leadData.name} | Status: Oczekiwanie na konwersję`);

                // Update database status to mark reanimation
                await db.collection('leads').doc(docRef.id).update({
                    status: 'NecropolisActive',
                    necromancyTriggered: true,
                    lastNecromancyAttempt: new Date(),
                    resurrectionSpell: aiResponse
                });

            } catch (error: any) {
                console.log(`\x1b[31m[NECROPOLIS] Błąd alchemii dla ${leadData.companyName || leadData.name}: ${error?.message || error}\x1b[0m`);
            }
        }
    } catch (e: any) {
        console.error(`[NECROPOLIS] Fatal error in sequence:`, e?.message || e);
    }
}
