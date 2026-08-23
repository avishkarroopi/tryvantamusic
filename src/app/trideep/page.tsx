import type { Metadata } from "next";
import Image from "next/image";
import styles from "@/components/TeamProfile/TeamProfile.module.css";

// Recovered from "remaining pages data.zip" / trideep.html — a standalone
// executive-profile page (own bespoke dark/gold theme, no site Navbar/Footer,
// matching the recovered evidence exactly).
export const metadata: Metadata = {
  title: "Trideep Chandra Airukonda | Muziclly Global",
  description:
    "Co-Founder & Executive Director – Strategy, Brand & Growth at Muziclly Global.",
};

const wireItems = [
  "13+ Years Multidisciplinary Experience",
  "Strategy, Brand & Growth",
  "Digital Transformation",
  "Large-Scale Design Systems",
  "Global Projects in 25+ Countries",
  "Systems-Thinking Approach",
];

const expertise = [
  { title: "Strategic Direction", desc: "Guiding the long-term vision and operational roadmap for the global ecosystem." },
  { title: "Brand Positioning", desc: "Crafting a meaningful, globally resonant identity for Muziclly." },
  { title: "Growth Initiatives", desc: "Driving expansion, scaling operations, and identifying new opportunities." },
  { title: "Partnerships", desc: "Forging high-value alliances with institutions and organizations." },
  { title: "Technology Roadmap", desc: "Overseeing the technical infrastructure that powers technology-enabled engagement." },
  { title: "Business Development", desc: "Building sustainable business models for long-term value creation." },
];

export default function TrideepPage() {
  return (
    <div className={styles.page}>
      <div className={styles.grain} />

      <nav className={styles.nav}>
        <div className={styles.navMark}>
          Trideep Chandra Airukonda <span>·</span> Co-Founder &amp; Exec Director
        </div>
        <div className={styles.navLinks}>
          <a href="#about">About</a>
          <a href="#expertise">Expertise</a>
          <a href="#vision">Vision</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <span className={styles.eyebrow}>Muziclly Global · Executive Leadership</span>
            <h1>
              Trideep
              <br />
              <em>Chandra Airukonda</em>
            </h1>
            <p className={styles.heroRole}>Co-Founder &amp; Executive Director – Strategy, Brand &amp; Growth</p>
            <p className={styles.heroTagline}>
              An architect, design strategist, entrepreneur, and business leader bringing a systems-thinking approach
              to building scalable businesses and meaningful user experiences.
            </p>
            <div className={styles.heroCta}>
              <a href="#contact" className={`${styles.btn} ${styles.btnSolid}`}>
                Connect
              </a>
              <a href="#vision" className={`${styles.btn} ${styles.btnGhost}`}>
                Our Vision
              </a>
            </div>
          </div>
          <div className={styles.heroPortrait}>
            <div className={`${styles.corner} ${styles.cornerTl}`} />
            <div className={`${styles.corner} ${styles.cornerBr}`} />
            <Image src="/team/trideep.png" alt="Trideep Chandra Airukonda" fill sizes="(max-width: 900px) 320px, 40vw" style={{ objectFit: "cover" }} priority />
          </div>
        </div>
      </section>

      <div className={styles.wire} data-label="EXPERTISE">
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
              <p>
                Successful businesses are built by solving real human problems through thoughtful strategy,
                disciplined execution, and long-term value creation.
              </p>
              <p>
                Trideep Chandra Airukonda is an architect, design strategist, entrepreneur, and business leader with
                over 13 years of multidisciplinary experience across India and the United Kingdom. His expertise
                spans business strategy, brand development, digital transformation, customer experience, and
                large-scale design systems.
              </p>
              <p>
                Having worked across more than 25 countries on projects for global organisations and leading
                automotive brands including Microsoft, BMW, MINI, Volvo, Lotus Cars, Honda, and OMODA, Trideep brings
                a highly refined systems-thinking approach to every endeavor.
              </p>
            </div>
            <div className={styles.statCol}>
              <div className={styles.stat}>
                <div className={styles.num}>13+</div>
                <div className={styles.lbl}>Years Multidisciplinary Experience</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.num}>25+</div>
                <div className={styles.lbl}>Countries Worked Across</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.num}>7+</div>
                <div className={styles.lbl}>Global Brands Partnered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="expertise" className={styles.tintedSection}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Strategic Leadership</span>
            <h2>Role at Muziclly Global</h2>
            <p>At Muziclly, Trideep leads the company&apos;s strategic direction, long-term business development, and core growth initiatives.</p>
          </div>
          <div className={styles.tripleGrid}>
            {expertise.map((item, i) => (
              <div className={styles.tripleGridItem} key={item.title}>
                <div className={styles.miIndex}>{String(i + 1).padStart(2, "0")}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="vision">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>The Vision</span>
            <h2>Transforming Music Education</h2>
          </div>
          <div className={styles.timeline}>
            <div className={styles.tItem}>
              <span className={styles.tag}>Philosophy</span>
              <h3>A Sustainable Global Ecosystem</h3>
              <p>
                His focus is on building Muziclly into a sustainable global music ecosystem that connects learners,
                educators, creators, and communities through structured learning experiences and technology-enabled
                engagement.
              </p>
            </div>
            <div className={styles.tItem}>
              <span className={styles.tag}>Transformation</span>
              <h3>Beyond Isolated Lessons</h3>
              <p>
                His vision for Muziclly is to transform music education from isolated lessons into a lifelong
                ecosystem that nurtures consistency, creativity, collaboration, and personal growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className={styles.contact}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>Connect</span>
            <h2>Get in Touch</h2>
            <p>For strategic partnerships, branding inquiries, or to learn more about Muziclly&apos;s vision.</p>
          </div>
          <div className={styles.contactMethods}>
            <div className={styles.cMethod}>
              <div className={styles.lbl}>Email</div>
              <div className={styles.val}>trideep@muziclly.com</div>
            </div>
            <div className={styles.cMethod}>
              <div className={styles.lbl}>LinkedIn</div>
              <div className={styles.val}>/in/trideep-chandra-airukonda</div>
            </div>
          </div>
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
