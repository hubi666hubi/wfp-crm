import { wfpOmegaGenkitCore } from "./wfpOmegaGenkitCore.js";
import { getDb } from "./db.js";
import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";

class DemonMediaReactor {
  private isReactorActive: boolean = true;

  constructor() {
    console.log("\x1b[32m[DEMON 03 - MEDIA REACTOR] 🛸 Kombajn autonomicznej produkcji wideo VSL uruchomiony.\x1b[0m");
  }

  public async startContinuousGenerationLoop(): Promise<void> {
    const db = getDb();

    while (this.isReactorActive) {
      try {
        // Skanowanie bazy pod kątem oczekujących zadań generowania awatarów
        const tasksSnapshot = await db.collection("tasks")
          .where("status", "==", 0) // Pobieranie zadań w stanie generowania
          .limit(1)
          .get();

        if (!tasksSnapshot.empty) {
          const taskDoc = tasksSnapshot.docs[0];
          const taskData = taskDoc.data();

          console.log(`[MEDIA REACTOR] Wykryto oczekujące zadanie: ${taskDoc.id}. Inicjalizacja...`);

          // Uruchomienie pełnego potoku i wdrożenie wideo VSL
          await wfpOmegaGenkitCore.processAgentWorkerTask({
            leadId: taskData.leadId || "lead_test_uuid",
            companyName: taskData.companyName || "Hubix Matrix Inc",
            detectedPain: taskData.detectedPain || "Niska konwersja koszyka i brak automatyzacji",
            userEmail: "hubi666hubi@gmail.com"
          });

          console.log(`🟢 [MEDIA REACTOR SUCCESS] Zadanie ${taskDoc.id} zrealizowane pomyślnie.`);
        }

        // Taktowanie odpytywania kolejki zadań (co 15 sekund)
        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (err: any) {
        console.error("🚨 Krytyczny błąd w pętli demona produkcji mediów:", err.message);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

export const demonMediaReactor = new DemonMediaReactor();
