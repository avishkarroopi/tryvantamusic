import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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

if (typeof window !== "undefined" && isFirebaseConfigured) {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { app, auth, db };
