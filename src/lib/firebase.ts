import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Recovered verbatim from the original production bundle
// (_next/static/chunks/c729ce39b21a1acd.js). This is the standard public
// Firebase Web SDK config for the site's "muziclly-studio" project — safe to
// ship client-side, access is governed by Firestore/Auth security rules.
const firebaseConfig = {
  apiKey: "AIzaSyD69S14MQhU8-1QhPYFj5_VrJBZuDb0wRo",
  authDomain: "muziclly-studio.firebaseapp.com",
  projectId: "muziclly-studio",
  storageBucket: "muziclly-studio.firebasestorage.app",
  messagingSenderId: "805943508576",
  appId: "1:805943508576:web:0b8430a5b93053b6f1cd05",
  measurementId: "G-VBL7960DFG",
};

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey);

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let analytics: Analytics | undefined;

if (typeof window !== "undefined" && isFirebaseConfigured) {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Analytics needs its own async support check (fails in some browsers/
  // privacy modes with cookies blocked) — never let it block auth/db setup.
  isSupported()
    .then((supported) => {
      if (supported && app) analytics = getAnalytics(app);
    })
    .catch(() => {
      // analytics is a nice-to-have; swallow and move on
    });
}

export { app, auth, db, analytics };
