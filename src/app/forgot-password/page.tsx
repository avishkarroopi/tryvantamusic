"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import { useAuth } from "@/context/AuthContext";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/4853f49cdb56935c.js).
export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(
        "Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder."
      );
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      if (code === "auth/user-not-found") setError("No account found with this email address.");
      else if (code === "auth/invalid-email") setError("Please enter a valid email address.");
      else setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.bgElements}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
        </div>

        <div className={styles.authCard}>
          <Link href="/" className={styles.logo}>
            <Image src="/logo-icon.png" alt="Tryvanta Music" width={36} height={36} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.1rem", color: "inherit" }}>Tryvanta Music</span>
          </Link>

          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your email address and we&apos;ll send you a link to reset your password.</p>

          {error && <div className={styles.error}>{error}</div>}

          {success ? (
            <div className={styles.success}>
              <span className={styles.successTitle}>Email Sent!</span>
              <p>{success}</p>
              <button onClick={handleSubmit} className={styles.resendBtn} disabled={loading}>
                Resend Link
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} />
                    Sending Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}

          <div className={styles.backLink}>
            Remember your password?
            <Link href="/signin">Sign In</Link>
          </div>
        </div>
      </main>
    </>
  );
}
