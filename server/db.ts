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
      // Build credential: prefer service account JSON (base64) → ADC → no credential (emulator/demo)
      let credential: any = undefined;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        try {
          const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8');
          const serviceAccount = JSON.parse(decoded);
          credential = admin.credential.cert(serviceAccount);
          console.log('[DB] Firebase Admin: using service account from FIREBASE_SERVICE_ACCOUNT_BASE64');
        } catch (e: any) {
          console.warn('[DB] Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64:', e?.message);
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        // ADC via file path — will work locally with gcloud auth
        credential = admin.credential.applicationDefault();
        console.log('[DB] Firebase Admin: using GOOGLE_APPLICATION_CREDENTIALS');
      } else {
        console.warn('[DB] No Firebase credentials found. Firestore calls will fail. Set FIREBASE_SERVICE_ACCOUNT_BASE64 on Render.');
      }

      const initOptions: any = {
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || configProjectId || "gen-lang-client-0036518667"
      };
      if (credential) {
        initOptions.credential = credential;
      }

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
