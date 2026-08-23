import type { Metadata } from "next";
import Image from "next/image";
import {
  Award,
  Laptop,
  BookOpen,
  Briefcase,
  Ear,
  Keyboard as KeyboardIcon,
  Timer,
  Compass,
  Video,
  Activity,
  Music2,
  Hand,
  ChartColumn,
  ShieldCheck,
  Zap,
  Banknote,
  Globe,
  FileText,
  PanelsTopLeft,
  Mail,
  Users,
  TrendingUp,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Teacher Training & Certification | Muziclly M-Hub",
  description: "Turn your musical talent into a professional teaching career. Master global pedagogy, E.A.R.S™ framework, and digital tools.",
};

const why = [
  { Icon: Award, cls: "iconPurple", title: "Global Certification", text: "Get recognized by international boards and top institutes." },
  { Icon: Laptop, cls: "iconTeal", title: "Digital Pedagogy", text: "Learn effective online and hybrid teaching techniques." },
  { Icon: BookOpen, cls: "iconPink", title: "Ready Curriculum", text: "Access structured lesson plans for levels 1 to 8." },
  { Icon: Briefcase, cls: "iconBlue", title: "Career Support", text: "Job placement and freelance growth modules." },
];

const ears = [
  { letter: "E", Icon: Ear, title: "Ear Training", desc: "Develop relative pitch and intuitive listening. Learn to decode melodies and chords directly from your favorite tracks." },
  { letter: "A", Icon: KeyboardIcon, title: "Application", desc: "Stop memorizing and start applying. Bridge the gap between abstract theory and real-world instrument playability." },
  { letter: "R", Icon: Timer, title: "Rhythm", desc: "Internalize the pulse. Master the timing mechanics that define modern genres from jazz fusion to electronic pop." },
  { letter: "S", Icon: Compass, title: "Structure", desc: "Architecture of sound. Understand song forms and arrangements to compose or improvise with total confidence." },
];

const mlab = [
  { Icon: Video, title: "Integrated Lab", text: "Low-latency video environment built for music." },
  { Icon: KeyboardIcon, title: "Virtual MIDI Keyboard", text: "Real-time visualization for clear student guidance." },
  { Icon: Activity, title: "Metronome & Tuner", text: "Integrated tools to maintain perfect performance." },
  { Icon: Music2, title: "Scales & Chords", text: "Visualizer for complex chord shapes and scales." },
  { Icon: Hand, title: "Fingering Guidance", text: "Interactive aids for teaching perfect technique." },
  { Icon: ChartColumn, title: "Practice Analytics", text: "Data insights into student growth and practice." },
];

const highlights = [
  { Icon: ShieldCheck, color: "#c084fc", title: "Verified License", text: "Earn your Muziclly Global Teaching License." },
  { Icon: Zap, color: "#2dd4bf", title: "Accelerated Track", text: "Go from performer to educator in 6 months." },
  { Icon: Banknote, color: "#fb7185", title: "Earning Potential", text: "Access high-paying global student pools." },
  { Icon: Globe, color: "#60a5fa", title: "Global Network", text: "Connect with educators across 20+ countries." },
];

const pedagogy = [
  { title: "Psychological Approach", text: "Understand student motivation and cognitive load management to ensure long-term retention and success." },
  { title: "Adaptive Curriculum", text: "Learn to tailor the global syllabus for varied learning speeds and personal musical goals." },
];

const toolkit = [
  { Icon: FileText, color: "#c084fc", label: "Sheet Music Library" },
  { Icon: PanelsTopLeft, color: "#2dd4bf", label: "Lesson Templates" },
  { Icon: Video, color: "#fb7185", label: "HD Demo Assets" },
  { Icon: Mail, color: "#60a5fa", label: "Comms Kit" },
];

const launch = [
  { Icon: Users, color: "#c084fc", title: "Student Matching", text: "Get direct access to students via our global ecosystem." },
  { Icon: TrendingUp, color: "#2dd4bf", title: "Income Scaling", text: "Learn to maximize your hourly rates and student retention." },
  { Icon: Globe, color: "#fb7185", title: "Personal Branding", text: "Tools to build your own profile and online studio." },
];

const plans = [
  { title: "Base License", price: "₹14,999" },
  { title: "Pro Educator", price: "₹24,999", featured: true },
  { title: "Master Trainer", price: "₹39,999" },
];

export default function TeacherTrainingCertificationPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image src="/logo-new.png" alt="Muziclly" width={160} height={72} className={styles.navLogo} />
        </div>
        <button style={{ padding: "0.75rem 1.5rem", borderRadius: 9999, background: "linear-gradient(90deg, rgb(192,132,252), rgb(236,72,153))", border: "none", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "rgba(192,132,252,0.4) 0px 4px 12px" }}>
          Book a Free Demo
        </button>
      </nav>

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Certified Educators • Passionate Musicians</span>
            <h1 className={styles.heroTitle}>
              Become a <span className={styles.gradientTextPurple}>Certified Music Teacher</span>
            </h1>
            <p className={styles.heroDesc}>
              Turn your musical talent into a professional teaching career. Master global pedagogy, E.A.R.S™
              framework, and digital tools.
            </p>
            <div className={styles.heroBtns}>
              <button className={styles.btnPrimary}>Start Certification</button>
              <button className={styles.btnSecondary}>Download Brochure</button>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <Image src="/mhub/teacher-training-certification/hero.jpg" alt="Online Music Teacher" fill sizes="(max-width: 768px) 100vw, 640px" className={styles.heroImage} priority />
            <div className={styles.imgCaption}>
              <p style={{ margin: 0 }}>Join the future of global music education.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why Train with Muziclly?</h2>
          <div className={styles.gridGeneric} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {why.map((w) => (
              <div className={styles.featureCard} key={w.title}>
                <div className={`${styles.featureIcon} ${styles[w.cls]}`}>
                  <w.Icon size={24} />
                </div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>{w.title}</h3>
                <p style={{ fontSize: "0.875rem", color: "rgb(156,163,175)" }}>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.earsSection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <span className={styles.earsSubtitle}>Trademark Core</span>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "3rem", fontFamily: "Fredoka, sans-serif" }}>
            The E.A.R.S™ Framework
          </h2>
          <div className={styles.earsGrid}>
            {ears.map((e) => (
              <div className={styles.earsCard} key={e.letter}>
                <span className={styles.earsWatermark}>{e.letter}</span>
                <div className={styles.earsCardContent}>
                  <div className={styles.earsIconBox}>
                    <e.Icon size={32} className={styles.textPink} />
                  </div>
                  <div className={`${styles.earsBigLetter} ${styles.textPink}`}>{e.letter}</div>
                  <h3 className={styles.earsTitle}>{e.title}</h3>
                  <p className={styles.earsDesc}>{e.desc}</p>
                </div>
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
                Muziclly Ecosystem
              </span>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "1rem", lineHeight: 1.2 }}>Master the M-Lab™</h2>
              <p style={{ color: "rgb(156,163,175)", marginTop: "1rem", maxWidth: "42rem", marginInline: "auto" }}>
                Our proprietary learning lab designed to elevate teaching and practice to professional standards.
              </p>
            </div>
            <div className={styles.mlabGrid}>
              {mlab.map((m) => (
                <div className={styles.mlabItem} key={m.title}>
                  <div className={styles.mlabIcon}>
                    <m.Icon size={24} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: "1.125rem" }}>{m.title}</h4>
                    <p style={{ color: "rgb(107,114,128)", fontSize: "0.875rem" }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "4rem 1rem", background: "linear-gradient(rgba(88,28,135,0.2), transparent)" }}>
        <div style={{ maxWidth: 896, margin: "0 auto", background: "rgba(255,255,255,0.05)", borderRadius: "1.5rem", padding: "2rem", border: "1px solid rgba(255,255,255,0.1)" }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "2rem" }}>Program Highlights</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
            {highlights.map((h) => (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }} key={h.title}>
                <h.Icon size={24} color={h.color} />
                <div>
                  <h4 style={{ fontWeight: 700 }}>{h.title}</h4>
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
              Music Educator &amp; Founder – Muziclly
            </p>
            <ul style={{ marginBottom: "1rem", color: "rgb(209,213,219)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0 }}>
              <li>🏆 Doctorate achievement recognition</li>
              <li>🎵 Degree from KMMC (A.R. Rahman Academy)</li>
            </ul>
            <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", fontStyle: "italic" }}>
              &quot;Our curriculum is designed to transform the way music is taught, ensuring world-class excellence for every student.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>Your Growth Roadmap</h2>
        <div className={styles.levelTabs}>
          <button className={`${styles.levelTab} ${styles.tabActive}`} style={{ textTransform: "capitalize" }}>Associate</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>Professional</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>Master Trainer</button>
        </div>
        <div className={styles.levelContent}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "rgb(192,132,252)" }}>Associate Teacher</h3>
          <p style={{ color: "rgb(156,163,175)" }}>Foundational training in the E.A.R.S™ framework and digital class management. Start teaching beginner batches.</p>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
          <h2 className={styles.sectionTitle}>The Pedagogy of Excellence</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", textAlign: "left" }}>
            {pedagogy.map((p) => (
              <div style={{ background: "rgb(26,26,36)", padding: "2rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }} key={p.title}>
                <h4 className={styles.textTeal} style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{p.title}</h4>
                <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", lineHeight: 1.6 }}>{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "4rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Teacher Resource Toolkit</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1.5rem", textAlign: "center" }}>
            {toolkit.map((t) => (
              <div style={{ background: "rgba(255,255,255,0.05)", padding: "1.5rem", borderRadius: "1rem", border: "1px solid rgba(255,255,255,0.1)" }} key={t.label}>
                <t.Icon size={32} color={t.color} style={{ margin: "0 auto 1rem" }} />
                <p style={{ fontWeight: 700, fontSize: "0.875rem" }}>{t.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(to right, rgba(88,28,135,0.4), rgba(19,78,74,0.4))", padding: "3rem", borderRadius: "2.5rem", border: "1px solid rgba(255,255,255,0.1)", textAlign: "center" }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>Launch Your Career</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "2rem" }}>
              {launch.map((l) => (
                <div key={l.title}>
                  <l.Icon size={32} color={l.color} style={{ margin: "0 auto 1rem" }} />
                  <h5 style={{ fontWeight: 700 }}>{l.title}</h5>
                  <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", marginTop: "0.5rem" }}>{l.text}</p>
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
                <span style={{ fontSize: "0.875rem", fontWeight: 400, color: "rgb(107,114,128)" }}> total</span>
              </div>
              <button style={{ width: "100%", padding: "1rem", borderRadius: "1rem", background: p.featured ? "linear-gradient(to right, rgb(147,51,234), rgb(236,72,153))" : "rgba(255,255,255,0.1)", border: "none", color: "white", fontWeight: 700, marginTop: "auto", cursor: "pointer" }}>
                Enroll Now
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div style={{ gridColumn: "span 2" }}>
            <Image src="/logo-new.png" alt="Muziclly" width={180} height={70} style={{ marginBottom: "1.5rem", width: "10rem", height: "auto" }} />
            <p>Global platform for standardized music education.</p>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Company</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>About Us</li>
              <li>FAQs</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Certification</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>Associate</li>
              <li>Professional</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", opacity: 0.5, fontSize: "0.75rem" }}>
          © 2026 Muziclly Global. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
