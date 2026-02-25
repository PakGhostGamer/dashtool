import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let db: Firestore | null = null;

const hasValidConfig =
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId;

if (hasValidConfig) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      analytics = getAnalytics(app);
    }
    db = getFirestore(app);
  } catch (e) {
    console.error('Firebase init error:', e);
  }
}

export { app, analytics, db };
export const isFirebaseEnabled = (): boolean => !!app && !!db;
