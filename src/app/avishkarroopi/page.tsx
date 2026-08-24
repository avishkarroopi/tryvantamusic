"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Phone, Mail, MapPin, Calendar } from "lucide-react";
import { InstagramIcon, FacebookIcon, LinkedinIcon, XIcon, GithubIcon } from "@/components/BrandIcons/BrandIcons";
import styles from "./page.module.css";

// Recovered from "remaining pages data.zip" / avishkarroopi.html — the
// founder's own standalone personal-brand page (own bespoke light theme, no
// site Navbar/Footer). Real contact details below are as captured.
const testimonials = [
  { quote: "Avishkar Sir doesn't just teach notes; he teaches how to think like a musician. The KMMC methodology is evident.", name: "Sarah Johnson", role: "Parent" },
  { quote: "He gave me a business plan for my music classes that actually works. Truly world-class mentoring.", name: "Rahul Verma", role: "Music Teacher" },
  { quote: "The best investment for my musical journey. He is strict, disciplined, but incredibly encouraging.", name: "Arjun K.", role: "Advanced Student" },
];

const socials = [
  { href: "https://instagram.com/avishkarroopi", label: "Instagram", icon: InstagramIcon },
  { href: "https://facebook.com/avishkarroopi", label: "Facebook", icon: FacebookIcon },
  { href: "https://linkedin.com/in/avishkar-roopi", label: "LinkedIn", icon: LinkedinIcon },
  { href: "https://x.com/RoopiAvish95822", label: "X", icon: XIcon },
  { href: "https://wa.me/919550429016", label: "WhatsApp", icon: Phone },
  { href: "https://github.com/avishkarroopi", label: "GitHub", icon: GithubIcon },
  { href: "mailto:muziclly.info@gmail.com", label: "Email", icon: Mail },
  { href: "https://maps.app.goo.gl/p7KKpasF3dY5ZZHu5", label: "Location", icon: MapPin },
];

export default function AvishkarRoopiPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={`${styles.container} ${styles.navContainer}`}>
          <Link href="#home" className={styles.navBrand} style={{ display: "flex", alignItems: "center" }}>
            <svg width="180" height="50" viewBox="0 0 240 60" xmlns="http://www.w3.org/2000/svg" fill="none">
              <path d="M20 35 C 25 15, 35 45, 45 25 S 60 15, 70 30 C 75 35, 80 45, 90 25" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M95 35 C 100 25, 110 40, 120 30 S 135 20, 140 35 L 160 30" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M20 50 L 160 45" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.9 }} />
              <text x="35" y="58" fontFamily="sans-serif" fontSize="9" fill="#374151" letterSpacing="3" style={{ textTransform: "uppercase", fontWeight: 600 }}>
                Avishkar Roopi
              </text>
            </svg>
          </Link>

          <div className={styles.desktopMenu}>
            <a href="#home" className={styles.navLink}>Home</a>
            <a href="#about" className={styles.navLink}>About</a>
            <a href="#experience" className={styles.navLink}>Experience</a>
            <a href="#mentorship" className={styles.navLink}>Mentorship</a>
            <a href="#testimonials" className={styles.navLink}>Testimonials</a>
            <a href="#contact" className={styles.navLink}>Contact</a>
            <a href="#contact" className={styles.btn} style={{ padding: "8px 24px" }}>Book Session</a>
          </div>

          <button
            className={styles.navLink}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "white",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 30,
          }}
        >
          <button style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none" }} onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={32} />
          </button>
          {["Home", "About", "Experience", "Mentorship", "Contact"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase()}`}
              style={{ fontSize: "1.5rem", fontFamily: "Montserrat Alternates, sans-serif", fontWeight: 700 }}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      <header className={styles.heroSection} id="home">
        <div className={styles.heroBgShape} />
        <div className={styles.container}>
          <div className={styles.grid2}>
            <div className={`${styles.textCenterMobile} ${styles.orderMobile2} ${styles.orderDesktop1}`}>
              <span className={styles.tagLabel}>Global Music Educator &amp; Mentor</span>
              <h1 className={styles.heroTitle}>
                Avishkar <br /> <span className={styles.textOrange}>Roopi</span>
              </h1>
              <p style={{ fontSize: "1.1rem", color: "var(--text-muted)", marginBottom: 20 }}>
                Founder of <strong>Tryvanta Music</strong> | KMMC (A.R. Rahman Academy) Alumni | Honorary Doctorate Awardee
              </p>
              <p style={{ color: "var(--text-muted)" }}>
                My mission is to empower the next generation of musicians and educators with a blend of classical
                rigor, modern innovation, and strategic career positioning.
              </p>
              <div className={styles.statsGrid} style={{ borderLeft: "4px solid var(--brand-orange)", marginTop: 30 }}>
                <div>
                  <strong style={{ fontSize: "1.5rem", display: "block" }}>14+</strong>
                  <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Years Exp.</span>
                </div>
                <div>
                  <strong style={{ fontSize: "1.5rem", display: "block" }}>750+</strong>
                  <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Students</span>
                </div>
                <div>
                  <strong style={{ fontSize: "1.5rem", display: "block" }}>Doc.</strong>
                  <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Awardee</span>
                </div>
              </div>
              <div className={styles.heroBtns}>
                <a href="#contact" className={styles.btn}>Work With Me</a>
                <a href="#experience" className={`${styles.btn} ${styles.btnOutline}`}>Explore Journey</a>
              </div>
            </div>

            <div className={`${styles.orderMobile1} ${styles.orderDesktop2}`}>
              <div className={styles.frameSemiRound}>
                <Image src="/team/avishkarroopi/hero-portrait.jpg" alt="Avishkar Roopi Portrait" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} priority />
              </div>
            </div>
          </div>
        </div>
      </header>

      <section id="about" className={`${styles.section} ${styles.bgLight}`}>
        <div className={styles.container}>
          <div className={styles.grid2}>
            <div>
              <h2 style={{ fontSize: "2.5rem", marginBottom: 20 }}>Academic Excellence &amp; <br />Global Recognition</h2>
              <div style={{ width: 80, height: 4, background: "var(--brand-orange)", marginBottom: 30 }} />
              <div style={{ color: "var(--text-muted)", fontSize: "1.1rem", display: "flex", flexDirection: "column", gap: 20 }}>
                <p>
                  My journey is rooted in a deep respect for musical tradition. As an{" "}
                  <strong>Alumni of KMMC (A.R. Rahman&rsquo;s Academy of Music)</strong>, I was trained under some of
                  the world&apos;s finest musical minds.
                </p>
                <p>
                  Further solidifying my expertise, I hold certifications from <strong>Trinity College London</strong>.
                  Recently honored with an <span className={styles.textOrange}>Honorary Doctorate</span> for
                  contribution to music education.
                </p>
              </div>
            </div>
            <div>
              <div className={styles.frameCircle}>
                <Image src="/team/avishkarroopi/academic-excellence.jpg" alt="Academic Excellence" fill sizes="350px" style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid2}>
            <div>
              <div className={styles.frameSemiRound}>
                <Image src="/team/avishkarroopi/teaching-music.png" alt="Teaching Music" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div className={styles.textCenterMobile}>
              <h2 style={{ fontSize: "2.5rem", marginBottom: 20 }}>
                14+ Years of Transforming <br />
                <span className={styles.textOrange}>Musical Careers</span>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: 30 }}>
                Established in 2013, Tryvanta Music was founded with a vision to democratize high-quality music education.
                I have successfully mentored over 20+ music teachers and trained students globally.
              </p>
              <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "3rem", fontWeight: "bold", display: "block" }}>750+</span>
                  <span style={{ color: "var(--brand-orange)", fontSize: "0.9rem", fontWeight: "bold", textTransform: "uppercase" }}>Students</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: "3rem", fontWeight: "bold", display: "block" }}>20+</span>
                  <span style={{ color: "var(--brand-orange)", fontSize: "0.9rem", fontWeight: "bold", textTransform: "uppercase" }}>Mentors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.bgLight}`} style={{ textAlign: "center" }}>
        <div className={styles.container}>
          <div style={{ width: 200, height: 200, borderRadius: "50%", overflow: "hidden", margin: "0 auto 30px", border: "1px solid #ddd", padding: 4, background: "white", position: "relative" }}>
            <Image src="/team/avishkarroopi/top-mentor.jpg" alt="Top Mentor" fill sizes="200px" style={{ borderRadius: "50%", objectFit: "cover" }} />
          </div>
          <h2 style={{ fontSize: "clamp(2rem, 8vw, 3rem)", marginBottom: 20 }}>
            Recognized as a <br />Global Top 3 Music Mentor
          </h2>
          <p style={{ maxWidth: 700, margin: "0 auto 40px", fontSize: "1.2rem", color: "var(--text-muted)" }}>
            Music is not just an art; it is a discipline and a career. My mentorship bridges the gap between artistic
            talent and industry success.
          </p>
          <div style={{ display: "flex", gap: 15, justifyContent: "center", flexWrap: "wrap" }}>
            {["Industry Strategist", "Premium Educator", "Career Architect"].map((tag) => (
              <span key={tag} style={{ padding: "10px 25px", background: "white", border: "1px solid #e5e7eb", borderRadius: "50px", fontWeight: 500 }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="mentorship" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.grid2}>
            <div>
              <span style={{ color: "var(--brand-orange)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2, fontSize: "0.9rem" }}>Consultant</span>
              <h2 style={{ fontSize: "2.5rem", margin: "10px 0 30px" }}>
                Career Guidance &amp; <br />Strategic Mentorship
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1.1rem", marginBottom: 30 }}>
                I help aspiring musicians and teachers build sustainable careers. My consultation covers personal
                branding, curriculum development, and business strategy.
              </p>
              <ul style={{ display: "flex", flexDirection: "column", gap: 15, marginBottom: 40 }}>
                {["Personal Career Roadmap", "Academy Management", "Teacher Training"].map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className={styles.textOrange}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <a href="#contact" className={`${styles.btn} ${styles.btnDark}`}>Book Guidance Session</a>
            </div>
            <div>
              <div className={styles.frameSemiRound}>
                <Image src="/team/avishkarroopi/consultation.jpg" alt="Consultation" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className={`${styles.section} ${styles.bgLight}`}>
        <div className={styles.container}>
          <h2 style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 50 }}>What Students Say</h2>
          <div className={styles.testimonialGrid}>
            {testimonials.map((t) => (
              <div className={styles.card} key={t.name}>
                <div className={styles.stars}>★★★★★</div>
                <p style={{ fontStyle: "italic", color: "var(--text-muted)", marginBottom: 20 }}>&quot;{t.quote}&quot;</p>
                <div>
                  <strong style={{ display: "block" }}>{t.name}</strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} style={{ textAlign: "center", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
        <div className={styles.container}>
          <div style={{ width: 150, height: 150, borderRadius: "50%", margin: "0 auto 30px", overflow: "hidden", border: "4px solid white", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", position: "relative" }}>
            <Image src="/team/avishkarroopi/premium-1-1.jpg" alt="1-1" fill sizes="150px" style={{ objectFit: "cover" }} />
          </div>
          <h2 style={{ fontSize: "2.5rem", marginBottom: 20 }}>Premium 1-1 Private Sessions</h2>
          <p style={{ maxWidth: 600, margin: "0 auto 30px", color: "var(--text-muted)" }}>
            Limited slots available for serious individuals seeking advanced technique refinement and exam
            preparation.
          </p>
          <a href="#contact" className={styles.btn}>Inquire For Slots</a>
        </div>
      </section>

      <section className={`${styles.section} ${styles.bgLight}`}>
        <div className={styles.container}>
          <div className={styles.grid2}>
            <div>
              <div className={styles.frameSemiRound} style={{ height: 300 }}>
                <Image src="/team/avishkarroopi/social-connect.jpg" alt="Social" fill sizes="(max-width: 900px) 100vw, 500px" style={{ objectFit: "cover" }} />
              </div>
            </div>
            <div>
              <h2 style={{ marginBottom: 20 }}>Connect Globally</h2>
              <p style={{ marginBottom: 30 }}>Join my digital community for daily insights.</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 15, maxWidth: 400 }}>
                {socials.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className={styles.iconBox} aria-label={s.label}>
                    <s.icon size={20} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 80 }}>
            <h2 style={{ textAlign: "center", marginBottom: 40 }}>Moments &amp; Milestones</h2>
            <div className={styles.galleryGrid}>
              <div className={`${styles.galleryItem} ${styles.galleryTall}`}>
                <Image src="/team/avishkarroopi/gallery-1.avif" alt="Gallery" fill sizes="25vw" style={{ objectFit: "cover" }} />
              </div>
              <div className={styles.galleryItem}>
                <Image src="/team/avishkarroopi/gallery-2.avif" alt="Gallery" fill sizes="25vw" style={{ objectFit: "cover" }} />
              </div>
              <div className={styles.galleryItem}>
                <Image src="/team/avishkarroopi/gallery-3.avif" alt="Gallery" fill sizes="25vw" style={{ objectFit: "cover" }} />
              </div>
              <div className={`${styles.galleryItem} ${styles.galleryWide}`}>
                <Image src="/team/avishkarroopi/gallery-4.avif" alt="Gallery" fill sizes="50vw" style={{ objectFit: "cover" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer} id="contact">
        <div className={`${styles.container} ${styles.footerGrid}`}>
          <div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: 10 }}>Avishkar Roopi</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: 20, fontWeight: 500 }}>Tryvanta Music Global</p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Empowering the next generation of musical talent with world-class education.
            </p>
          </div>
          <div>
            <h4 style={{ fontWeight: "bold", marginBottom: 20 }}>Contact</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem" }}>
              <a href="tel:+919398017435" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Phone size={16} className={styles.textOrange} /> +91 9398017435
              </a>
              <a href="mailto:muziclly.info@gmail.com" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Mail size={16} className={styles.textOrange} /> muziclly.info@gmail.com
              </a>
              <a href="https://calendly.com/aavishkarroopi" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Calendar size={16} className={styles.textOrange} /> Schedule Call
              </a>
            </div>
          </div>
          <div>
            <h4 style={{ fontWeight: "bold", marginBottom: 20 }}>Quick Links</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.9rem" }}>
              <a href="#home">Home</a>
              <a href="#about">About</a>
              <a href="#mentorship">Career Guidance</a>
            </div>
          </div>
        </div>
        <div className={`${styles.container} ${styles.footerBottom}`}>
          <p>© 2024 Avishkar Roopi. All Rights Reserved.</p>
          <div style={{ display: "flex", gap: 20 }}>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/terms-of-service">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
