"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import { useAuth, type Role } from "@/context/AuthContext";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/715d8d32c4ef7707.js).
export default function SignInPage() {
  const { login, signInWithGoogle, signInWithFacebook } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", role: "" as Role | "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.role) {
      setError("Please select your role");
      return;
    }
    setLoading(true);
    try {
      await login(form.email, form.password, form.role);
    } catch (err: unknown) {
      console.error(err);
      const message = (err as Error)?.message;
      setError(message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "facebook") => {
    setError("");
    setLoading(true);
    try {
      const role = form.role || undefined;
      if (provider === "google") await signInWithGoogle(role || undefined);
      else await signInWithFacebook(role || undefined);
    } catch (err) {
      console.error(err);
      setError("Failed to sign in with social provider.");
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

        <div className={styles.container}>
          <div className={styles.illustrationSide}>
            <Link href="/" className={styles.logo}>
              <Image src="/logo-icon.png" alt="Tryvanta Music" width={44} height={44} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.25rem", color: "inherit" }}>Tryvanta Music</span>
            </Link>
            <div className={styles.illustrationContent}>
              <h1 className={styles.welcomeTitle}>Welcome Back</h1>
              <p className={styles.welcomeText}>
                Continue your musical journey with Tryvanta Music. Access your dashboard, lessons, and resources.
              </p>
              <div className={styles.features}>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>🎵</span>
                  <span>Access your personalized curriculum</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>📅</span>
                  <span>Manage your class schedule</span>
                </div>
                <div className={styles.feature}>
                  <span className={styles.featureIcon}>💬</span>
                  <span>Connect with your mentors</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSide}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Sign In</h2>
              <p className={styles.formSubtitle}>Welcome back! Please enter your details.</p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <div className={styles.labelRow}>
                    <label>I am a</label>
                  </div>
                  <div className={styles.roleSelector}>
                    <button
                      type="button"
                      className={`${styles.roleOption} ${form.role === "student" ? styles.active : ""}`}
                      onClick={() => setForm({ ...form, role: "student" })}
                    >
                      <span className={styles.roleIcon}>🎓</span>
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.roleOption} ${form.role === "teacher" ? styles.active : ""}`}
                      onClick={() => setForm({ ...form, role: "teacher" })}
                    >
                      <span className={styles.roleIcon}>👨‍🏫</span>
                      <span>Teacher</span>
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div className={styles.inputGroup}>
                  <div className={styles.labelRow}>
                    <label htmlFor="password">Password</label>
                    <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                      Forgot Password?
                    </Link>
                  </div>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      placeholder="Enter your password"
                      required
                    />
                    <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading || !form.role}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      Signing In...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className={styles.divider}>
                  <span>OR</span>
                </div>

                <div className={styles.socialButtons}>
                  <button type="button" className={`${styles.socialBtn} ${styles.googleBtn}`} onClick={() => handleSocial("google")} disabled={loading}>
                    <span className={styles.socialIcon}>G</span>
                    <span>Sign in with Google</span>
                  </button>
                  <button type="button" className={`${styles.socialBtn} ${styles.facebookBtn}`} onClick={() => handleSocial("facebook")} disabled={loading}>
                    <span className={styles.socialIcon}>f</span>
                    <span>Sign in with Facebook</span>
                  </button>
                </div>
              </form>

              <p className={styles.switchText}>
                Don&apos;t have an account? <Link href="/signup" className={styles.switchLink}>Sign Up</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
