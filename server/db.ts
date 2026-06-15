import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

export function getDb(): admin.firestore.Firestore {
  let dbId: string | undefined;
  let configProjectId: string | undefined;
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    const configStr = fs.readFileSync(configPath, 'utf8');
    const configData = JSON.parse(configStr);
    if (configData.firestoreDatabaseId) {
      dbId = configData.firestoreDatabaseId;
    }
    if (configData.projectId) {
      configProjectId = configData.projectId;
    }
  } catch {
    // Ignore
  }

  const firebaseAdmin: any = (admin as any).initializeApp ? admin : ((admin as any).default || admin);
  const apps = firebaseAdmin?.apps || admin?.apps || [];
  if (!apps.length) {
    try {
      const initOptions = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || configProjectId || "demo-project"
      };
      if (firebaseAdmin && typeof firebaseAdmin.initializeApp === "function") {
        firebaseAdmin.initializeApp(initOptions);
      } else if (admin && typeof admin.initializeApp === "function") {
        admin.initializeApp(initOptions);
      }
    } catch (e: any) {
      console.warn("Failed to initialize firebase-admin:", e?.message || String(e));
    }
  }
  
  const app = (firebaseAdmin && typeof firebaseAdmin.app === "function") ? firebaseAdmin.app() : admin.app();
  return dbId ? getFirestore(app, dbId) : getFirestore(app);
}
