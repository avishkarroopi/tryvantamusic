"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import styles from "./page.module.css";

// The Teacher Dashboard (+ M-CAM) is a standalone app (Vite + React) on its
// own subdomain (teach.music.tryvanta.in) — not the same origin as this
// page, so its own Firebase session doesn't just carry over. This hands off
// via a short-lived Firebase custom token (minted server-side in
// /api/auth/handoff after verifying this user's real ID token) rather than
// the old "pass uid/name/email as URL query params" approach — see
// src/app/student/page.tsx for the mirrored student-side bridge.
const TEACHER_DASHBOARD_URL = process.env.NEXT_PUBLIC_TEACHER_DASHBOARD_URL ?? "http://localhost:5173";

export default function TeacherBridgePage() {
  const { user, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "teacher") return;
    setRedirecting(true);
    const timer = setTimeout(async () => {
      try {
        const idToken = await auth?.currentUser?.getIdToken();
        if (!idToken) throw new Error("No active session to hand off.");
        const res = await fetch("/api/auth/handoff", {
          method: "POST",
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (!res.ok || !data.customToken) throw new Error(data.error || "Handoff failed.");
        window.location.href = `${TEACHER_DASHBOARD_URL}/dashboard#token=${encodeURIComponent(data.customToken)}`;
      } catch (err) {
        setHandoffError(err instanceof Error ? err.message : "Could not open your dashboard.");
        setRedirecting(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [user, isLoading]);

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Image src="/logo-icon-dark.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
          <h1 className={styles.title}>Sign in required</h1>
          <p className={styles.desc}>You need to sign in as a teacher to open your dashboard.</p>
          <Link href="/signin" className={styles.link}>
            Go to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "teacher") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Image src="/logo-icon-dark.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
          <h1 className={styles.title}>Wrong account type</h1>
          <div className={styles.errorBox}>This account is registered as a {user.role}, not a teacher.</div>
          <Link href="/signin" className={styles.link}>
            Sign in with a different account →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Image src="/logo-icon-dark.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
        <h1 className={styles.title}>Opening your dashboard…</h1>
        <p className={styles.desc}>
          {handoffError ? handoffError : redirecting ? "Redirecting you to the Tryvanta Music Teachers Dashboard." : "Signing you in…"}
        </p>
        {handoffError && (
          <Link href="/signin" className={styles.link}>
            Try signing in again →
          </Link>
        )}
      </div>
    </div>
  );
}
