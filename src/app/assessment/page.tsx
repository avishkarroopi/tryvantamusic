"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/9c50c9542813ebd2.js).
const instruments = [
  { id: "piano", name: "Piano", icon: "🎹" },
  { id: "guitar", name: "Guitar", icon: "🎸" },
  { id: "violin", name: "Violin", icon: "🎻" },
  { id: "drums", name: "Drums", icon: "🥁" },
  { id: "vocals", name: "Vocals", icon: "🎤" },
  { id: "other", name: "Other", icon: "🎵" },
];

const experienceLevels = [
  { id: "beginner", name: "Beginner", desc: "Just starting out" },
  { id: "intermediate", name: "Intermediate", desc: "1-3 years experience" },
  { id: "advanced", name: "Advanced", desc: "3+ years experience" },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  instrument: string;
  experience: string;
  goals: string;
  preferredTime: string;
}

export default function AssessmentPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    instrument: "",
    experience: "",
    goals: "",
    preferredTime: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const next = () => step < 3 && setStep(step + 1);
  const back = () => step > 1 && setStep(step - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // The original mocks the network call with a fixed delay rather than
    // hitting a real backend for this form.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setSubmitting(false);
    setSubmitted(true);
  };

  const canContinueStep1 = formData.instrument !== "";
  const canContinueStep2 = formData.experience !== "" && formData.goals !== "";
  const canSubmit = formData.name !== "" && formData.email !== "" && formData.phone !== "";

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className={styles.page}>
          <div className={styles.bgElements}>
            <div className={styles.gradientOrb1} />
            <div className={styles.gradientOrb2} />
          </div>
          <div className={`${styles.successContainer} ${styles.fadeIn}`}>
            <div className={styles.successIcon}>✓</div>
            <h1 className={styles.successTitle}>Assessment Booked!</h1>
            <p className={styles.successText}>
              Thank you, {formData.name}! We&apos;ve received your assessment request. Our team will contact you
              within 24 hours to schedule your free session.
            </p>
            <Link href="/" className={styles.backHomeBtn}>
              Back to Home
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.bgElements}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
          <div className={styles.gridPattern} />
        </div>

        <div className={styles.container}>
          <div className={styles.infoSection}>
            <Link href="/" className={styles.backLink}>
              ← Back to Home
            </Link>
            <div className={styles.infoContent}>
              <span className={styles.badge}>Free Assessment</span>
              <h1 className={styles.title}>
                Start Your<span className={styles.gradientText}> Musical Journey</span>
              </h1>
              <p className={styles.subtitle}>
                Book a free 30-minute assessment with our expert tutors. We&apos;ll understand your goals and create
                a personalized learning path just for you.
              </p>
              <div className={styles.benefits}>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🎯</span>
                  <div>
                    <h4>Personalized Evaluation</h4>
                    <p>Get insights on your current skill level</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>📋</span>
                  <div>
                    <h4>Custom Learning Plan</h4>
                    <p>Receive a roadmap tailored to your goals</p>
                  </div>
                </div>
                <div className={styles.benefit}>
                  <span className={styles.benefitIcon}>🤝</span>
                  <div>
                    <h4>Meet Your Mentor</h4>
                    <p>Find the perfect tutor match for you</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.illustration}>
              <svg viewBox="0 0 400 300" className={styles.illustrationSvg}>
                <g>
                  <line x1="50" y1="80" x2="350" y2="80" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <line x1="50" y1="100" x2="350" y2="100" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <line x1="50" y1="120" x2="350" y2="120" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <line x1="50" y1="140" x2="350" y2="140" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                  <line x1="50" y1="160" x2="350" y2="160" stroke="currentColor" strokeWidth="1" opacity="0.2" />
                </g>
                <g>
                  <circle cx="100" cy="110" r="8" fill="var(--color-accent-primary)" className={styles.note1} />
                  <rect x="108" y="60" width="3" height="50" fill="var(--color-accent-primary)" className={styles.note1} />
                  <circle cx="160" cy="130" r="8" fill="var(--color-accent-secondary)" className={styles.note2} />
                  <rect x="168" y="80" width="3" height="50" fill="var(--color-accent-secondary)" className={styles.note2} />
                  <circle cx="220" cy="100" r="8" fill="var(--color-accent-primary)" className={styles.note3} />
                  <rect x="228" y="50" width="3" height="50" fill="var(--color-accent-primary)" className={styles.note3} />
                  <circle cx="280" cy="140" r="8" fill="var(--color-accent-secondary)" className={styles.note4} />
                  <rect x="288" y="90" width="3" height="50" fill="var(--color-accent-secondary)" className={styles.note4} />
                </g>
                <text x="60" y="140" fontSize="60" fill="var(--color-accent-primary)" opacity="0.3" className={styles.clef}>
                  𝄞
                </text>
                <g>
                  <path
                    d="M320 120 Q340 100, 360 120 Q380 140, 360 160"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    opacity="0.3"
                    className={styles.wave1}
                  />
                  <path
                    d="M330 120 Q345 105, 360 120 Q375 135, 360 150"
                    fill="none"
                    stroke="var(--color-accent-primary)"
                    strokeWidth="2"
                    opacity="0.5"
                    className={styles.wave2}
                  />
                </g>
                <g className={styles.pianoKeys}>
                  <rect x="100" y="200" width="30" height="60" fill="white" stroke="var(--color-accent-primary)" strokeWidth="1" rx="2" />
                  <rect x="130" y="200" width="30" height="60" fill="white" stroke="var(--color-accent-primary)" strokeWidth="1" rx="2" />
                  <rect x="160" y="200" width="30" height="60" fill="white" stroke="var(--color-accent-primary)" strokeWidth="1" rx="2" />
                  <rect x="190" y="200" width="30" height="60" fill="white" stroke="var(--color-accent-primary)" strokeWidth="1" rx="2" />
                  <rect x="220" y="200" width="30" height="60" fill="white" stroke="var(--color-accent-primary)" strokeWidth="1" rx="2" />
                  <rect x="120" y="200" width="20" height="35" fill="var(--color-bg-primary)" rx="2" className={styles.blackKey} />
                  <rect x="150" y="200" width="20" height="35" fill="var(--color-bg-primary)" rx="2" className={styles.blackKey} />
                  <rect x="210" y="200" width="20" height="35" fill="var(--color-bg-primary)" rx="2" className={styles.blackKey} />
                </g>
              </svg>
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.progressSteps}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`${styles.progressStep} ${step >= s ? styles.active : ""} ${step === s ? styles.current : ""}`}
                >
                  <div className={styles.stepCircle}>{step > s ? "✓" : s}</div>
                  <span className={styles.stepLabel}>{s === 1 ? "Instrument" : s === 2 ? "Experience" : "Contact"}</span>
                </div>
              ))}
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${((step - 1) / 2) * 100}%` }} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={`${styles.formStep} ${step === 1 ? styles.activeStep : ""}`}>
                <h2 className={styles.stepTitle}>What instrument do you want to learn?</h2>
                <p className={styles.stepSubtitle}>Select your primary instrument of interest</p>
                <div className={styles.instrumentGrid}>
                  {instruments.map((inst) => (
                    <button
                      type="button"
                      key={inst.id}
                      className={`${styles.instrumentCard} ${formData.instrument === inst.id ? styles.selected : ""}`}
                      onClick={() => setFormData({ ...formData, instrument: inst.id })}
                    >
                      <span className={styles.instrumentIcon}>{inst.icon}</span>
                      <span className={styles.instrumentName}>{inst.name}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.nextBtn} onClick={next} disabled={!canContinueStep1}>
                    Continue<span className={styles.btnArrow}>→</span>
                  </button>
                </div>
              </div>

              <div className={`${styles.formStep} ${step === 2 ? styles.activeStep : ""}`}>
                <h2 className={styles.stepTitle}>Tell us about your experience</h2>
                <p className={styles.stepSubtitle}>This helps us match you with the right tutor</p>
                <div className={styles.experienceGrid}>
                  {experienceLevels.map((lvl) => (
                    <button
                      type="button"
                      key={lvl.id}
                      className={`${styles.experienceCard} ${formData.experience === lvl.id ? styles.selected : ""}`}
                      onClick={() => setFormData({ ...formData, experience: lvl.id })}
                    >
                      <span className={styles.experienceName}>{lvl.name}</span>
                      <span className={styles.experienceDesc}>{lvl.desc}</span>
                    </button>
                  ))}
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="goals">What are your musical goals?</label>
                  <textarea
                    id="goals"
                    name="goals"
                    value={formData.goals}
                    onChange={handleChange}
                    placeholder="E.g., I want to play my favorite songs, prepare for exams, or perform professionally..."
                    rows={3}
                  />
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={back}>
                    ← Back
                  </button>
                  <button type="button" className={styles.nextBtn} onClick={next} disabled={!canContinueStep2}>
                    Continue<span className={styles.btnArrow}>→</span>
                  </button>
                </div>
              </div>

              <div className={`${styles.formStep} ${step === 3 ? styles.activeStep : ""}`}>
                <h2 className={styles.stepTitle}>Almost there! Your contact details</h2>
                <p className={styles.stepSubtitle}>We&apos;ll reach out to schedule your free assessment</p>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Your full name" required />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} placeholder="your.email@example.com" required />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 98765 43210" required />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="preferredTime">Preferred Time for Call</label>
                  <select id="preferredTime" name="preferredTime" value={formData.preferredTime} onChange={handleChange}>
                    <option value="">Select a time slot</option>
                    <option value="morning">Morning (9 AM - 12 PM)</option>
                    <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                    <option value="evening">Evening (4 PM - 8 PM)</option>
                  </select>
                </div>
                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={back}>
                    ← Back
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={!canSubmit || submitting}>
                    {submitting ? (
                      <>
                        <span className={styles.spinner} />
                        Booking...
                      </>
                    ) : (
                      <>
                        Book Free Assessment<span className={styles.btnArrow}>→</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
