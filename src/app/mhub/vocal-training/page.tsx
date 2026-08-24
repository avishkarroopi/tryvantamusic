import type { Metadata } from "next";
import Image from "next/image";
import {
  MicVocal,
  Ear,
  Music,
  Star,
  AudioWaveform,
  Music2,
  Activity,
  Radio,
  ChartColumn,
  Award,
  Heart,
  Mic,
  GraduationCap,
  Users,
  UsersRound,
  Video,
  Zap,
  Tablet,
  Volume2,
  Clock,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Vocal Training | Tryvanta Music M-Hub",
  description: "Master your voice with ear-based training. Build pitch accuracy, range, and performance confidence through our proprietary global pedagogy.",
};

const why = [
  { Icon: MicVocal, cls: "iconPurple", title: "Scientific Warm-ups", text: "Professional vocal exercises to protect and strengthen your cords." },
  { Icon: Ear, cls: "iconTeal", title: "Pitch Perfect", text: "Ear-voice synchronization to eliminate flat or sharp notes." },
  { Icon: Music, cls: "iconPink", title: "Contemporary Focus", text: "Learn pop, jazz, and soul with a solid foundation." },
  { Icon: Star, cls: "iconBlue", title: "Stage Ready", text: "Exclusive training on microphone technique and stage presence." },
];

const ears = [
  { emoji: "👂", cls: "borderPurple", color: "textPurple", title: "Ear", sub: "Analysis" },
  { emoji: "🎙️", cls: "borderTeal", color: "textTeal", title: "Application", sub: "Vocal Delivery" },
  { emoji: "🥁", cls: "borderPink", color: "textPink", title: "Rhythm", sub: "& Phrasing" },
  { emoji: "📜", cls: "borderWhite", color: null, title: "Structure", sub: "& Dynamics" },
];

const mlab = [
  { Icon: AudioWaveform, title: "Pitch Visualizer", text: "See your voice in real-time to perfect every interval." },
  { Icon: Music2, title: "Scale Engine", text: "Interactive scale practice with guided note accuracy." },
  { Icon: Activity, title: "Dynamics Tracker", text: "Master your breath control and volume modulation." },
  { Icon: Ear, title: "Ear Training Drills", text: "Daily interval training and scale recognition games." },
  { Icon: ChartColumn, title: "Vocal Analytics", text: "Data-driven insights into your pitch stability and growth." },
  { Icon: Radio, title: "Performance Mode", text: "Simulate live stage environments for better practice." },
];

const vocalHighlights = [
  { Icon: Heart, cls: "textPurple", title: "Holistic Voice Care", text: "Focus on long-term vocal health and cord stamina." },
  { Icon: Mic, cls: "textTeal", title: "Studio Exposure", text: "Exclusive recording opportunities for top students." },
  { Icon: GraduationCap, cls: "textPink", title: "Global Certification", text: "RockSchool & Trinity London alignment prep." },
  { Icon: Users, cls: "textBlue", title: "Small Group Batches", text: "Max 6 students for personalized feedback loops." },
];

const mentors = [
  { name: "Rahul", role: "Vocal Coach", color: "rgba(168,85,247,0.5)", roleColor: "rgb(192,132,252)", img: "/mhub/vocal-training/avatar-rahul.jpg" },
  { name: "Sarah", role: "Contemporary Vocals", color: "rgba(236,72,153,0.5)", roleColor: "rgb(251,113,133)", img: "/mhub/vocal-training/avatar-sarah.jpg" },
  { name: "Amit", role: "Ear Training Expert", color: "rgba(59,130,246,0.5)", roleColor: "rgb(96,165,250)", img: "/mhub/vocal-training/avatar-amit.jpg" },
  { name: "Jessica", role: "Performance Coach", color: "rgba(45,212,191,0.5)", roleColor: "rgb(45,212,191)", img: "/mhub/vocal-training/avatar-jessica.jpg" },
];

const masteryCycle = [
  { num: "01", color: "rgb(192,132,252)", bg: "rgba(168,85,247,0.2)", title: "Internalize (Ear)", text: "Developing the ability to hear and identify correct pitch before singing." },
  { num: "02", color: "rgb(45,212,191)", bg: "rgba(45,212,191,0.2)", title: "Execute (Voice)", text: "Perfecting muscle memory to produce the exact frequency heard." },
  { num: "03", color: "rgb(251,113,133)", bg: "rgba(236,72,153,0.2)", title: "Express (Art)", text: "Adding dynamics, emotion, and phrasing to breathe life into music." },
];

const kit = [
  { Icon: Mic, cls: "textPurple", label: "Studio Mics" },
  { Icon: Tablet, cls: "textTeal", label: "Pitch Analyzers" },
  { Icon: Volume2, cls: "textPink", label: "Backing Tracks" },
  { Icon: Clock, cls: "textBlue", label: "Daily Logs" },
];

const confidence = [
  { Icon: UsersRound, cls: "textPurple", title: "Live Open Mics", text: "Regular online performance opportunities in a supportive environment." },
  { Icon: Video, cls: "textTeal", title: "Self-Tape Reviews", text: "Record your performances for detailed posture and delivery feedback." },
  { Icon: Zap, cls: "textPink", title: "Vocal Stamina", text: "Master the mindset of a performer through guided coaching." },
];

const plans = [
  { title: "Group Studio", price: "₹2,499" },
  { title: "Duo Vocals (1:2)", price: "₹4,999", featured: true },
  { title: "Premium Solo", price: "₹7,999" },
];

const testimonials = [
  { quote: "My pitch accuracy improved drastically in just 3 months. The M-Lab tools are amazing!", author: "Priya, Parent" },
  { quote: "Best vocal training for adults. The flexibility and ear training framework is unique and effective.", author: "Siddharth, Adult Student" },
];

export default function VocalTrainingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <Image src="/logo-icon.png" alt="Tryvanta Music" width={48} height={48} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.3rem", color: "inherit" }}>Tryvanta Music</span>
        </div>
      </header>

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div style={{ position: "relative", zIndex: 10, maxWidth: "48rem", margin: "0 auto" }}>
          <span className={styles.heroBadge}>Kids • Teenagers • Adults • All Levels</span>
          <h1 className={styles.heroTitle}>
            Learn Singing <br />
            <span className={styles.gradientTextPurple}>The Right Way</span>
          </h1>
          <p className={styles.heroDesc}>
            Master your voice with ear-based training. Build pitch accuracy, range, and performance confidence
            through our proprietary global pedagogy.
          </p>
          <div className={styles.heroBtns}>
            <button className={styles.btnPrimary}>Book a Free Demo</button>
            <button className={styles.btnSecondary}>Explore Vocal Tracks</button>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: "4rem", paddingLeft: "1rem", paddingRight: "1rem" }}>
        <div className={styles.studentImgBox}>
          <Image src="/mhub/vocal-training/hero.png" alt="Student singing with professional mic" fill sizes="(max-width: 768px) 100vw, 448px" style={{ objectFit: "cover" }} priority />
          <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", borderRadius: "0.75rem", padding: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
            <p style={{ color: "white", fontWeight: 500, fontSize: "0.875rem" }}>Find your unique voice. Sing with soul.</p>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why Vocalists Choose Tryvanta Music</h2>
          <div className={styles.gridGeneric}>
            {why.map((w) => (
              <div className={styles.featureCard} key={w.title}>
                <div className={`${styles.featureIcon} ${styles[w.cls]}`}>
                  <w.Icon size={24} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{w.title}</h3>
                <p className={styles.textGray} style={{ fontSize: "0.875rem" }}>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.earsSection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ color: "rgb(45,212,191)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
              Trademark Core
            </span>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, color: "white", marginTop: "0.5rem" }}>The E.A.R.S™ Framework</h2>
          </div>
          <div className={styles.earsGrid}>
            {ears.map((e) => (
              <div className={`${styles.earsCard} ${styles[e.cls]}`} key={e.title}>
                <span className={styles.earsIcon}>{e.emoji}</span>
                <h3 className={`${e.color ? styles[e.color] : ""} ${styles.earsText}`} style={!e.color ? { color: "white" } : undefined}>{e.title}</h3>
                <p className={styles.earsSub}>{e.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.mlabSection}>
        <div className={styles.mlabGlow} />
        <div className={styles.mlabContainer}>
          <div className={styles.mlabCard}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span style={{ padding: "0.375rem 1rem", background: "rgba(45,212,191,0.2)", color: "rgb(45,212,191)", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Digital Learning Ecosystem
              </span>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "1rem", lineHeight: 1.2 }}>Master with M-Lab™</h2>
              <p style={{ color: "rgb(156,163,175)", marginTop: "1rem", maxWidth: "42rem", marginInline: "auto" }}>
                Proprietary vocal analysis tools designed to give singers real-time visual feedback on pitch and performance.
              </p>
            </div>
            <div className={styles.mlabGrid}>
              {mlab.map((m) => (
                <div className={styles.mlabItem} key={m.title}>
                  <div className={styles.mlabIcon}>
                    <m.Icon size={24} />
                  </div>
                  <div>
                    <h4 className={styles.fontBold} style={{ fontSize: "1.125rem" }}>{m.title}</h4>
                    <p className={styles.textGray} style={{ fontSize: "0.875rem" }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "4rem 1rem", background: "linear-gradient(rgba(88,28,135,0.2), transparent)" }}>
        <div style={{ maxWidth: 896, margin: "0 auto", background: "rgba(255,255,255,0.05)", borderRadius: "1.5rem", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "2rem" }}>Vocal Highlights</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {vocalHighlights.map((h) => (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }} key={h.title}>
                <h.Icon size={24} className={styles[h.cls]} />
                <div>
                  <h4 className={styles.fontBold}>{h.title}</h4>
                  <p style={{ fontSize: "0.875rem", color: "rgb(156,163,175)" }}>{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.founderSection}>
        <div className={styles.founderCard}>
          <div className={styles.founderImgBox}>
            <Image src="/founder-guitar.png" alt="Dr. Avishkar Roopi" width={192} height={192} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontSize: "2.25rem", fontWeight: 800, marginBottom: "0.25rem" }}>Dr. Avishkar Roopi</h2>
            <p style={{ color: "rgb(45,212,191)", fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "1rem" }}>
              Music Educator &amp; Founder – Tryvanta Music
            </p>
            <ul style={{ marginBottom: "1rem", color: "rgb(209,213,219)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0 }}>
              <li>🏆 Doctorate achievement recognition</li>
              <li>🎵 Degree from KMMC (A.R. Rahman Academy)</li>
            </ul>
            <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", fontStyle: "italic" }}>
              &quot;Singing is a science of the ear as much as it is an art of the voice. We build singers who don&apos;t just hit notes, but understand them.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className={styles.mentorsSection}>
        <h2 className={styles.sectionTitle}>Expert Vocal Mentors</h2>
        <div className={styles.mentorsGrid}>
          {mentors.map((m) => (
            <div className={styles.mentorItem} key={m.name}>
              <div style={{ width: "8rem", height: "8rem", margin: "0 auto 1rem", borderRadius: 9999, border: `2px solid ${m.color}`, overflow: "hidden", position: "relative" }}>
                <Image src={m.img} alt={m.name} fill sizes="128px" style={{ objectFit: "cover" }} />
              </div>
              <h4 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.25rem" }}>{m.name}</h4>
              <p style={{ color: m.roleColor, fontSize: "0.875rem", fontWeight: 600 }}>{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>Your Vocal Journey</h2>
        <div className={styles.levelTabs}>
          <button className={`${styles.levelTab} ${styles.tabActive}`} style={{ textTransform: "capitalize" }}>basic</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>intermediate</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>advanced</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>expert</button>
        </div>
        <div className={styles.levelContent}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "rgb(192,132,252)" }}>Basic: Discovery</h3>
          <p style={{ color: "rgb(156,163,175)" }}>Find your natural register, master diaphragmatic breathing, and learn to hold pitch on simple scales.</p>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
          <h2 className={styles.sectionTitle}>The Vocal Mastery Cycle</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            {masteryCycle.map((c) => (
              <div style={{ background: "rgb(26,26,36)", padding: "2rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }} key={c.num}>
                <div style={{ width: "3rem", height: "3rem", background: c.bg, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: c.color, fontWeight: 700 }}>
                  {c.num}
                </div>
                <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{c.title}</h4>
                <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem" }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "4rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <h2 className={styles.sectionTitle}>Vocal Training Kit</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.5rem" }}>
            {kit.map((k) => (
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)" }} key={k.label}>
                <k.Icon size={32} className={styles[k.cls]} style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(to right, rgba(88,28,135,0.3), rgba(19,78,74,0.3))", padding: "3rem", borderRadius: "2.5rem", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>Build Stage Confidence</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
              {confidence.map((c) => (
                <div key={c.title}>
                  <c.Icon size={32} className={styles[c.cls]} style={{ margin: "0 auto 1rem" }} />
                  <h5 className={styles.fontBold}>{c.title}</h5>
                  <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", marginTop: "0.5rem" }}>{c.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem", background: "rgba(255,255,255,0.02)" }}>
        <div className={styles.plansGrid}>
          {plans.map((p) => (
            <div className={`${styles.planCard} ${p.featured ? styles.planCardFeatured : ""}`} key={p.title}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{p.title}</h3>
              <div style={{ fontSize: "2.25rem", fontWeight: 900, margin: "1.5rem 0" }}>
                {p.price}
                <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "rgb(107,114,128)" }}>/mo</span>
              </div>
              <button style={{ width: "100%", padding: "1rem", borderRadius: "1rem", background: p.featured ? "linear-gradient(to right, rgb(147,51,234), rgb(236,72,153))" : "rgba(255,255,255,0.1)", border: "none", color: "white", fontWeight: 700, marginTop: "auto", cursor: "pointer" }}>
                Enroll Now
              </button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "5rem 1rem", overflow: "hidden" }}>
        <h2 className={styles.sectionTitle}>Student &amp; Parent Success</h2>
        <div className={styles.testimonialsGrid}>
          {testimonials.map((t) => (
            <div className={styles.testimonialCard} key={t.author}>
              <div style={{ display: "flex", gap: "0.25rem", color: "rgb(234,179,8)", marginBottom: "1rem" }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p style={{ fontSize: "0.875rem", color: "rgb(156,163,175)", fontStyle: "italic", marginBottom: "1rem" }}>&quot;{t.quote}&quot;</p>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgb(45,212,191)" }}>{t.author}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div style={{ gridColumn: "span 2" }}>
            <Image src="/logo-icon.png" alt="Tryvanta Music" width={48} height={48} style={{ objectFit: "contain", marginBottom: "0.75rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>Tryvanta Music</div>
            <p>The global benchmark for online music education.</p>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Company</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>About Us</li>
              <li>FAQs</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Vocals</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>Classical</li>
              <li>Contemporary</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", opacity: 0.5, fontSize: "0.75rem" }}>
          © 2026 Tryvanta Music Global. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
