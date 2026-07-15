import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebaseErrors';

/**
 * Autonomously monitors production lines with status 'COMPLETED'.
 * Triggers the Gemini API via server-side wrapper to:
 * 1. Analyze ZPulse market trends.
 * 2. Calculate optimal 'recommendedListingPrice'.
 * 3. Update status to 'LISTED' on both 'factories' and 'FactoryRegistry'.
 * 4. List product to internal marketplace.
 * 5. Append formatted log to SystemHealthMonitor.
 */
export function startAgentBrokerListener(userId: string, onUpdate?: () => void) {
  console.log(`[AgentBroker] Active real-time listener initialized for user: ${userId}`);

  const collectionsToListen = ["factories", "FactoryRegistry"];
  const unsubscribes: (() => void)[] = [];

  collectionsToListen.forEach((colName) => {
    try {
      const colRef = collection(db, colName);
      const q = query(colRef, where("userId", "==", userId), where("status", "==", "COMPLETED"));

      const unsub = onSnapshot(q, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added" || change.type === "modified") {
            const factoryDoc = change.doc;
            const factoryData = factoryDoc.data();
            
            // Filter to only match active completed stages not yet being processed by agent
            if (factoryData.status === "COMPLETED" && !factoryData.isProcessingBroker) {
              console.log(`[AgentBroker] Intercepted COMPLETED factory item in '${colName}' collection with ID: ${factoryDoc.id}`);
              
              try {
                // Instantly flag in client scope to block double-triggering
                try {
                  await updateDoc(doc(db, colName, factoryDoc.id), {
                    isProcessingBroker: true
                  });
                } catch (writeErr: any) {
                  handleFirestoreError(writeErr, 'write', `${colName}/${factoryDoc.id}`);
                }

                // Request pricing and listing generation via Gemini server-side wrapper
                const res = await fetch('/api/agent-broker/process-completed', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId,
                    factoryId: factoryDoc.id,
                    collectionName: colName,
                    factoryName: factoryData.factoryName,
                    currentProduct: factoryData.currentProduct || "Quantum Processing Module"
                  })
                });

                const data = await res.json();
                console.log(`[AgentBroker] Server proxy result:`, data);
                
                if (onUpdate) {
                  onUpdate();
                }
              } catch (e: any) {
                console.error(`[AgentBroker] Handler execution failure on item: ${factoryDoc.id}`, e.message);
              }
            }
          }
        });
      }, (error) => {
        console.error(`[AgentBroker] Collection ${colName} is currently offline or awaiting data seeding.`, error.message);
        handleFirestoreError(error, 'list', colName);
      });

      unsubscribes.push(unsub);
    } catch (err: any) {
      console.warn(`[AgentBroker] Could not subscribe to ${colName} stream.`, err.message);
    }
  });

  return () => {
    console.log(`[AgentBroker] Unregistering listener.`);
    unsubscribes.forEach((unsub) => unsub());
  };
}
