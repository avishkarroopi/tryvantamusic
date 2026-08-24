import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

// Recovered from "remaining pages data.zip" / kids keyboard.html.
// Note: the three mentor photos were empty/broken `src` in the recovered
// capture (no image data) — reproduced as placeholder circles rather than
// invented stock photos.
export const metadata: Metadata = {
  title: "Kids Keyboard & Piano Classes | Tryvanta Music M-Hub",
  description: "Building a lifelong love for music through fun, interactive 1-on-1 keyboard & piano sessions designed for ages 5–14.",
};

const timeline = [
  { key: "stepBasics", icon: "✨", title: "Basics", desc: "Finger placement, rhythm basics, and initial keyboard familiarity." },
  { key: "stepSongs", icon: "🎵", title: "Songs", desc: "Playing popular melodies and classic pieces using both hands." },
  { key: "stepTheory", icon: "📖", title: "Theory", desc: "Understanding notation, scales, chords, and musical structures." },
  { key: "stepExams", icon: "🎓", title: "Exams", desc: "Formal assessment and international Trinity certification preparation." },
];

const philosophy = [
  { num: "3", bg: "#E0F2F1", color: "#00D2B4", title: "Attention Span Focused", desc: "Short, high-engagement segments designed specifically for 5–14 year olds." },
  { num: "🙂", bg: "#FFEBEE", color: "#FF7043", title: "Fun Learning", desc: "Gamified progress and creative play keep students excited for every session." },
  { num: "🧘", bg: "#FFF8E1", color: "#FFA000", title: "Built-in Discipline", desc: "Encouraging regular practice habits that translate to academic excellence." },
];

const learn = [
  { key: "featTeal", icon: "👆", title: "Finger Techniques", desc: 'Developing strength, agility, and the "Magic Hand" posture through games.' },
  { key: "featPeach", icon: "🥁", title: "Rhythm & Timing", desc: "Mastering beats and signatures with interactive, pulse-matching challenges." },
  { key: "featYellow", icon: "📖", title: "Reading Notes", desc: "Decoding the language of music effortlessly with our visual method." },
  { key: "featBlue", icon: "🎵", title: "Popular Songs", desc: "Playing hits from favorite movies, games, and modern pop icons." },
  { key: "featPurple", icon: "🎖️", title: "Exam Prep", desc: "Professional guidance for ABRSM and Trinity global certifications." },
];

const mentors = [
  { name: "Sarah Miller", role: "Early Years Coach", bio: "Expert at making lessons fun for ages 5–8 with storytelling." },
  { name: "David Chen", role: "Performance Lead", bio: "Specializes in pop, jazz, and building stage presence for teens." },
  { name: "Emma Rodriguez", role: "Confidence Coach", bio: "Masters in Music Education with 8+ years of online teaching." },
  { name: "James Peterson", role: "Composition Expert", bio: "Inspiring young creators to write their own musical masterpieces." },
];

const pricing = [
  { plan: "Group Class", price: "₹2,500", note: "Billed Annually", features: ["Batch Size: 1:5", "Weekly Live Sessions", "Peer Learning Fun", "Quarterly Recitals"] },
  { plan: "Buddy Class", price: "₹3,500", recommended: true, features: ["Batch Size: 1:2", "More Personal Attention", "Learn with a Friend", "Monthly Progress Reports"] },
  { plan: "Private Class", price: "₹5,500", features: ["Batch Size: 1:1", "100% Focused Attention", "Customized Pace", "Flexible Scheduling"] },
];

const outcomes = [
  { key: "outConfidence", icon: "😁", title: "Confidence", desc: "Through performance opportunities and skill mastery, kids learn to believe in their own creative voice and stage presence." },
  { key: "outDiscipline", icon: "⚡", title: "Discipline", desc: "The habit of regular practice translates into better focus at school and a deeper understanding of hard work and persistence." },
  { key: "outExam", icon: "🏅", title: "Exam Readiness", desc: "Students graduate with globally recognized certificates, proving their technical excellence and theoretical knowledge." },
];

export default function KidsKeyboardPianoPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <Image src="/logo-icon.png" alt="Tryvanta Music" width={48} height={48} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.3rem", color: "inherit" }}>Tryvanta Music</span>
        <a href="#book-demo" className={styles.navCta}>Book Free Demo</a>
      </nav>

      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={`${styles.topBadge} ${styles.animEnter}`}>
            <span className={styles.cardTealDot} style={{ background: "#FF7E35", width: 8, height: 8 }} />
            New Session: Enrolling Now
          </div>
          <h1 className={`${styles.heroTitle} ${styles.animEnter} ${styles.delay1}`}>
            Online Keyboard <br />&amp; <span className={styles.highlightTeal}>Piano Classes</span> <br />for Kids
          </h1>
          <p className={`${styles.heroSubtitle} ${styles.animEnter} ${styles.delay2}`}>
            Building a lifelong love for music through fun, interactive 1-on-1 sessions designed for ages 5–14. No
            prior experience needed.
          </p>
          <div className={`${styles.heroBtnGroup} ${styles.animEnter} ${styles.delay3}`}>
            <a href="#book-demo" className={styles.demoBtn}>
              Book a Free Demo
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a href="#curriculum" className={styles.discoverBtn}>Curriculum</a>
          </div>
          <div className={`${styles.socialProof} ${styles.animEnter} ${styles.delay3}`}>
            <div className={styles.avatars}>
              <Image src="/mhub/kids-keyboard-piano/avatar-1.jpg" alt="Parent" width={40} height={40} className={styles.avatar} />
              <Image src="/mhub/kids-keyboard-piano/avatar-2.jpg" alt="Parent" width={40} height={40} className={styles.avatar} />
              <Image src="/mhub/kids-keyboard-piano/avatar-3.jpg" alt="Parent" width={40} height={40} className={styles.avatar} />
              <div className={styles.avatar} style={{ background: "#FFD54F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: "bold", color: "#333" }}>
                5k+
              </div>
            </div>
            <div className={styles.ratingText}>
              <div className={styles.stars}>★★★★★</div>
              Trusted by 5,000+ parents worldwide
            </div>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.heroSquare}>
            <Image src="/mhub/kids-keyboard-piano/hero.jpg" alt="Happy child playing piano" fill sizes="500px" className={styles.heroImg} priority />
          </div>
          <div className={`${styles.floatCard} ${styles.cardTopLeft}`}>
            <div className={styles.cardIcon}>🏆</div>
            <div className={styles.cardText}>
              <h4>Award Winning</h4>
              <p>Best Music Program 2023</p>
            </div>
          </div>
          <div className={`${styles.floatCard} ${styles.cardBottomRight}`}>
            <div className={styles.cardTealDot} />
            <div className={styles.cardText}>
              <h4>Interactive</h4>
              <p>1-on-1 Live Class</p>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.statsGrid}>
        <div className={`${styles.statCard} ${styles.statTeal}`}>
          <div className={styles.statIconCircle}>📅</div>
          <span className={styles.statValue}>96</span>
          <span className={styles.statLabel}>Live Sessions / <br /> Year</span>
        </div>
        <div className={`${styles.statCard} ${styles.statOrange}`}>
          <div className={styles.statIconCircle}>👥</div>
          <span className={styles.statLabelHighlight}>1:1, 1:2, 1:5</span>
          <span className={styles.statLabel}>Flexible <br /> Batches</span>
        </div>
        <div className={`${styles.statCard} ${styles.statYellow}`}>
          <div className={styles.statIconCircle}>⭐</div>
          <span className={styles.statLabelHighlight} style={{ color: "#5D4037", fontWeight: 800 }}>Trinity-</span>
          <span className={styles.statLabelHighlight} style={{ color: "#5D4037", fontWeight: 800 }}>aligned</span>
          <span className={styles.statLabel}>Global <br /> Curriculum</span>
        </div>
        <div className={`${styles.statCard} ${styles.statTeal}`}>
          <div className={styles.statIconCircle}>🌍</div>
          <span className={styles.statLabelHighlight} style={{ fontWeight: 800 }}>Global</span>
          <span className={styles.statLabel}>Student <br /> Community</span>
        </div>
      </div>

      <section className={styles.learningSection} id="curriculum">
        <div className={styles.learningContainer}>
          <div>
            <h2 className={styles.timelineTitle}>| Learning Progression</h2>
            <div className={styles.timeline}>
              {timeline.map((step) => (
                <div className={`${styles.timelineItem} ${styles[step.key]}`} key={step.title}>
                  <div className={styles.timelineIcon}>{step.icon}</div>
                  <div className={styles.timelineCard}>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className={styles.philosophyTag}>About the Course</span>
            <h2 className={styles.philosophyTitle}>
              Our Teaching <br />
              <span>Philosophy</span>
            </h2>
            <p className={styles.philosophyDesc}>
              We don&apos;t just teach piano; we nurture musical souls. Our curriculum is specifically designed for
              young learners, bridging the gap between digital play and classical mastery.
            </p>
            <div className={styles.philosophyPoints}>
              {philosophy.map((p) => (
                <div className={styles.philPoint} key={p.title}>
                  <div className={styles.philIcon} style={{ background: p.bg, color: p.color }}>{p.num}</div>
                  <div className={styles.philContent}>
                    <h5>{p.title}</h5>
                    <p>{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="#join" className={styles.joinBtn}>
              Join the Journey
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <section className={styles.learnSection}>
        <h2 className={styles.sectionTitle}>What Your Child Will Master</h2>
        <div className={styles.learnGrid}>
          {learn.map((item) => (
            <div className={`${styles.learnItem} ${styles[item.key]}`} key={item.title}>
              <div className={styles.learnIconBox}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Interactive Learning Tools</h2>
        <div className={styles.toolsGrid}>
          <div className={`${styles.toolCard} ${styles.toolPiano}`}>
            <div className={styles.pianoVisual}>
              <div className={styles.keyWhite} />
              <div className={styles.keyBlack} />
              <div className={styles.keyWhite} />
              <div className={styles.keyBlack} />
              <div className={styles.keyTeal} />
              <div className={styles.keyWhite} />
              <div className={styles.keyBlack} />
              <div className={styles.keyWhite} />
            </div>
            <div className={styles.toolContent}>
              <h3>Virtual Piano</h3>
              <p>Real-time MIDI visualizer for every keystroke.</p>
            </div>
          </div>

          <div className={`${styles.toolCard} ${styles.toolMetronome}`}>
            <div style={{ textAlign: "right", fontSize: "0.8rem", opacity: 0.8, marginBottom: "0.5rem" }}>120 BPM</div>
            <div className={styles.metronomeVisual}>
              <div className={styles.bar} />
              <div className={styles.bar} />
              <div className={`${styles.bar} ${styles.barActive}`} />
              <div className={styles.bar} />
              <div className={styles.bar} />
            </div>
            <div className={styles.toolContent}>
              <h3>Smart Metronome</h3>
              <p>Visual rhythm guides that adapt to the student&apos;s pace.</p>
            </div>
          </div>

          <div className={`${styles.toolCard} ${styles.toolTracker}`}>
            <div className={styles.trackerStreak}>
              <span>Weekly Streak</span>
              <span style={{ color: "#00D2B4" }}>5 Days</span>
            </div>
            <div>
              <div className={styles.trackerBar}>
                <div className={styles.trackerFill} style={{ width: "100%" }} />
              </div>
              <div className={styles.trackerBar}>
                <div className={styles.trackerFill} style={{ width: "80%" }} />
              </div>
              <div className={styles.trackerBar}>
                <div className={styles.trackerFill} style={{ width: "40%" }} />
              </div>
            </div>
            <div className={styles.toolContent} style={{ marginTop: "auto" }}>
              <h3>Practice Tracker</h3>
              <p>Building discipline through rewarding daily streaks.</p>
            </div>
          </div>

          <div className={`${styles.toolCard} ${styles.toolSheets}`}>
            <div className={styles.sheetsVisual}>📄</div>
            <div className={styles.toolContent}>
              <h3>Sheet Music Library</h3>
              <p>High-quality PDF notes for every lesson, simplified for young readers and ready to print.</p>
            </div>
          </div>

          <div className={`${styles.toolCard} ${styles.toolClips}`}>
            <div className={styles.clipIcon}>▶️</div>
            <div className={styles.toolContent}>
              <h3>Practice Clips</h3>
              <p>Automatic recording of key milestones to share with family.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.mentorsSection}>
        <span className={styles.mentorBadge}>Expert Mentors</span>
        <h2 className={styles.mentorsTitle}>Learn from certified<br />instructors who love kids</h2>
        <p className={styles.mentorsDesc}>Our teachers are more than musicians—they&apos;re mentors who make every lesson an adventure.</p>
        <div className={styles.mentorGrid}>
          {mentors.map((m) => (
            <div className={styles.mentorCard} key={m.name}>
              <div className={styles.mentorImgWrapper}>
                <div className={styles.certifiedBadge}>
                  <span>✓</span> Certified
                </div>
              </div>
              <h3 className={styles.mentorName}>{m.name}</h3>
              <div className={styles.mentorRole}>{m.role}</div>
              <p className={styles.mentorBio}>{m.bio}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.pricingSection}`}>
        <h2 className={styles.sectionTitle}>Simple, Transparent Pricing</h2>
        <div className={styles.pricingGrid}>
          {pricing.map((p) => (
            <div className={`${styles.priceCard} ${p.recommended ? styles.recommended : ""}`} key={p.plan}>
              {p.recommended && <span className={styles.badge}>MOST POPULAR</span>}
              <span className={styles.planName}>{p.plan}</span>
              <div className={styles.price}>
                {p.price} <span className={styles.period}>/mo</span>
              </div>
              {p.note && <p style={{ color: "#00B894", fontWeight: 600, fontSize: "0.9rem" }}>{p.note}</p>}
              <ul className={styles.featuresList}>
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <a href="#book-demo" className={styles.priceBtn}>Select Plan</a>
            </div>
          ))}
        </div>
        <div className={styles.textCenter}>
          <p className={styles.gstNote}>* GST Applicable on all plans. No-cost EMI available.</p>
        </div>
      </section>

      <section className={styles.outcomesSection}>
        <h2 className={styles.outcomesTitle}>Celebrated Outcomes</h2>
        <p className={styles.outcomesDesc}>We don&apos;t just teach piano; we build the foundational character traits that lead to success in life.</p>
        <div className={styles.outcomesGrid}>
          {outcomes.map((o) => (
            <div className={`${styles.outcomeCard} ${styles[o.key]}`} key={o.title}>
              <div className={styles.outcomeIconCircle}>{o.icon}</div>
              <h3 className={styles.outcomeTitle}>{o.title}</h3>
              <p className={styles.outcomeText}>{o.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="book-demo" className={styles.ctaSection}>
        <h2>Give Your Child the Gift of Music</h2>
        <Link href="/forum-hub" className={styles.whiteBtn}>Book Free Demo Now</Link>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          <div>
            <Image src="/logo-icon.png" alt="Tryvanta Music" width={48} height={48} style={{ objectFit: "contain", marginBottom: "0.75rem" }} />
            <div style={{ fontWeight: 700, fontSize: "1.25rem", marginBottom: "1rem" }}>Tryvanta Music</div>
            <p>Empowering the next generation of musicians.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="#" className={styles.footerLink}>About</a>
            <a href="#curriculum" className={styles.footerLink}>Curriculum</a>
            <a href="#pricing" className={styles.footerLink}>Pricing</a>
          </div>
          <div>
            <h4>Contact</h4>
            <p style={{ color: "#B2BEC3" }}>hello@muzicllyglobal.com</p>
          </div>
        </div>
        <div className={styles.copyright}>© 2026 Tryvanta Music Global. All rights reserved.</div>
      </footer>
    </div>
  );
}
