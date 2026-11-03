import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';

import appletConfig from '../../firebase-applet-config.json';

// Base configuration from auto-provisioned firebase-applet-config.json
const firebaseConfig: Record<string, string> = {
  projectId: appletConfig.projectId || 'dworld-d1a1e',
  appId: appletConfig.appId || '1:1017090648265:web:929390116fa1a1cacd4518',
  apiKey: appletConfig.apiKey || 'AIzaSyD7avu2JLY2GhQRvSsmyuk0tY1uzb776YE',
  authDomain: appletConfig.authDomain || 'dworld-d1a1e.firebaseapp.com',
  firestoreDatabaseId: appletConfig.firestoreDatabaseId || '(default)',
  storageBucket: appletConfig.storageBucket || 'dworld-d1a1e.firebasestorage.app',
  messagingSenderId: appletConfig.messagingSenderId || '1017090648265',
};

// Allow runtime environment variables (optional overrides for Vercel / custom deployments)
if (typeof import.meta !== 'undefined' && import.meta.env) {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    firebaseConfig.apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  }
  if (import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    firebaseConfig.projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  }
  if (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
    firebaseConfig.authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  }
  if (import.meta.env.VITE_FIREBASE_APP_ID) {
    firebaseConfig.appId = import.meta.env.VITE_FIREBASE_APP_ID;
  }
  // VITE_FIREBASE_DATABASE_ID is purely an optional override; if not provided,
  // it automatically falls back to appletConfig.firestoreDatabaseId or default database.
  if (import.meta.env.VITE_FIREBASE_DATABASE_ID) {
    firebaseConfig.firestoreDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;
  }
}

// Initialize App singleton
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth: Auth = getAuth(app);

// Initialize Firestore targeting the applet database ID if configured, or default
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Validates connection to Firestore backend
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    // Attempt a light server read to verify connection
    await getDocFromServer(doc(db, '_connection_test', 'ping'));
    return true;
  } catch (err: unknown) {
    // Permission denied still indicates active connection to the firestore server
    if (err && typeof err === 'object' && 'code' in err) {
      const code = (err as { code: string }).code;
      if (code === 'permission-denied' || code === 'not-found') {
        return true;
      }
    }
    console.warn('[Firebase] Connection verification warning:', err);
    return false;
  }
}

export default app;
