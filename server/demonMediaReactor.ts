import { wfpOmegaGenkitCore } from "./wfpOmegaGenkitCore.js";
import { getDb } from "./db.js";
import { stripeKombajnDistributor } from "./stripeKombajnDistributor.js";

class DemonMediaReactor {
  private isReactorActive: boolean = true;

  constructor() {
    console.log("\x1b[32m[DEMON 03 - MEDIA REACTOR] Kombajn autonomicznej produkcji wideo VSL uruchomiony.\x1b[0m");
  }

  public async startContinuousGenerationLoop(): Promise<void> {
    // Production guard
    if (process.env.DISABLE_MEDIA_REACTOR === 'true') {
      console.log('[DEMON 03 - MEDIA REACTOR] Loop disabled via DISABLE_MEDIA_REACTOR=true. Skipping.');
      return;
    }

    // Require Firebase credentials before starting the polling loop
    const hasFirebaseCreds = !!(
      process.env.FIREBASE_SERVICE_ACCOUNT_BASE64 ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS
    );
    if (!hasFirebaseCreds) {
      console.warn('[DEMON 03 - MEDIA REACTOR] No Firebase credentials. Loop disabled. Set FIREBASE_SERVICE_ACCOUNT_BASE64 on Render.');
      return;
    }

    const db = getDb();
    let consecutiveErrors = 0;

    while (this.isReactorActive) {
      try {
        const tasksSnapshot = await db.collection('tasks')
          .where('status', '==', 0)
          .limit(1)
          .get();

        consecutiveErrors = 0;

        if (!tasksSnapshot.empty) {
          const taskDoc = tasksSnapshot.docs[0];
          const taskData = taskDoc.data();
          console.log([MEDIA REACTOR] Zadanie: );
          await wfpOmegaGenkitCore.processAgentWorkerTask({
            leadId: taskData.leadId || 'lead_test_uuid',
            companyName: taskData.companyName || 'Hubix Matrix Inc',
            detectedPain: taskData.detectedPain || 'Niska konwersja',
            userEmail: 'hubi666hubi@gmail.com'
          });
          console.log([MEDIA REACTOR SUCCESS] Zadanie  zrealizowane.);
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
      } catch (err: any) {
        consecutiveErrors++;
        const isAuthError = err?.message?.includes('credentials') ||
          err?.message?.includes('auth') ||
          err?.code === 16;

        if (isAuthError && consecutiveErrors >= 3) {
          console.warn('[DEMON 03 - MEDIA REACTOR] Firebase auth failed 3x. Loop stopped.');
          this.isReactorActive = false;
          return;
        }

        const backoffMs = Math.min(5000 * Math.pow(2, consecutiveErrors - 1), 60000);
        console.error([MEDIA REACTOR ERROR] (x)  retry in s);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }
}

export const demonMediaReactor = new DemonMediaReactor();
