import { NextRequest, NextResponse } from "next/server";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { isFirebaseAdminConfigured } from "@/lib/payments/firebaseAdmin";

// Real cross-subdomain auth handoff, replacing the old "pass uid/name/email
// as plain URL query params" approach (spoofable — anyone could type
// ?uid=someone-else&role=teacher into the address bar). music.tryvanta.in,
// teach.music.tryvanta.in and learn.music.tryvanta.in are three separate
// origins, so a Firebase session on one doesn't carry over to another —
// Firebase's own supported answer to that is a short-lived custom token:
//
//   1. The signed-in user's ID token (proof they're really logged in here)
//      is verified server-side.
//   2. A custom token is minted for that SAME uid via the Admin SDK.
//   3. The dashboard (teach./learn.) redeems it with
//      signInWithCustomToken() and gets a real, verified Firebase session
//      of its own — reading the same Firestore users/{uid} doc as this
//      app does, not a name the browser could have made up.
//
// Uses the same Firebase Admin credentials already configured for the
// payment webhook (see src/lib/payments/firebaseAdmin.ts) — same project,
// same service account, different use.

let adminAppInitialized = false;
function ensureAdminApp() {
  if (adminAppInitialized) return;
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  adminAppInitialized = true;
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json({ error: "Auth handoff is not configured yet." }, { status: 503 });
  }

  const authHeader = req.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Missing ID token." }, { status: 401 });
  }

  try {
    ensureAdminApp();
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    // Custom tokens are meant to be redeemed within minutes — Firebase
    // itself caps them at 1 hour regardless, but there's no reason this
    // handoff needs anywhere near that long.
    const customToken = await getAdminAuth().createCustomToken(decoded.uid);
    return NextResponse.json({ customToken });
  } catch (err) {
    console.error("[auth/handoff] failed to verify/mint token", err);
    return NextResponse.json({ error: "Could not verify your session." }, { status: 401 });
  }
}
