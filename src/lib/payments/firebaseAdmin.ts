import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Server-side counterpart to src/lib/firebase.ts (the client SDK used by
// AuthContext). Payments must be written with server authority — bypassing
// Firestore security rules the browser client is subject to — so this uses
// the Admin SDK with a service-account credential instead of the public
// client config. Same Firebase project ("muziclly-studio") the rest of the
// platform's user data already lives in; see FIREBASE_ADMIN_* in
// .env.example for the required credential.

let app: App | undefined;
let firestore: Firestore | undefined;

export function isFirebaseAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY,
  );
}

export function getAdminFirestore(): Firestore {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }
  if (!app) {
    app = getApps().length
      ? getApps()[0]!
      : initializeApp({
          credential: cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            // Vercel/most hosts store multi-line PEM keys with literal
            // "\n" sequences in the env var value — restore real newlines.
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(/\\n/g, "\n"),
          }),
        });
  }
  if (!firestore) firestore = getFirestore(app);
  return firestore;
}
