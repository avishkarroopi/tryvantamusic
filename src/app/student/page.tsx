"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import styles from "./page.module.css";

// The Student Dashboard is a standalone app (Vite + React), not a Next.js
// route — see the Phase 2 dashboards integration report. This page is the
// real auth gate (Firebase, via AuthContext) and hands off to it once the
// signed-in user is confirmed to be a student. The handoff below passes
// basic identity via URL params for local/dev use; production should
// replace this with a real signed token exchange (the same pattern already
// documented in the dashboards' own `mcam/integration/mcamAuth.ts`).
const STUDENT_DASHBOARD_URL = process.env.NEXT_PUBLIC_STUDENT_DASHBOARD_URL ?? "http://localhost:5174";

export default function StudentBridgePage() {
  const { user, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "student") return;
    setRedirecting(true);
    const params = new URLSearchParams({ uid: user.id, name: user.name, email: user.email });
    const timer = setTimeout(() => {
      window.location.href = `${STUDENT_DASHBOARD_URL}/dashboard?${params.toString()}`;
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
          <Image src="/logo-icon.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
          <h1 className={styles.title}>Sign in required</h1>
          <p className={styles.desc}>You need to sign in as a student to open your dashboard.</p>
          <Link href="/signin" className={styles.link}>
            Go to Sign In →
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "student") {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <Image src="/logo-icon.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
          <h1 className={styles.title}>Wrong account type</h1>
          <div className={styles.errorBox}>This account is registered as a {user.role}, not a student.</div>
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
        <Image src="/logo-icon.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
          <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
        <h1 className={styles.title}>Opening your dashboard…</h1>
        <p className={styles.desc}>
          {redirecting ? "Redirecting you to the Tryvanta Music Student Dashboard." : "Signing you in…"}
        </p>
      </div>
    </div>
  );
}
