import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Same public client config as the main site's src/lib/firebase.ts — same
// Firebase project ("muziclly-studio"), safe to ship client-side. This
// dashboard is a different origin (teach.music.tryvanta.in), so it needs
// its own SDK instance; see useFirebaseIdentity.ts for how a session gets
// established here via the cross-subdomain custom-token handoff.
const firebaseConfig = {
  apiKey: "AIzaSyD69S14MQhU8-1QhPYFj5_VrJBZuDb0wRo",
  authDomain: "muziclly-studio.firebaseapp.com",
  projectId: "muziclly-studio",
  storageBucket: "muziclly-studio.firebasestorage.app",
  messagingSenderId: "805943508576",
  appId: "1:805943508576:web:0b8430a5b93053b6f1cd05",
  measurementId: "G-VBL7960DFG",
};

const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
