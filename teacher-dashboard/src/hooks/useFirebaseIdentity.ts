/**
 * Real, verified identity for this dashboard — replaces trusting whatever
 * `uid`/`name`/`email` a URL query string happened to contain.
 *
 * On first load after the cross-subdomain handoff (see the main site's
 * /student or /teacher bridge page and src/app/api/auth/handoff), the URL
 * carries a short-lived Firebase custom token in the hash fragment
 * (`#token=...`, never sent to any server). This redeems it via
 * signInWithCustomToken, which establishes a real Firebase session for
 * THIS origin, then strips the token from the URL. On every load after
 * that, Firebase's own persisted session (this origin's IndexedDB) picks
 * back up automatically — no token needed again until it's cleared.
 *
 * Mirrors the main site's AuthContext pattern: once signed in, reads the
 * same Firestore `users/{uid}` doc for name/role/status, so "who is this"
 * agrees across every app in the platform.
 */
import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithCustomToken, type User as FirebaseUser } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export type Role = "student" | "teacher" | "admin";

export interface Identity {
  uid: string;
  name: string;
  email: string;
  role: Role;
  status: "pending" | "approved" | "rejected";
}

interface State {
  identity: Identity | null;
  loading: boolean;
  error: string | null;
}

function consumeHandoffToken(): string | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash;
  const match = hash.match(/(?:^#|&)token=([^&]+)/);
  if (!match) return null;
  const token = decodeURIComponent(match[1]);
  // Strip it from the URL immediately — it's single-use in spirit (a fresh
  // custom token is minted per handoff) and shouldn't linger in history.
  const stripped = hash.replace(/(?:^#|&)token=[^&]+/, "").replace(/^#&/, "#");
  const url = window.location.pathname + window.location.search + (stripped && stripped !== "#" ? stripped : "");
  window.history.replaceState(null, "", url);
  return token;
}

export function useFirebaseIdentity(): State {
  const [state, setState] = useState<State>({ identity: null, loading: true, error: null });

  useEffect(() => {
    let unsubDoc: (() => void) | undefined;

    const token = consumeHandoffToken();
    if (token) {
      signInWithCustomToken(auth, token).catch((err) => {
        setState({ identity: null, loading: false, error: err instanceof Error ? err.message : "Sign-in failed." });
      });
    }

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      unsubDoc?.();
      if (!firebaseUser) {
        setState({ identity: null, loading: false, error: null });
        return;
      }
      unsubDoc = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snap) => {
          if (!snap.exists()) {
            setState({ identity: null, loading: false, error: "No profile found for this account." });
            return;
          }
          const data = snap.data() as { name: string; email: string; role: Role; status: Identity["status"] };
          setState({
            identity: { uid: firebaseUser.uid, name: data.name, email: data.email, role: data.role, status: data.status },
            loading: false,
            error: null,
          });
        },
        (err) => setState({ identity: null, loading: false, error: err.message }),
      );
    });

    return () => {
      unsubAuth();
      unsubDoc?.();
    };
  }, []);

  return state;
}
