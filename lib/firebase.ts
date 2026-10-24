import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { Firestore, getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

export const firebaseReady = !!(config.apiKey && config.projectId && config.appId);

let cache: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

// Only runs in the browser, and only once.
export function fb() {
  if (typeof window === "undefined" || !firebaseReady) return null;
  if (cache) return cache;
  const app = getApps().length ? getApp() : initializeApp(config);
  let db: Firestore;
  try {
    // keeps working offline and syncs when the connection comes back
    db = initializeFirestore(app, {
      ignoreUndefinedProperties: true,
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    db = getFirestore(app); // already set up (happens when the dev server reloads)
  }
  cache = { app, auth: getAuth(app), db };
  return cache;
}