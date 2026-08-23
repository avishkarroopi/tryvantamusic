import type { Metadata } from "next";
import Image from "next/image";
import styles from "@/components/TeamProfile/TeamProfile.module.css";

// Recovered from "remaining pages data.zip" / rajanikanth.html — a standalone
// executive-profile page sharing the same bespoke dark/gold theme as
// /trideep (own inline styles, no site Navbar/Footer), matching evidence.
export const metadata: Metadata = {
  title: "Rajanikanth Mattepally | Muziclly Global",
  description: "Chief Strategic Relations Officer at Muziclly Global.",
};

const wireItems = [
  "Bharat Gaurav Ratna Samman Awardee",
  "Honorary Doctorate — WEAPC",
  "25+ Years Journalism Leadership",
  "National Council Member, Indian Journalists Union",
  "Strategic Partnerships Specialist",
  "CSRO, Muziclly Global",
];

const mission = [
  { title: "Global Learning Ecosystem", desc: "A connected network of music education spanning geographies and institutions." },
  { title: "AI-Powered Learning", desc: "Technology-driven instruction that adapts to every student's pace and ability." },
  { title: "Teacher Training Programs", desc: "Structured development pathways for music educators at every career stage." },
  { title: "International Certifications", desc: "Recognized credentials that carry weight across borders and institutions." },
  { title: "Student Performance Platforms", desc: "Stages — digital and physical — for students to showcase their growth." },
  { title: "Music Technology Innovation", desc: "Tools and platforms that push the discipline of music education forward." },
];

const collaboration = [
  { icon: "Ⅰ", title: "Corporate Partnerships", items: ["CSR Initiatives", "Brand Collaborations", "Educational Sponsorships"] },
  { icon: "Ⅱ", title: "Institutional Alliances", items: ["Schools", "Colleges", "Universities", "Government Programs"] },
  { icon: "Ⅲ", title: "Investment & Growth", items: ["Strategic Investors", "Advisors", "Philanthropic Funding", "Expansion Opportunities"] },
  { icon: "Ⅳ", title: "Media & Public Affairs", items: ["Media Coverage", "Industry Events", "Public Engagement", "Thought Leadership"] },
];

const achievements = [
  { tag: "Journalism", title: "25+ Years of Journalism Leadership", desc: "Two and a half decades reporting on, and shaping, the institutions he now brings into partnership with Muziclly Global." },
  { tag: "Institutional", title: "National Council Member — Indian Journalists Union", desc: "A seat at the national table for the profession, reflecting sustained standing among peers." },
  { tag: "National Honor", title: "Bharat Gaurav Ratna Samman Award", desc: "Recognized for distinguished contribution and service at a national level." },
  { tag: "Recognition", title: "Honorary Doctorate — WEAPC", desc: "Conferred in recognition of leadership and public service contribution." },
  { tag: "Present", title: "Media Leadership & Strategic Advisory", desc: "Now directing partnership strategy, relationship development, and public affairs for Muziclly Global." },
];

const why = [
  { roman: "I", title: "Trusted Relationships", desc: "An extensive network across media, government, education, and industry." },
  { roman: "II", title: "Strategic Thinking", desc: "Ability to identify mutually beneficial partnerships and long-term opportunities." },
  { roman: "III", title: "Credibility & Reputation", desc: "Recognized contributions to journalism and public service." },
  { roman: "IV", title: "Partnership Excellence", desc: "Focused on creating meaningful collaborations that generate measurable value." },
];

export default function RajanikanthPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grain} />

      <nav className={styles.nav}>
        <div className={styles.navMark}>
          Rajanikanth Mattepally <span>·</span> CSRO
        </div>
        <div className={styles.navLinks}>
          <a href="#about">About</a>
          <a href="#collaboration">Collaboration</a>
          <a href="#achievements">Achievements</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>Muziclly Global · Office of Strategic Relations</span>
            <h1>
              Rajanikanth
              <br />
              <em>Mattepally</em>
            </h1>
            <p className={styles.heroRole}>Chief Strategic Relations Officer</p>
            <p className={styles.heroTagline}>
              Building strategic partnerships, media relations, institutional collaborations, and growth
              opportunities for Muziclly Global — with a 25-year foundation in journalism and public affairs.
            </p>
            <div className={styles.heroCta}>
              <a href="#contact" className={`${styles.btn} ${styles.btnSolid}`}>
                Schedule Meeting
              </a>
              <a href="#contact" className={`${styles.btn} ${styles.btnGhost}`}>
                Partnership Inquiry
              </a>
              <a href="#" className={`${styles.btn} ${styles.btnLine}`}>
                Download Profile ↓
              </a>
            </div>
          </div>
          <div className={styles.heroPortrait}>
            <div className={`${styles.corner} ${styles.cornerTl}`} />
            <div className={`${styles.corner} ${styles.cornerBr}`} />
            <Image src="/team/rajanikanth.jpg" alt="Rajanikanth Mattepally" fill sizes="(max-width: 900px) 320px, 40vw" style={{ objectFit: "cover" }} priority />
          </div>
        </div>
      </section>

      <div className={styles.wire} data-label="DOSSIER">
        <div className={styles.wireTrack}>
          {[...wireItems, ...wireItems].map((item, i) => (
            <span key={i}>{item}</span>
          ))}
        </div>
      </div>

      <section id="about">
        <div className={styles.sectionInner}>
          <div className={styles.aboutGrid}>
            <div>
              <p>A relationship architect first, a journalist by training — Rajanikanth has spent 25 years turning access into alliance.</p>
              <p>
                Rajanikanth Mattepally is a distinguished journalist, media strategist, and relationship architect
                with over twenty-five years of experience building meaningful connections across government,
                education, media, business, and civil society.
              </p>
              <p>
                As Chief Strategic Relations Officer at Muziclly Global, he leads strategic partnerships,
                institutional alliances, sponsorship initiatives, public affairs engagement, and growth opportunities
                that support the organization&apos;s mission of transforming music education globally.
              </p>
              <p>
                His extensive professional network, media expertise, and reputation for relationship-building make
                him a trusted representative for high-value collaborations, investor introductions, educational
                partnerships, and corporate engagement initiatives.
              </p>
            </div>
            <div className={styles.statCol}>
              <div className={styles.stat}>
                <div className={styles.num}>25+</div>
                <div className={styles.lbl}>Years in Journalism &amp; Strategic Relations</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.num}>01</div>
                <div className={styles.lbl}>National Council Member, Indian Journalists Union</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.num}>02</div>
                <div className={styles.lbl}>National Honors — Bharat Gaurav Ratna Samman &amp; Honorary Doctorate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.tintedSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Why Muziclly Global</span>
            <h2>Building the future of music education</h2>
            <p>Rajanikanth works closely with stakeholders who wish to contribute to this mission through partnerships, sponsorships, investments, and institutional collaborations.</p>
          </div>
          <div className={styles.tripleGrid}>
            {mission.map((item, i) => (
              <div className={styles.tripleGridItem} key={item.title}>
                <div className={styles.miIndex}>{String(i + 1).padStart(2, "0")}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="collaboration">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Areas of Collaboration</span>
            <h2>Four doors into Muziclly Global</h2>
          </div>
          <div className={styles.collabGrid}>
            {collaboration.map((c) => (
              <div className={styles.collabCard} key={c.title}>
                <div className={styles.icon}>{c.icon}</div>
                <h3>{c.title}</h3>
                <ul>
                  {c.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="achievements">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Achievements</span>
            <h2>A career in public trust</h2>
          </div>
          <div className={styles.timeline}>
            {achievements.map((a) => (
              <div className={styles.tItem} key={a.title}>
                <span className={styles.tag}>{a.tag}</span>
                <h3>{a.title}</h3>
                <p>{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Why Work With Rajanikanth</span>
            <h2>What a partnership with him brings</h2>
          </div>
          <div className={styles.whyGrid}>
            {why.map((w) => (
              <div className={styles.whyItem} key={w.title}>
                <div className={styles.roman}>{w.roman}</div>
                <h3>{w.title}</h3>
                <p>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contact}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Get in Touch</span>
            <h2>Connect with Rajanikanth</h2>
            <p>For partnership inquiries, media collaboration, or institutional alliances.</p>
          </div>
          <div className={styles.contactMethods}>
            <div className={styles.cMethod}>
              <div className={styles.lbl}>Email</div>
              <div className={styles.val}>rajanikanth@muzicllyglobal.com</div>
            </div>
            <div className={styles.cMethod}>
              <div className={styles.lbl}>Phone</div>
              <div className={styles.val}>Available on request</div>
            </div>
            <div className={styles.cMethod}>
              <div className={styles.lbl}>LinkedIn</div>
              <div className={styles.val}>/in/rajanikanth-mattepally</div>
            </div>
          </div>
          <a href="#" className={`${styles.btn} ${styles.btnSolid}`}>
            Request a Meeting
          </a>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.fMark}>
          Muziclly <span>Global</span>
        </div>
        <div className={styles.fTag}>Building Partnerships. Creating Opportunities. Advancing Music Education.</div>
      </footer>
    </div>
  );
}
