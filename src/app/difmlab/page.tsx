import type { Metadata } from "next";
import { Sparkles, GraduationCap, X, Zap, Check, Brain, Activity, ChartNoAxesColumnIncreasing } from "lucide-react";
import Button from "@/components/Button/Button";
import Section from "@/components/Section/Section";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "MLAB vs Traditional | MUZICLLY",
  description: "Don't just learn music. Master it with the power of AI and personalized adaptability.",
};

const traditionalPoints = [
  "Fixed, rigid curriculum",
  "Subjective, delayed feedback",
  "Theory disconnected from play",
  "Slow, unmeasurable progress",
];

const mlabPoints = [
  "Adaptive, ID-driven learning",
  "Real-time audio analysis & feedback",
  "Integrated practical theory",
  "Data-visualized growth metrics",
];

const features = [
  { icon: Brain, title: "AI Analysis", desc: "Our algorithms break down your playing style to find exactly what you need to improve." },
  { icon: Activity, title: "Real-time Feedback", desc: "Instant corrections on pitch, timing, and expression as you practice." },
  { icon: ChartNoAxesColumnIncreasing, title: "Measurable Growth", desc: "See your progress with detailed charts and milestone tracking." },
];

export default function DifmlabPage() {
  return (
    <main className={styles.main}>
      <div className={styles.bgGlow} />

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <Sparkles size={16} aria-hidden="true" />
            <span>The Future of Music Education</span>
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.highlight}>MLAB</span> <span className={styles.vs}>vs</span> Traditional
          </h1>
          <p className={styles.heroSubtitle}>
            Don&apos;t just learn music. <span className={styles.textHighlight}>Master it</span> with the power of
            AI and personalized adaptability.
          </p>
          <div className={styles.heroActions}>
            <Button variant="primary" size="lg" href="/signup">
              Start Your Journey
            </Button>
            <Button variant="outline" size="lg" href="#comparison">
              See the Difference
            </Button>
          </div>
        </div>
      </section>

      <Section id="comparison" background="primary" padding="lg" className={styles.comparisonSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <h2>Why the Old Way Falls Flat</h2>
            <p>Music education hasn&apos;t changed in centuries. Until now.</p>
          </div>

          <div className={styles.comparisonGrid}>
            <div className={`${styles.card} ${styles.traditionalCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBoxTrad}>
                  <GraduationCap size={32} aria-hidden="true" />
                </div>
                <h3>Traditional Method</h3>
                <p>The &quot;One-Size-Fits-All&quot; Model</p>
              </div>
              <ul className={styles.featureList}>
                {traditionalPoints.map((point) => (
                  <li key={point}>
                    <span className={styles.iconTrad}>
                      <X size={20} aria-hidden="true" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className={styles.vsBadge}>VS</div>

            <div className={`${styles.card} ${styles.mlabCard}`}>
              <div className={styles.cardHeader}>
                <div className={styles.iconBoxMlab}>
                  <Zap size={32} aria-hidden="true" />
                </div>
                <h3>MLAB Method</h3>
                <p>Powered by Intelligence</p>
              </div>
              <ul className={styles.featureList}>
                {mlabPoints.map((point) => (
                  <li key={point}>
                    <span className={styles.iconMlab}>
                      <Check size={20} aria-hidden="true" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.ctaWrapper}>
            <Button variant="primary" size="lg" href="/signup" className={styles.glowButton}>
              Join the Revolution
            </Button>
          </div>
        </div>
      </Section>

      <Section background="primary" padding="lg" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.featureGrid}>
            {features.map((f) => (
              <div className={styles.featureItem} key={f.title}>
                <div className={styles.featureIcon}>
                  <f.icon size={40} aria-hidden="true" />
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </main>
  );
}
