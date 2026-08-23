import type { Metadata } from "next";
import Image from "next/image";
import {
  MicVocal,
  Headphones,
  Clapperboard,
  Briefcase,
  Ear,
  Keyboard as KeyboardIcon,
  Activity,
  Layers,
  Music2,
  Hand,
  ChartColumn,
  SquareCheckBig,
  Tv,
  Music4,
  AudioWaveform,
  SlidersVertical,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Music Composition, Audio Engineering & Mastering | Muziclly M-Hub",
  description: "The definitive program to master the art of production. Build your portfolio and sound like a pro with industry-standard workflows.",
};

const why = [
  { Icon: MicVocal, cls: "iconPurple", title: "Pro Workflows", text: "Learn the exact signal chain used by professional engineers." },
  { Icon: Headphones, cls: "iconTeal", title: "Sonic Accuracy", text: "Critical listening and frequency identification training." },
  { Icon: Clapperboard, cls: "iconPink", title: "Industry Ready", text: "Portfolio-focused projects for film, games, and media." },
  { Icon: Briefcase, cls: "iconBlue", title: "Career Launch", text: "Placement support and freelance business modules." },
];

const ears = [
  { letter: "E", Icon: Ear, title: "Ear Training", desc: "Develop relative pitch and intuitive listening. Learn to decode melodies and chords directly from your favorite tracks." },
  { letter: "A", Icon: KeyboardIcon, title: "Application", desc: "Stop memorizing and start applying. Bridge the gap between abstract theory and real-world instrument playability." },
  { letter: "R", Icon: Activity, title: "Rhythm", desc: "Internalize the pulse. Master the timing mechanics that define modern genres from jazz fusion to electronic pop." },
  { letter: "S", Icon: Layers, title: "Structure", desc: "Architecture of sound. Understand song forms and arrangements to compose or improvise with total confidence." },
];

const mlab = [
  { Icon: KeyboardIcon, title: "Virtual MIDI Keyboard", text: "Integrated keyboard for real-time guidance and visualization." },
  { Icon: Activity, title: "Metronome & Tuner", text: "Professional grade timing and instrument tuning tools." },
  { Icon: Music2, title: "Scales & Chords", text: "Interactive visualizer for mastering harmony and melodies." },
  { Icon: Hand, title: "Finger Guidance", text: "Visual aids for perfect technique and hand positioning." },
  { Icon: Ear, title: "Ear Training Tools", text: "E.A.R.S™ core drills to build your professional musical ear." },
  { Icon: ChartColumn, title: "Practice Analytics", text: "Track progress and session intensity with data insights." },
];

const highlights = [
  { Icon: Layers, color: "#c084fc", title: "Comprehensive Tracks", text: "Composition, Engineering, and Mastering tracks." },
  { Icon: SquareCheckBig, color: "#2dd4bf", title: "128 Pro Sessions", text: "Intensive live training over 18 months." },
  { Icon: Headphones, color: "#fb7185", title: "Global Benchmarking", text: "Portfolio reviews by international producers." },
  { Icon: Tv, color: "#60a5fa", title: "DAW Agnostic", text: "Logic Pro, Ableton, and Pro Tools coverage." },
];

const arsenal = [
  { Icon: Music4, cls: "msgLogic", color: "#c084fc", title: "Logic Pro X" },
  { Icon: AudioWaveform, cls: "msgAbleton", color: "#2dd4bf", title: "Ableton Live" },
  { Icon: SlidersVertical, cls: "msgProTools", color: "#fb7185", title: "Pro Tools" },
  { Icon: KeyboardIcon, cls: "msgMidi", color: "#60a5fa", title: "MIDI Systems" },
];

const projects = [
  { num: "01", color: "#c084fc", bg: "rgba(168,85,247,0.2)", title: "Original Score", text: "Compose and produce music for a 2-minute cinematic trailer." },
  { num: "02", color: "#2dd4bf", bg: "rgba(45,212,191,0.2)", title: "Studio Session", text: "Engineer a live vocal and instrument recording track." },
];

const plans = [
  { title: "Certification Track", price: "₹4,999" },
  { title: "Professional Diploma", price: "₹8,499", featured: true },
  { title: "1:1 Mentorship", price: "₹12,999" },
];

export default function MusicCompositionAudioPage() {
  return (
    <div className={styles.container}>
      <nav style={{ position: "sticky", top: 0, zIndex: 1000, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "0.5rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Image src="/logo-new.png" alt="Muziclly" width={160} height={56} style={{ height: "3.5rem", width: "auto" }} />
        <button className={styles.btnPrimary} style={{ padding: "0.75rem 2rem", fontSize: "1rem", borderRadius: 9999, background: "linear-gradient(to right, rgb(168,85,247), rgb(236,72,153))", boxShadow: "rgba(168,85,247,0.4) 0px 4px 12px" }}>
          Book a Free Demo
        </button>
      </nav>

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Aspiring Producers • Film Composers • Indie Artists</span>
            <h1 className={styles.heroTitle}>
              Music Composing, <br />
              <span>Audio Engineering &amp; Mastering</span>
            </h1>
            <p className={styles.heroDesc}>
              The definitive program to master the art of production. Build your portfolio and sound like a pro
              with industry-standard workflows.
            </p>
            <div className={styles.heroBtns}>
              <button className={styles.btnPrimary}>Book Free Career Demo</button>
              <button className={styles.btnSecondary}>Explore Tracks</button>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.studentImgCard}>
              <Image src="/mhub/music-composition-audio/hero.jpg" alt="Audio Console Mixing" fill sizes="(max-width: 1024px) 100vw, 480px" className={styles.studentImg} priority />
              <div className={styles.imageOverlay}>
                <p className={styles.imageText}>From concept to console. Master your sound.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why Producers Choose Muziclly</h2>
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
          <span className={styles.earsSubtitle}>Core Methodology</span>
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
              <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "1rem", lineHeight: 1.2 }}>Master with M-Lab™</h2>
              <p style={{ color: "rgb(156,163,175)", marginTop: "1rem", maxWidth: "42rem", marginInline: "auto" }}>
                Our proprietary high-fidelity learning lab designed to elevate practice and lessons to professional standards.
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
                    <p style={{ color: "rgb(107,114,128)", fontSize: "0.875rem" }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.highlightsSection}>
        <div className={styles.highlightsContainer}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "2rem" }}>Program Highlights</h2>
          <div className={styles.highlightsGrid}>
            {highlights.map((h) => (
              <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }} key={h.title}>
                <h.Icon size={24} color={h.color} />
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
              Music Educator &amp; Founder – Muziclly
            </p>
            <ul style={{ marginBottom: "1rem", color: "rgb(209,213,219)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem", listStyle: "none", padding: 0 }}>
              <li>🏆 Doctorate achievement recognition</li>
              <li>🎵 Degree from KMMC (A.R. Rahman Academy)</li>
            </ul>
            <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", fontStyle: "italic" }}>
              &quot;Dedicated to transforming technical audio skills into powerful musical statements for the global industry.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>Choose Your Specialization</h2>
        <div className={styles.levelTabs}>
          <button className={`${styles.levelTab} ${styles.tabActive}`} style={{ textTransform: "capitalize" }}>composing</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>engineering</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>Mixing &amp; Mastering</button>
        </div>
        <div className={styles.levelContent}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "rgb(192,132,252)" }}>Music Composition</h3>
          <p style={{ color: "rgb(156,163,175)" }}>Learn songwriting, orchestration, and thematic development for film, games, and modern media.</p>
        </div>
      </section>

      <section className={styles.arsenalSection}>
        <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
          <h2 className={styles.sectionTitle}>Software &amp; Hardware Arsenal</h2>
          <div className={styles.arsenalGrid}>
            {arsenal.map((a) => (
              <div className={`${styles.arsenalCard} ${styles[a.cls]}`} key={a.title}>
                <div className={styles.arsenalIcon}>
                  <a.Icon size={40} color={a.color} />
                </div>
                <p className={styles.arsenalTitle}>{a.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ background: "linear-gradient(to right, rgba(88,28,135,0.4), rgba(19,78,74,0.4))", padding: "3rem", borderRadius: "2.5rem", border: "1px solid rgba(255,255,255,0.1)" }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "2.5rem" }}>Real-World Projects</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
              {projects.map((p) => (
                <div style={{ display: "flex", gap: "1rem" }} key={p.num}>
                  <div style={{ width: "3rem", height: "3rem", background: p.bg, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: p.color, fontWeight: 700 }}>
                    {p.num}
                  </div>
                  <div>
                    <h4 className={styles.fontBold}>{p.title}</h4>
                    <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", marginTop: "0.5rem" }}>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "8rem 1rem 6rem", background: "rgb(13,13,18)" }}>
        <div className={styles.plansGrid}>
          {plans.map((p) => (
            <div className={`${styles.planCard} ${p.featured ? styles.planCardFeatured : ""}`} key={p.title}>
              <h3 className={styles.planTitle}>{p.title}</h3>
              <div className={styles.planPrice}>
                {p.price}
                <span>/mo</span>
              </div>
              <button className={`${styles.btnPlan} ${p.featured ? styles.btnPlanFeatured : ""}`}>Enroll Now</button>
            </div>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div style={{ gridColumn: "span 2" }}>
            <Image src="/logo-new.png" alt="Muziclly" width={180} height={70} style={{ marginBottom: "1.5rem", width: "10rem", height: "auto" }} />
            <p>Global standard for production education.</p>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Explore</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>About Us</li>
              <li>FAQs</li>
              <li>Blog</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Tracks</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>Composition</li>
              <li>Audio Engineering</li>
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
