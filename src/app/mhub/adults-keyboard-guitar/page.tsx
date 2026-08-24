import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Brain,
  Target,
  Smile,
  Ear,
  Keyboard as KeyboardIcon,
  Activity,
  Music2,
  Hand,
  ChartColumn,
  Monitor,
  Calendar,
  Award,
  Users,
  Smartphone,
  CircleCheck,
  Phone,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Keyboard & Guitar Classes for Adults | Tryvanta Music M-Hub",
  description: "Flexible, structured online learning designed for adults. Stress relief, creativity, and musical mastery at your own pace.",
};

const why = [
  { Icon: Clock, cls: "iconPurple", title: "Flexible Timings", text: "Batches designed for the busy professional schedule." },
  { Icon: Brain, cls: "iconTeal", title: "Stress Buster", text: "A creative escape to unwind after a demanding workday." },
  { Icon: Target, cls: "iconPink", title: "Goal Oriented", text: "From your favorite classics to professional certifications." },
  { Icon: Smile, cls: "iconBlue", title: "No Age Barrier", text: "It's never too late to start your musical journey." },
];

const ears = [
  { letter: "E", Icon: Ear, title: "Ear Training", desc: "Develop relative pitch and intuitive listening. Learn to decode melodies and chords directly from your favorite tracks." },
  { letter: "A", Icon: KeyboardIcon, title: "Application", desc: "Stop memorizing and start applying. Bridge the gap between abstract theory and real-world instrument playability." },
  { letter: "R", Icon: Activity, title: "Rhythm", desc: "Internalize the pulse. Master the timing mechanics that define modern genres from jazz fusion to electronic pop." },
  { letter: "S", Icon: Target, title: "Structure", desc: "Architecture of sound. Understand song forms and arrangements to compose or improvise with total confidence." },
];

const mlab = [
  { Icon: KeyboardIcon, title: "Virtual MIDI Keyboard", text: "Interactive guidance for keys and scales." },
  { Icon: Activity, title: "Metronome & Tuner", text: "Professional tools to stay in tune and on time." },
  { Icon: Music2, title: "Scales & Chords", text: "Visualizer for mastering complex harmony." },
  { Icon: Hand, title: "Finger Guidance", text: "Technique drills for hand positioning." },
  { Icon: Ear, title: "Ear Training", text: "E.A.R.S™ aligned tools to build musical hearing." },
  { Icon: ChartColumn, title: "Practice Analytics", text: "Track your progress with data insights." },
];

const highlights = [
  { Icon: Monitor, color: "#a855f7", title: "1:1 Premium Sessions", text: "Personalized focus on your learning style." },
  { Icon: Calendar, color: "#2dd4bf", title: "Self-Paced Progress", text: "No pressure, just pure learning at your pace." },
  { Icon: Award, color: "#fb7185", title: "Certification Prep", text: "Trinity & LCM exam alignment options." },
  { Icon: Users, color: "#60a5fa", title: "Adult Community", text: "Network with fellow adult learners worldwide." },
];

const tools = [
  { Icon: Smartphone, cls: "iconPurple", title: "Companion App", text: "Track daily practice." },
  { Icon: Ear, cls: "iconTeal", title: "Ear Training", text: "Identify notes by ear." },
];

const pricing = [
  { plan: "Group Class", price: "₹2,500", note: "Billed Annually", features: ["Batch Size: 1:5", "Weekly Live Sessions", "Peer Learning Fun", "Quarterly Recitals"] },
  { plan: "Buddy Class", price: "₹3,500", featured: true, features: ["Batch Size: 1:2", "More Personal Attention", "Learn with a Friend", "Monthly Progress Reports"] },
  { plan: "Private Class", price: "₹5,500", features: ["Batch Size: 1:1", "100% Focused Attention", "Customized Pace", "Flexible Scheduling"] },
];

export default function AdultsKeyboardGuitarPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Image src="/logo-icon-dark.png" alt="Tryvanta Music" width={36} height={36} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.1rem", color: "inherit" }}>Tryvanta Music</span>
        <Link href="/forum-hub" className={styles.navBtn}>Book a Free Demo</Link>
      </nav>

      {/* Page-specific floating stack, recovered as-is (placeholder tel/WhatsApp numbers included in the original capture). */}
      <div className={styles.floatingStack}>
        <a href="https://play.google.com/store/apps/details?id=com.muziclly" target="_blank" rel="noopener noreferrer" className={`${styles.floatingCircle} ${styles.floatWhite}`}>
          <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 24, height: 24 }}>
            <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.61 3,21.09 3,20.5M16.81,15.12L18.66,16.17C19.26,16.5 19.5,17.2 19.17,17.81C19.11,17.91 19.04,18.01 18.95,18.1L14.75,13.06L16.81,15.12M20.16,10.81C20.5,11.41 20.26,12.11 19.66,12.44L14.75,15.22L12.56,13.03L20.16,10.81M3.84,2.15L14.75,8.78L12.56,10.97L3.84,2.15Z" />
          </svg>
        </a>
        <a href="tel:+1234567890" className={`${styles.floatingCircle} ${styles.floatTeal}`}>
          <Phone size={24} />
        </a>
        <a href="https://wa.me/1234567890" target="_blank" rel="noopener noreferrer" className={`${styles.floatingCircle} ${styles.floatGreen}`}>
          <svg viewBox="0 0 24 24" style={{ width: 28, height: 28, fill: "currentcolor" }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </div>

      <div className={styles.headerSpacer} />

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Working Professionals • Hobbyists • Returning Learners</span>
            <h1 className={styles.heroTitle}>
              Master <span className={styles.gradientTextPurple}>Keyboard &amp; Guitar</span> from Scratch
            </h1>
            <p className={styles.heroDesc}>
              Flexible, structured online learning designed for adults. Stress relief, creativity, and musical
              mastery at your own pace.
            </p>
            <div className={styles.heroBtns}>
              <Link href="/forum-hub" className={styles.btnPrimary}>Book a Free Demo</Link>
              <a href="#why" className={styles.btnSecondary}>Explore Course</a>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.studentImgCard}>
              <Image src="/mhub/adults-keyboard-guitar/hero.jpg" alt="Keyboard and Guitar Close-up" fill sizes="(max-width: 900px) 100vw, 500px" className={styles.studentImg} priority />
              <div className={styles.imageOverlay}>
                <p className={styles.imageText}>Empower your passion. Elevate your life.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.whySection} id="why">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why Adults Choose Tryvanta Music</h2>
          <div className={styles.whyGrid}>
            {why.map((w) => (
              <div className={styles.whyCard} key={w.title}>
                <div className={`${styles.whyIconBox} ${styles[w.cls]}`}>
                  <w.Icon size={20} />
                </div>
                <h3 className={styles.whyTitle}>{w.title}</h3>
                <p className={styles.whyText}>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.earsSection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ position: "relative", display: "inline-block" }}>
            <span className={styles.earsSubtitle}>Tryvanta Music Methodology</span>
            <h2 className={styles.sectionTitle} style={{ marginBottom: "1rem", position: "relative", zIndex: 10 }}>
              The E.A.R.S™ Framework
            </h2>
          </div>
          <div className={styles.earsGrid}>
            {ears.map((e) => (
              <div className={styles.earsCard} key={e.letter}>
                <div className={styles.earsWatermark}>{e.letter}</div>
                <div className={styles.earsCardContent}>
                  <div className={styles.earsIconBox}>
                    <e.Icon size={32} strokeWidth={1.5} />
                  </div>
                  <div className={styles.earsBigLetter} style={{ color: "rgb(251,113,133)" }}>{e.letter}</div>
                  <h3 className={styles.earsTitle}>{e.title}</h3>
                  <p className={styles.earsDesc}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.mlabSection}>
        <div className={styles.mlabCard}>
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <span style={{ padding: "0.25rem 0.75rem", background: "rgba(20,184,166,0.2)", color: "rgb(45,212,191)", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Tryvanta Music Ecosystem
            </span>
            <h2 className={styles.sectionTitle} style={{ marginTop: "1rem", marginBottom: "1rem" }}>Master with M-Lab™</h2>
            <p style={{ color: "rgb(156,163,175)", maxWidth: "36rem", margin: "0 auto" }}>
              Proprietary lab designed for deep practice, musical ear development, and real-time guidance.
            </p>
          </div>
          <div className={styles.mlabGrid}>
            {mlab.map((m) => (
              <div className={styles.mlabItem} key={m.title}>
                <div className={styles.mlabIcon}>
                  <m.Icon size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.25rem" }}>{m.title}</h4>
                  <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem" }}>{m.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.highlightsSection}>
        <div className={styles.highlightsContainer}>
          <h2 className={styles.sectionTitle} style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>Program Highlights</h2>
          <div className={styles.highlightsGrid}>
            {highlights.map((h) => (
              <div style={{ display: "flex", gap: "1rem" }} key={h.title}>
                <h.Icon size={24} color={h.color} />
                <div>
                  <h4 style={{ fontWeight: 700 }}>{h.title}</h4>
                  <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem" }}>{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.founderSection}>
        <div className={styles.founderCard}>
          <div className={styles.founderImg}>
            <Image src="/founder-guitar.png" alt="Dr. Avishkar Roopi" width={220} height={220} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div className={styles.founderContent}>
            <h2 style={{ fontSize: "1.875rem", fontWeight: 800, marginBottom: "0.25rem" }}>Dr. Avishkar Roopi</h2>
            <p style={{ color: "rgb(45,212,191)", fontWeight: 600, fontSize: "0.875rem", textTransform: "uppercase", marginBottom: "1rem" }}>Founder – Tryvanta Music Global</p>
            <p style={{ color: "rgb(156,163,175)", fontStyle: "italic", fontSize: "1.125rem" }}>
              &quot;Creator of the E.A.R.S™ system, dedicated to bringing professional-grade music education to
              adults everywhere.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>Choose Your Stage</h2>
        <div className={styles.levelTabs}>
          <button className={`${styles.levelTab} ${styles.tabActive}`}>Beginner</button>
          <button className={styles.levelTab}>Intermediate</button>
          <button className={styles.levelTab}>Advanced</button>
          <button className={styles.levelTab}>Expert</button>
        </div>
        <div className={styles.levelContentBox}>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem", color: "rgb(168,85,247)" }}>Beginner: Foundation</h3>
          <p style={{ color: "rgb(156,163,175)" }}>Master the basics, posture, and your first 5 melodies. Perfect for absolute beginners.</p>
        </div>
      </section>

      <section style={{ padding: "4rem 1rem", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: "42rem", margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Practice &amp; Tools</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
            {tools.map((t) => (
              <div className={styles.whyCard} style={{ display: "flex", alignItems: "center", gap: "1rem" }} key={t.title}>
                <div className={`${styles.whyIconBox} ${styles[t.cls]}`}>
                  <t.Icon size={24} />
                </div>
                <div>
                  <h4 style={{ fontWeight: 700 }}>{t.title}</h4>
                  <p style={{ fontSize: "0.75rem", color: "rgb(156,163,175)" }}>{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "1rem" }}>Simple, Transparent Pricing</h2>
        </div>
        <div className={styles.pricingGrid}>
          {pricing.map((p) => (
            <div className={`${styles.pricingCard} ${p.featured ? styles.featuredCard : ""}`} key={p.plan}>
              {p.featured && <div className={styles.popularBadge}>MOST POPULAR</div>}
              <h3 className={styles.planTitle}>{p.plan}</h3>
              <div className={styles.price}>
                {p.price}
                <span className={styles.priceSub}>/mo</span>
              </div>
              {p.note && <p className={styles.planBilled}>{p.note}</p>}
              <ul className={styles.planFeatures}>
                {p.features.map((f) => (
                  <li key={f}>
                    <CircleCheck size={18} className={styles.checkIcon} /> {f}
                  </li>
                ))}
              </ul>
              <button className={p.featured ? styles.btnPriceFeatured : styles.btnPriceStandard}>Select Plan</button>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "6rem 1rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(168,85,247,0.1)", filter: "blur(120px)" }} />
        <div style={{ position: "relative", zIndex: 10 }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "2rem" }}>
            Start your musical <br />
            <span className={styles.gradientTextPurple}>journey today.</span>
          </h2>
          <Link href="/forum-hub" className={styles.btnPrimary} style={{ padding: "1.25rem 2.5rem", fontSize: "1.25rem" }}>
            Book a Free Demo
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div style={{ gridColumn: "span 2" }}>
            <Image src="/logo-icon-dark.png" alt="Tryvanta Music" width={44} height={44} style={{ objectFit: "contain", marginBottom: "0.75rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.2rem", marginBottom: "1rem" }}>Tryvanta Music</div>
            <p>Global platform for premium music learning for all ages.</p>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Explore</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>About Us</li>
              <li>FAQs</li>
              <li>Contact</li>
            </ul>
          </div>
          <div>
            <h5 style={{ color: "white", fontWeight: 700, marginBottom: "1.5rem" }}>Learning</h5>
            <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <li>Keyboard</li>
              <li>Guitar</li>
              <li>Vocal</li>
            </ul>
          </div>
        </div>
        <div style={{ marginTop: "3rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "center", opacity: 0.5 }}>
          © 2026 Tryvanta Music Global. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}
