"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import styles from "./page.module.css";

// The Teacher Dashboard (+ M-CAM) is a standalone app (Vite + React), not a
// Next.js route — see the Phase 2 dashboards integration report. This page
// is the real auth gate (Firebase, via AuthContext) and hands off to it once
// the signed-in user is confirmed to be a teacher. See src/app/student/page.tsx
// for the mirrored student-side bridge; the same production caveat applies.
const TEACHER_DASHBOARD_URL = process.env.NEXT_PUBLIC_TEACHER_DASHBOARD_URL ?? "http://localhost:5173";

export default function TeacherBridgePage() {
  const { user, isLoading } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;
    if (user.role !== "teacher") return;
    setRedirecting(true);
    const params = new URLSearchParams({ uid: user.id, name: user.name, email: user.email });
    const timer = setTimeout(() => {
      window.location.href = `${TEACHER_DASHBOARD_URL}/dashboard?${params.toString()}`;
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
          <Image src="/logo-new.png" alt="Tryvanta Music" width={160} height={48} className={styles.logo} />
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
          <Image src="/logo-new.png" alt="Tryvanta Music" width={160} height={48} className={styles.logo} />
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
        <Image src="/logo-new.png" alt="Tryvanta Music" width={160} height={48} className={styles.logo} />
        <h1 className={styles.title}>Opening your dashboard…</h1>
        <p className={styles.desc}>
          {redirecting ? "Redirecting you to the Tryvanta Music Teachers Dashboard." : "Signing you in…"}
        </p>
      </div>
    </div>
  );
}
