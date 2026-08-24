import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Section from "@/components/Section/Section";
import Button from "@/components/Button/Button";
import Footer from "@/components/Footer/Footer";
import styles from "./page.module.css";

// NOTE: no recovered evidence (HTML capture, HAR, or crawler cache) contains
// the bare /mhub index page itself — only its 7 child course pages exist in
// the recovery material. This index is therefore built conservatively from
// the site's existing design system rather than reconstructed from a
// specific capture. See the integration report for details.
export const metadata: Metadata = {
  title: "M-Hub | Tryvanta Music",
  description: "Explore Tryvanta Music's specialized course tracks — from kids' instrument programs to teacher certification and audio production.",
};

const courses = [
  {
    href: "/mhub/kids-keyboard-piano",
    tag: "Kids",
    title: "Keyboard & Piano",
    desc: "A joyful, structured start on keys with the E.A.R.S™ method — built for young beginners.",
  },
  {
    href: "/mhub/kids-guitar",
    tag: "Kids",
    title: "Guitar",
    desc: "Hands-on guitar fundamentals designed to keep kids engaged from their very first chord.",
  },
  {
    href: "/mhub/vocal-training",
    tag: "All Ages",
    title: "Vocal Training",
    desc: "Ear-based vocal training for kids, teens, and adults — pitch, range, and stage confidence.",
  },
  {
    href: "/mhub/adults-keyboard-guitar",
    tag: "Adults",
    title: "Keyboard & Guitar",
    desc: "Flexible, structured learning for working professionals and returning hobbyists.",
  },
  {
    href: "/mhub/music-composition-audio",
    tag: "Producers",
    title: "Composition & Audio Engineering",
    desc: "Composition, engineering, and mastering tracks for aspiring producers and composers.",
  },
  {
    href: "/mhub/teacher-training-certification",
    tag: "Educators",
    title: "Teacher Training & Certification",
    desc: "Turn your musical talent into a certified, global teaching career.",
  },
  {
    href: "/mhub/housewives-training-placement",
    tag: "Community",
    title: "Housewives Training & Placement",
    desc: "Home-based music training and income opportunities, built with dignity and flexibility in mind.",
  },
];

export default function MHubPage() {
  return (
    <div>
      <div className={styles.topBar}>
        <Link href="/" className={styles.logoLink}>
          <Image src="/logo-icon.png" alt="Tryvanta Music" width={38} height={38} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
        </Link>
        <Link href="/" className={styles.backHome}>
          ← Back to Home
        </Link>
      </div>

      <Section padding="xl">
        <div className={styles.hero}>
          <span className={styles.eyebrow}>M-Hub</span>
          <h1 className={styles.title}>Every Track. One Hub.</h1>
          <p className={styles.subtitle}>
            Explore Tryvanta Music&apos;s specialized course tracks — each built on the E.A.R.S™ method, with real
            mentorship and structured pathways for every age and goal.
          </p>
        </div>
      </Section>

      <Section background="secondary" padding="xl">
        <div className={styles.grid}>
          {courses.map((c) => (
            <Link href={c.href} key={c.href} className={styles.card}>
              <span className={styles.cardTag}>{c.tag}</span>
              <h3 className={styles.cardTitle}>{c.title}</h3>
              <p className={styles.cardDesc}>{c.desc}</p>
              <span className={styles.cardLink}>Explore course →</span>
            </Link>
          ))}
        </div>
      </Section>

      <Section padding="xl">
        <div className={styles.ctaSection}>
          <h2 className={styles.title} style={{ fontSize: "var(--text-3xl)" }}>
            Not sure where to start?
          </h2>
          <p className={styles.subtitle}>Book a free assessment and we&apos;ll help you find the right track.</p>
          <Button href="/assessment" variant="primary" size="lg">
            Book a Free Assessment
          </Button>
        </div>
      </Section>

      <Footer />
    </div>
  );
}
