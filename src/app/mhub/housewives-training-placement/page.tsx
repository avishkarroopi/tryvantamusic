import type { Metadata } from "next";
import Image from "next/image";
import {
  House,
  Clock,
  UserCheck,
  Award,
  Sparkles,
  IndianRupee,
  Smile,
  Ear,
  Keyboard as KeyboardIcon,
  Timer,
  Compass,
  Activity,
  Music2,
  Hand,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Housewives Training & Placement | Tryvanta Music M-Hub",
  description: "Professional music training, certification, and home-based income opportunities designed specifically for Indian housewives.",
};

const introCards = [
  { Icon: House, label: "Learn at Home" },
  { Icon: Clock, label: "Flexible Timing" },
  { Icon: UserCheck, label: "Women Mentors" },
  { Icon: Award, label: "Global License" },
];

const whyCards = [
  { Icon: Sparkles, title: "Self-Identity", text: "Rediscover your artistic side and build a professional name beyond home duties." },
  { Icon: IndianRupee, title: "Financial Growth", text: "Create a sustainable secondary income stream by teaching kids in your society." },
  { Icon: Smile, title: "Mental Wellness", text: "Music acts as a therapeutic escape, reducing daily stress and boosting happiness." },
];

const ears = [
  { letter: "E", Icon: Ear, title: "Ear Training", desc: "Develop relative pitch and intuitive listening. Learn to decode melodies and chords directly from hearing." },
  { letter: "A", Icon: KeyboardIcon, title: "Application", desc: "Stop memorizing and start applying. Bridge the gap between abstract music theory and real instrument playability." },
  { letter: "R", Icon: Timer, title: "Rhythm", desc: "Internalize the pulse. Master the timing mechanics that define genres from Indian classical to modern pop." },
  { letter: "S", Icon: Compass, title: "Structure", desc: "Architecture of sound. Understand song forms and arrangements to compose or improvise with total confidence." },
];

const roadmap = [
  { step: "1", title: "Foundation (0-3 Months)", desc: "Master the basics. Build a strong musical foundation using our simplified E.A.R.S™ technique designed for beginners." },
  { step: "2", title: "Proficiency (4-8 Months)", desc: "Advance your skills. Learn to play complex songs, read notation, and start understanding the pedagogy of teaching." },
  { step: "3", title: "Certification & Placement", desc: "Earn your Global Teaching License. We guide you to your first batch of students and help you set up your home studio." },
];

const mlab = [
  { Icon: KeyboardIcon, title: "Virtual MIDI Keyboard", text: "Learn keys right on your screen." },
  { Icon: Activity, title: "Metronome & Tuner", text: "Stay in time and in tune perfectly." },
  { Icon: Music2, title: "Scales & Chords", text: "Interactive visualizer for practice." },
  { Icon: Hand, title: "Finger Guidance", text: "Real-time posture and positioning help." },
  { Icon: Ear, title: "Ear Training Tools", text: "E.A.R.S™ aligned pitch drills." },
];

const mentors = [
  { name: "Meera", role: "Keyboard Expert", img: "/mhub/housewives-training-placement/mentor-meera.jpg" },
  { name: "Anjali", role: "Guitar Mentor", img: "/mhub/housewives-training-placement/mentor-anjali.jpg" },
  { name: "Priya", role: "Vocal Coach", img: "/mhub/housewives-training-placement/mentor-priya.jpg" },
  { name: "Shweta", role: "Music Theory", img: "/mhub/housewives-training-placement/mentor-shweta.jpg" },
];

export default function HousewivesTrainingPlacementPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Image src="/logo-new.png" alt="Tryvanta Music" width={160} height={40} className={styles.navLogo} />
        </div>
        <button style={{ padding: "0.75rem 1.5rem", borderRadius: 9999, background: "rgb(219,39,119)", border: "none", color: "white", fontWeight: 700, cursor: "pointer", boxShadow: "rgba(219,39,119,0.3) 0px 4px 12px" }}>
          Start Free Demo
        </button>
      </nav>

      <section className={styles.heroSection}>
        <div className={styles.heroGlow} />
        <div className={styles.heroGrid}>
          <div className={styles.heroContent}>
            <span className={styles.heroBadge}>Safe &amp; Trusted Indian Community</span>
            <h1 className={styles.heroTitle}>
              Turn Your Musical Passion into a <br />
              <span className={styles.pinkGradientText}>Respected Career</span>
            </h1>
            <p className={styles.heroDesc}>
              Professional music training, certification, and home-based income opportunities designed
              specifically for Indian housewives.
            </p>
            <div className={styles.heroBtns}>
              <button>Start Free Demo</button>
              <button>How it Works</button>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <Image src="/mhub/housewives-training-placement/hero.jpg" alt="Two women playing music together" fill sizes="(max-width: 768px) 100vw, 600px" className={styles.heroImage} priority />
            <div className={styles.imgCaption}>&quot;Learning with dignity, comfort, and confidence&quot;</div>
          </div>
        </div>
      </section>

      <section className={styles.introSection}>
        <div className={styles.introContainer}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: "1.5rem" }}>Learn from Home, Grow with Dignity</h2>
          <p style={{ color: "rgb(75,85,99)", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            Tryvanta Music offers a flexible, home-friendly environment where you can master your favorite instrument and
            earn a professional certification between your family responsibilities.
          </p>
          <div className={styles.gridIntro}>
            {introCards.map((c) => (
              <div className={styles.introCard} key={c.label}>
                <c.Icon size={32} className={styles.textPink} style={{ margin: "0 auto 0.5rem" }} />
                <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "rgb(157,23,77)" }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.whySection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why Housewife Love Tryvanta Music</h2>
          <div className={styles.gridThree}>
            {whyCards.map((w) => (
              <div className={styles.softCard} style={{ padding: "2rem", textAlign: "center" }} key={w.title}>
                <div style={{ width: "4rem", height: "4rem", background: "rgb(252,231,243)", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem", color: "rgb(219,39,119)" }}>
                  <w.Icon size={32} />
                </div>
                <h4 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem" }}>{w.title}</h4>
                <p style={{ fontSize: "0.875rem" }}>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.earsSection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <span className={styles.earsSubtitle}>Proprietary Method</span>
          <h2 style={{ fontSize: "2.5rem", fontWeight: 800, marginTop: "0.5rem", marginBottom: "3rem", color: "white", fontFamily: "Fredoka, sans-serif" }}>
            The E.A.R.S™ Advantage
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

      <section className={styles.roadmapSection}>
        <div style={{ maxWidth: 896, margin: "0 auto 4rem", textAlign: "center" }}>
          <span style={{ color: "rgb(219,39,119)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
            Your Growth Path
          </span>
          <h2 className={styles.sectionTitle} style={{ marginTop: "0.5rem" }}>Your Journey Roadmap</h2>
        </div>
        <div className={styles.timelineContainer}>
          <div className={styles.timelineConnector} />
          {roadmap.map((r) => (
            <div className={styles.timelineItem} key={r.step}>
              <div className={`${styles.timelineMarker} ${styles.pulse}`}>{r.step}</div>
              <div className={styles.timelineContentBox}>
                <h4 className={styles.stepTitle}>{r.title}</h4>
                <p className={styles.stepDesc}>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.mlabSection}>
        <div style={{ maxWidth: 1024, margin: "0 auto" }}>
          <div className={styles.mlabCard}>
            <div style={{ textAlign: "center", marginBottom: "3rem" }}>
              <span style={{ padding: "0.375rem 1rem", background: "rgb(252,231,243)", color: "rgb(219,39,119)", borderRadius: 9999, fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Proprietary Lab
              </span>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "1rem", color: "rgb(31,41,55)" }}>Master with M-Lab™</h2>
            </div>
            <div className={styles.mlabGrid}>
              {mlab.map((m) => (
                <div className={styles.mlabItemCard} key={m.title}>
                  <div className={styles.mlabIcon}>
                    <m.Icon size={32} />
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: "1.125rem", marginBottom: "0.25rem" }}>{m.title}</h4>
                    <p style={{ color: "rgb(107,114,128)", fontSize: "0.875rem" }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mentorsSection}>
        <div style={{ maxWidth: 1024, margin: "0 auto 3rem", textAlign: "center" }}>
          <span style={{ color: "rgb(219,39,119)", fontWeight: 700, textTransform: "uppercase", fontSize: "0.875rem", letterSpacing: "0.1em" }}>
            Community Leaders
          </span>
          <h2 className={styles.sectionTitle} style={{ marginTop: "0.5rem" }}>Supportive Women Mentors</h2>
        </div>
        <div className={styles.mentorsGrid}>
          {mentors.map((m) => (
            <div className={styles.mentorCard} key={m.name}>
              <div className={styles.mentorImg}>
                <Image src={m.img} alt={m.name} width={96} height={96} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "9999px" }} />
              </div>
              <h4 className={styles.mentorName}>{m.name}</h4>
              <p className={styles.mentorRole}>{m.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.founderSection}>
        <div className={styles.founderContainer}>
          <div className={styles.founderCard}>
            <div className={styles.founderImg}>
              <Image src="/founder-guitar.png" alt="Dr. Avishkar Roopi" width={192} height={192} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 800, marginBottom: "0.5rem", color: "rgb(31,41,55)" }}>Dr. Avishkar Roopi</h2>
              <ul style={{ listStyle: "none", padding: 0, marginBottom: "1rem", fontSize: "0.875rem", color: "rgb(75,85,99)", fontWeight: 500, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <li>🎓 Doctorate Award Recipient</li>
                <li>🎵 Degree from KMMC (A.R. Rahman Academy)</li>
                <li>🌍 Course designed with global experts</li>
                <li>👩‍🏫 Mentored 1500+ students &amp; 200+ teachers</li>
                <li>💡 Introduced global E.A.R.S™ system</li>
              </ul>
              <p style={{ color: "rgb(107,114,128)", fontSize: "0.875rem", fontStyle: "italic" }}>
                &quot;Empowering the homemakers of India with the power of music.&quot;
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <h2 style={{ fontSize: "2.25rem", fontWeight: 900, marginBottom: "2.5rem", color: "rgb(31,41,55)" }}>Start Your Musical Journey Today</h2>
        <button style={{ padding: "1.25rem 2.5rem", borderRadius: "1.5rem", background: "rgb(219,39,119)", color: "white", fontWeight: 700, fontSize: "1.25rem", marginBottom: "4rem", border: "none", cursor: "pointer", boxShadow: "rgba(0,0,0,0.1) 0px 10px 15px -3px" }}>
          Free Career Demo
        </button>
        <div className={styles.footerGrid}>
          <div style={{ textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
              <Image src="/logo-new.png" alt="Tryvanta Music" width={160} height={60} className={styles.footerLogo} />
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "2rem", justifyContent: "center", marginTop: "1rem" }}>
              <li style={{ fontWeight: 600, color: "rgb(31,41,55)" }}>Home</li>
              <li style={{ fontWeight: 600, color: "rgb(31,41,55)" }}>Courses</li>
              <li style={{ fontWeight: 600, color: "rgb(31,41,55)" }}>Mentors</li>
              <li style={{ fontWeight: 600, color: "rgb(31,41,55)" }}>Contact</li>
            </ul>
          </div>
        </div>
        <p style={{ marginTop: "2rem", fontSize: "0.75rem", fontWeight: 500, color: "rgb(156,163,175)" }}>© 2026 Tryvanta Music Global. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
