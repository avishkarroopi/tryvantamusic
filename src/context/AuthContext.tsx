"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";

export type Role = "student" | "teacher" | "admin";
export type AccountStatus = "pending" | "approved" | "rejected";

export interface MuziclyUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  photoURL?: string;
  publicProfile?: boolean;
}

interface AuthContextValue {
  user: MuziclyUser | null;
  isLoading: boolean;
  login: (email: string, password: string, role: Role) => Promise<void>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: (role?: Role) => Promise<void>;
  signInWithFacebook: (role?: Role) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Ported from the recovered original (_next/static/chunks/018010e1d4801339.js).
// Dashboards (/admin, /student, /teacher) are Phase 2 and not built yet, so
// those redirects are preserved as-is — they simply 404 until Phase 2 lands.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MuziclyUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const requireFirebase = () => {
    if (!isFirebaseConfigured || !auth || !db) {
      throw new Error("Firebase is not configured. Please set NEXT_PUBLIC_FIREBASE_* environment variables.");
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const unsubSnap = onSnapshot(
          doc(db!, "users", firebaseUser.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data() as Omit<MuziclyUser, "id">;
              setUser({ id: firebaseUser.uid, ...data });
            } else {
              console.log("No user document found");
            }
            setIsLoading(false);
          },
          (err) => {
            console.error("Error fetching user data:", err);
            setIsLoading(false);
          }
        );
        return () => unsubSnap();
      }
      setUser(null);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: Role) => {
    try {
      requireFirebase();

      if (role === "admin") {
        if (email === "admin@gmail.com" && password === "Admin@#2026") {
          try {
            await signInWithEmailAndPassword(auth!, email, password);
          } catch (err: unknown) {
            const code = (err as { code?: string })?.code;
            if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
              try {
                const cred = await createUserWithEmailAndPassword(auth!, email, password);
                await setDoc(doc(db!, "users", cred.user.uid), {
                  name: "Administrator",
                  email,
                  role: "admin",
                  status: "approved",
                  createdAt: new Date(),
                });
              } catch (inner: unknown) {
                if ((inner as { code?: string })?.code === "auth/email-already-in-use") {
                  throw new Error("Admin account exists with a different password. Please reset it in Firebase Console.");
                }
                throw inner;
              }
            } else {
              throw err;
            }
          }
          router.push("/admin");
          return;
        }
        throw new Error("Invalid admin credentials.");
      }

      const cred = await signInWithEmailAndPassword(auth!, email, password);
      const userRef = doc(db!, "users", cred.user.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as MuziclyUser;
        if (data.role === "admin") {
          router.push("/admin");
          return;
        }
        if (data.status === "pending") {
          await signOut(auth!);
          throw new Error("Account pending approval. Please wait for an admin to approve your request.");
        }
        if (data.status === "rejected") {
          await signOut(auth!);
          throw new Error("Your account request has been rejected.");
        }
        if (data.role !== role) {
          await signOut(auth!);
          throw new Error(`Invalid role. This account is registered as a ${data.role}.`);
        }
        router.push(data.role === "student" ? "/student" : "/teacher");
      } else {
        await signOut(auth!);
        throw new Error("User profile not found.");
      }
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string, role: Role) => {
    try {
      requireFirebase();
      const cred = await createUserWithEmailAndPassword(auth!, email, password);
      await setDoc(doc(db!, "users", cred.user.uid), {
        name,
        email,
        role,
        status: "pending",
        createdAt: new Date(),
      });
      await signOut(auth!);
      router.push("/signin");
    } catch (err) {
      console.error("Signup error:", err);
      throw err;
    }
  };

  const handleSocialProfile = async (firebaseUser: FirebaseUser, role?: Role) => {
    const userRef = doc(db!, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as MuziclyUser;
      if (data.status === "pending") {
        await signOut(auth!);
        throw new Error("Account pending approval. Please wait for an admin to approve your request.");
      }
      if (data.status === "rejected") {
        await signOut(auth!);
        throw new Error("Your account request has been rejected.");
      }
      router.push(data.role === "student" ? "/student" : "/teacher");
    } else if (role) {
      await setDoc(userRef, {
        name: firebaseUser.displayName || "User",
        email: firebaseUser.email,
        role,
        status: "pending",
        createdAt: new Date(),
        photoURL: firebaseUser.photoURL,
      });
      await signOut(auth!);
      router.push("/signin");
    } else {
      await signOut(auth!);
      throw new Error("Account not found. Please sign up to create an account.");
    }
  };

  const signInWithGoogle = async (role?: Role) => {
    try {
      requireFirebase();
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth!, provider);
      await handleSocialProfile(cred.user, role);
    } catch (err) {
      console.error("Google Sign In Error", err);
      throw err;
    }
  };

  const signInWithFacebook = async (role?: Role) => {
    try {
      requireFirebase();
      const provider = new FacebookAuthProvider();
      const cred = await signInWithPopup(auth!, provider);
      await handleSocialProfile(cred.user, role);
    } catch (err) {
      console.error("Facebook Sign In Error", err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      requireFirebase();
      await signOut(auth!);
      router.push("/signin");
    } catch (err) {
      console.error("Logout error:", err);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      requireFirebase();
      await sendPasswordResetEmail(auth!, email);
    } catch (err) {
      console.error("Reset password error:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, signup, logout, signInWithGoogle, signInWithFacebook, resetPassword }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
