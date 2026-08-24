"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import Navbar from "@/components/Navbar/Navbar";
import { useAuth, type Role } from "@/context/AuthContext";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/c184a69f5ff4e565.js).
export default function SignUpPage() {
  const { signup, signInWithGoogle, signInWithFacebook } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "" as Role | "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!form.role) {
      setError("Please select your role");
      return;
    }
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password, form.role);
    } catch (err: unknown) {
      console.error(err);
      const code = (err as { code?: string })?.code;
      if (code === "auth/email-already-in-use") setError("Email is already registered.");
      else if (code === "auth/weak-password") setError("Password should be at least 6 characters.");
      else setError("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSocial = async (provider: "google" | "facebook") => {
    setError("");
    if (!form.role) {
      setError("Please select your role first.");
      return;
    }
    setLoading(true);
    try {
      if (provider === "google") await signInWithGoogle(form.role);
      else await signInWithFacebook(form.role);
    } catch (err) {
      console.error(err);
      setError("Failed to sign up with social provider.");
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
              <Image src="/logo-icon.png" alt="Tryvanta Music" width={36} height={36} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.1rem", color: "inherit" }}>Tryvanta Music</span>
            </Link>
            <div className={styles.illustrationContent}>
              <h1 className={styles.welcomeTitle}>Join Tryvanta Music Studio</h1>
              <p className={styles.welcomeText}>
                Start your musical journey today. Whether you&apos;re a student eager to learn or a teacher ready to
                inspire, we&apos;ve got a place for you.
              </p>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>1000+</span>
                  <span className={styles.statLabel}>Active Students</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>150+</span>
                  <span className={styles.statLabel}>Expert Tutors</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>4.9★</span>
                  <span className={styles.statLabel}>Rating</span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formSide}>
            <div className={styles.formCard}>
              <h2 className={styles.formTitle}>Create Account</h2>
              <p className={styles.formSubtitle}>Fill in your details to get started</p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label>I want to join as</label>
                  <div className={styles.roleSelector}>
                    <button
                      type="button"
                      className={`${styles.roleCard} ${form.role === "student" ? styles.active : ""}`}
                      onClick={() => setForm({ ...form, role: "student" })}
                    >
                      <span className={styles.roleIcon}>🎓</span>
                      <span className={styles.roleName}>Student</span>
                      <span className={styles.roleDesc}>Learn music from experts</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.roleCard} ${form.role === "teacher" ? styles.active : ""}`}
                      onClick={() => setForm({ ...form, role: "teacher" })}
                    >
                      <span className={styles.roleIcon}>👨‍🏫</span>
                      <span className={styles.roleName}>Teacher</span>
                      <span className={styles.roleDesc}>Share your expertise</span>
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Enter your full name"
                    required
                  />
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

                <div className={styles.inputRow}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="password">Password</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="Create password"
                        required
                      />
                      <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)} tabIndex={-1}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className={styles.passwordWrapper}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="Confirm password"
                        required
                      />
                      <button
                        type="button"
                        className={styles.passwordToggle}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading || !form.role}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>

                <div className={styles.divider}>
                  <span>OR</span>
                </div>

                <div className={styles.socialButtons}>
                  <button type="button" className={`${styles.socialBtn} ${styles.googleBtn}`} onClick={() => handleSocial("google")} disabled={loading}>
                    <span className={styles.socialIcon}>G</span>
                    <span>Sign up with Google</span>
                  </button>
                  <button type="button" className={`${styles.socialBtn} ${styles.facebookBtn}`} onClick={() => handleSocial("facebook")} disabled={loading}>
                    <span className={styles.socialIcon}>f</span>
                    <span>Sign up with Facebook</span>
                  </button>
                </div>
              </form>

              <p className={styles.switchText}>
                Already have an account? <Link href="/signin" className={styles.switchLink}>Sign In</Link>
              </p>
              <p className={styles.forgotPasswordText}>
                <Link href="/forgot-password" className={styles.forgotPasswordLink}>
                  Forgot Password?
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
