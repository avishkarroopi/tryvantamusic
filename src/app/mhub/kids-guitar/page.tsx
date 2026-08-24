import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Users, Video, PartyPopper, Music, Ear, Music2, Star, Activity, Radio, ChartColumn, Award, Clock, CircleCheck } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Online Guitar Classes for Kids | Tryvanta Music M-Hub",
  description: "Spark their musical journey with fun, 1-on-1 online guitar lessons tailored for ages 6 to 15. From first chords to favorite songs.",
};

const benefits = [
  { Icon: Users, bg: "rgb(255,236,230)", color: "rgb(255,126,53)", title: "Expert Tutors", text: "Certified instructors who specialize in teaching kids patience and rhythm." },
  { Icon: Video, bg: "rgb(255,248,225)", color: "rgb(251,192,45)", title: "1-on-1 Focus", text: "Personalized attention to help your child master songs faster than group classes." },
  { Icon: PartyPopper, bg: "rgb(224,242,241)", color: "rgb(0,210,180)", title: "Fun Curriculum", text: 'No boring drills. We teach them the songs they actually want to play.' },
];

const features = [
  { Icon: Music, cls: "iconPurple", title: "Finger Gym", text: "Scientific exercises to build finger strength and independence." },
  { Icon: Ear, cls: "iconTeal", title: "Pitch Perfect", text: "Ear-hand synchronization to play melodies by hearing them." },
  { Icon: Music2, cls: "iconPink", title: "Contemporary Focus", text: "Learn rock, pop, blues, and jazz with a solid foundation." },
  { Icon: Star, cls: "iconBlue", title: "Stage Ready", text: "Exclusive training on performance posture and stage presence." },
];

const earsFramework = [
  { icon: "👂", cls: "borderPurple", title: "Ear", sub: "Analysis" },
  { icon: "🎸", cls: "borderTeal", title: "Application", sub: "Fretboard Logic" },
  { icon: "🥁", cls: "borderPink", title: "Rhythm", sub: "& Strumming" },
  { icon: "📜", cls: "borderWhite", title: "Structure", sub: "& Theory" },
];

const mlabFeatures = [
  { Icon: Activity, title: "Chord Visualizer", text: "See your chords in real-time to perfect every shape." },
  { Icon: Music, title: "Scale Engine", text: "Interactive scale practice with guided note accuracy." },
  { Icon: Radio, title: "Rhythm Tracker", text: "Master your strumming patterns and tempo holding." },
  { Icon: Ear, title: "Ear Training Drills", text: "Daily interval training and chord recognition games." },
  { Icon: ChartColumn, title: "Practice Analytics", text: "Data-driven insights into your practice consistency." },
  { Icon: Users, title: "Jam Mode", text: "Simulate band environments for better timing." },
];

const masteryCycle = [
  { num: "01", bg: "rgba(168,85,247,0.2)", color: "rgb(192,132,252)", title: "Internalize (Ear)", text: "Hearing the chord progression before playing it." },
  { num: "02", bg: "rgba(45,212,191,0.2)", color: "rgb(45,212,191)", title: "Execute (Hands)", text: "Perfecting muscle memory for clean chord transitions." },
  { num: "03", bg: "rgba(251,113,133,0.2)", color: "rgb(251,113,133)", title: "Express (Soul)", text: "Adding dynamics and feel to your solos." },
];

const pricing = [
  { plan: "Group Class", price: "₹2,500", note: "Billed Annually", features: ["Batch Size: 1:5", "Weekly Live Sessions", "Peer Learning Fun", "Quarterly Recitals"] },
  { plan: "Buddy Class", price: "₹3,500", featured: true, features: ["Batch Size: 1:2", "More Personal Attention", "Learn with a Friend", "Monthly Progress Reports"] },
  { plan: "Private Class", price: "₹5,500", features: ["Batch Size: 1:1", "100% Focused Attention", "Customized Pace", "Flexible Scheduling"] },
];

export default function KidsGuitarPage() {
  return (
    <div className={styles.container}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Star size={14} fill="#FF7E35" /> NEW FOR 2026
          </div>
          <h1 className={styles.heroTitle}>
            Online Guitar<br />
            <span className={styles.orangeText}>Classes</span> for<br />Kids
          </h1>
          <p className={styles.heroDesc}>
            Spark their musical journey with fun, 1-on-1 online lessons tailored for ages 6 to 15. From first chords
            to favorite songs.
          </p>
          <div className={styles.heroBtns}>
            <Link href="/forum-hub" className={styles.btnPrimary}>Book a Free Demo</Link>
            <a href="#why" className={styles.btnSecondary}>See How It Works</a>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroImageFrame}>
            <Image src="/mhub/kids-guitar/hero.jpg" alt="Happy Kid Playing Guitar" fill sizes="500px" className={styles.heroImg} priority />
            <div className={`${styles.floatCard} ${styles.floatAges}`}>
              <span style={{ color: "rgb(255,126,53)" }}>☺</span> Ages 6-15
            </div>
            <div className={`${styles.floatCard} ${styles.floatIcon1}`}>
              <div style={{ fontSize: "1.5rem" }}>🎸</div>
            </div>
            <div className={`${styles.floatCard} ${styles.floatIcon2}`}>
              <div style={{ fontSize: "1.5rem" }}>🎓</div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.benefitsSection}>
        <div className={styles.benefitsGrid}>
          {benefits.map((b) => (
            <div className={styles.benefitCard} key={b.title}>
              <div className={styles.benefitIconBox} style={{ background: b.bg, color: b.color }}>
                <b.Icon size={28} />
              </div>
              <h3 className={styles.benefitTitle}>{b.title}</h3>
              <p className={styles.benefitText}>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.whySection} id="why">
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h2 className={styles.sectionTitle}>Why guitarists choose Tryvanta Music?</h2>
          <div className={styles.gridFour}>
            {features.map((f) => (
              <div className={styles.featureCard} key={f.title}>
                <div className={`${styles.featureIcon} ${styles[f.cls]}`}>
                  <f.Icon size={24} />
                </div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureText}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.earsSection}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <span style={{ color: "rgb(255,126,53)", fontWeight: 700, letterSpacing: "0.1em", fontSize: "0.875rem", textTransform: "uppercase" }}>
            Trademark Core
          </span>
          <h2 className={styles.sectionTitle}>The E.A.R.S™ Framework</h2>
          <div className={styles.earsGrid}>
            {earsFramework.map((e) => (
              <div className={`${styles.earsCard} ${styles[e.cls]}`} key={e.title}>
                <span className={styles.earsIcon}>{e.icon}</span>
                <h3 className={styles.earsText}>{e.title}</h3>
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
              <span style={{ padding: "0.5rem 1.25rem", background: "rgba(45,212,191,0.15)", color: "rgb(45,212,191)", borderRadius: 9999, fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Digital Learning Ecosystem
              </span>
              <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginTop: "1.5rem", lineHeight: 1.2, color: "white" }}>Master with M-Lab™</h2>
              <p style={{ color: "rgb(148,163,184)", marginTop: "1rem", maxWidth: "42rem", marginInline: "auto", fontSize: "1.1rem" }}>
                Proprietary guitar analysis tools designed to give players real-time visual feedback on chords and
                performance.
              </p>
            </div>
            <div className={styles.mlabGrid}>
              {mlabFeatures.map((f) => (
                <div className={styles.mlabItem} key={f.title}>
                  <div className={styles.mlabIcon}>
                    <f.Icon size={24} />
                  </div>
                  <div>
                    <h4 className={styles.mlabTitle}>{f.title}</h4>
                    <p className={styles.mlabText}>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <ul style={{ marginBottom: "1rem", color: "rgb(209,213,219)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award size={16} className={styles.textPurple} /> Doctorate achievement recognition
              </li>
              <li style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Music size={16} className={styles.textPurple} /> Degree from KMMC (A.R. Rahman Academy)
              </li>
            </ul>
            <p style={{ color: "rgb(156,163,175)", fontSize: "0.875rem", fontStyle: "italic" }}>
              &quot;Playing guitar is a science of the ear as much as it is an art of the hands. We build guitarists
              who don&apos;t just hit notes, but understand them.&quot;
            </p>
          </div>
        </div>
      </section>

      <section className={styles.levelsSection}>
        <h2 className={styles.sectionTitle}>Your Guitar Journey</h2>
        <div className={styles.levelTabs}>
          <button className={`${styles.levelTab} ${styles.tabActive}`} style={{ textTransform: "capitalize" }}>basic</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>intermediate</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>advanced</button>
          <button className={styles.levelTab} style={{ textTransform: "capitalize" }}>expert</button>
        </div>
        <div className={styles.levelContent}>
          <div className={styles.levelGrid}>
            <div>
              <h3 className={styles.levelTitle} style={{ color: "rgb(255,126,53)" }}>Basic: Discovery</h3>
              <p className={styles.levelDesc}>Hold the pick correctly, master open chords, and strum your first 3 songs with rhythm.</p>
              <div className={styles.levelFeatures}>
                {["Master Open Chords (C, G, D, Em)", "Strumming Patterns & Timing", "Play Your First 3 Songs"].map((f) => (
                  <div className={styles.levelFeatureItem} key={f}>
                    <CircleCheck size={18} color="#FF7E35" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
              <div className={styles.levelDuration}>
                <Clock size={16} /> <span>Months 1-3</span>
              </div>
            </div>
            <div className={styles.levelVisual}>
              <div style={{ width: "100%", height: "100%", background: "rgba(255,126,53,0.125)", borderRadius: "1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music2 size={64} color="#FF7E35" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: "5rem 1rem", background: "rgba(255,255,255,0.02)" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", textAlign: "center" }}>
          <h2 className={styles.sectionTitle}>The Guitar Mastery Cycle</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem" }}>
            {masteryCycle.map((c) => (
              <div style={{ background: "rgb(26,26,36)", padding: "2rem", borderRadius: "1.5rem", border: "1px solid rgba(255,255,255,0.1)" }} key={c.num}>
                <div style={{ width: "3rem", height: "3rem", background: c.bg, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem", color: c.color, fontWeight: 700 }}>
                  {c.num}
                </div>
                <h4 style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{c.title}</h4>
                <p style={{ fontSize: "0.875rem", color: "rgb(107,114,128)" }}>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.pricingSection}>
        <h2 style={{ fontSize: "2.5rem", fontWeight: 900, marginBottom: "0.5rem", color: "rgb(45,52,54)" }}>Simple, Transparent Pricing</h2>
        <div className={styles.pricingGrid}>
          {pricing.map((p) => (
            <div className={`${styles.pricingCard} ${p.featured ? styles.pricingCardFeatured : ""}`} key={p.plan}>
              {p.featured && <div className={styles.popularBadge}>Most Popular</div>}
              <h3 className={styles.planTitle}>{p.plan}</h3>
              <div className={styles.planPrice}>
                {p.price}
                <span className={styles.planPeriod}>/mo</span>
              </div>
              {p.note && <div className={styles.planSubtitle}>{p.note}</div>}
              <ul className={styles.planFeatures} style={!p.note ? { marginTop: "2.5rem" } : undefined}>
                {p.features.map((f) => (
                  <li className={styles.planFeatureItem} key={f}>
                    <CircleCheck size={18} color="#00b894" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`${styles.pricingBtn} ${p.featured ? styles.btnSolid : styles.btnOutline}`}>Select Plan</button>
            </div>
          ))}
        </div>
        <div className={styles.pricingFooter}>* GST Applicable on all plans. No-cost EMI available.</div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <Image src="/logo-new.png" alt="Tryvanta Music" width={140} height={42} className={styles.footerLogo} />
            <p style={{ maxWidth: 300, lineHeight: 1.6 }}>
              The global benchmark for online music education. Creating a generation of skilled, passionate
              musicians.
            </p>
          </div>
          <div>
            <h5 className={styles.footerHeading}>Company</h5>
            <ul className={styles.footerLinks}>
              <li className={styles.footerLink}>About Us</li>
              <li className={styles.footerLink}>Careers</li>
              <li className={styles.footerLink}>FAQs</li>
              <li className={styles.footerLink}>Contact</li>
            </ul>
          </div>
          <div>
            <h5 className={styles.footerHeading}>Guitar</h5>
            <ul className={styles.footerLinks}>
              <li className={styles.footerLink}>Acoustic Guitar</li>
              <li className={styles.footerLink}>Electric Guitar</li>
              <li className={styles.footerLink}>Classical Guitar</li>
              <li className={styles.footerLink}>Ukulele</li>
            </ul>
          </div>
        </div>
        <div className={styles.copyright}>© 2026 Tryvanta Music Global. All Rights Reserved.</div>
      </footer>
    </div>
  );
}
