"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { studioFeatures } from "./studio-data";
import styles from "./page.module.css";

// Ported from the recovered original (_next/static/chunks/3bc884c937096d3f.js).
// Note: /mlab (M-Lab tools), /mstore, /admin, /student and /teacher are Phase 2
// dashboards and not built yet — those cards link out but 404 for now, exactly
// as they would on the real site before those areas ship.
export default function StudioPage() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.bgElements}>
          <div className={styles.gradientOrb1} />
          <div className={styles.gradientOrb2} />
          <div className={styles.gridPattern} />
        </div>

        <div className={styles.container}>
          <header className={styles.header}>
            <Link href="/" className={styles.backLink}>
              ← Back to Home
            </Link>
            <div className={styles.logoSection}>
              <Image src="/logo-icon.png" alt="Tryvanta Music" width={40} height={40} style={{ objectFit: "contain" }} />
        <span style={{ marginLeft: 8, fontWeight: 700, fontSize: "1.15rem", color: "inherit" }}>Tryvanta Music</span>
              <span className={styles.studioLabel}>STUDIO</span>
            </div>
            <h1 className={styles.title}>Tryvanta Music Studio</h1>
            <p className={styles.subtitle}>Our upcoming all-in-one digital ecosystem.</p>
            <p className={styles.tagline}>Building the future of music education, practice, and career growth.</p>
          </header>

          <div className={styles.featuresGrid}>
            {studioFeatures.map((feature, i) => {
              const isOpen = openIndex === i;
              return (
                <div
                  key={feature.title}
                  className={[
                    styles.featureCard,
                    feature.subItems ? styles.hasDropdown : "",
                    isOpen ? styles.active : "",
                    feature.link === "/mstore" ? styles.storeCard : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ "--delay": `${0.03 * i}s` } as CSSProperties}
                  onClick={() => {
                    if (feature.link) router.push(feature.link);
                    else if (feature.subItems) setOpenIndex(isOpen ? null : i);
                  }}
                >
                  <div className={styles.cardGlow} />
                  <div className={styles.cardHeader}>
                    <span className={styles.featureIcon}>{feature.icon}</span>
                    {feature.subItems ? (
                      <span className={styles.dropdownIndicator}>▼</span>
                    ) : feature.link ? (
                      <span className={styles.liveBadge}>Live</span>
                    ) : (
                      <span className={styles.comingSoon}>Coming Soon</span>
                    )}
                  </div>
                  <h3 className={styles.featureTitle}>{feature.title}</h3>
                  <p className={styles.featureDesc}>{feature.desc}</p>

                  {feature.subItems && isOpen && (
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                      {feature.subItems.map((sub) => (
                        <a href={sub.link} className={styles.dropdownItem} key={sub.title}>
                          {sub.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className={styles.ctaSection}>
            <h2 className={styles.ctaTitle}>Want early access?</h2>
            <p className={styles.ctaText}>Join our waitlist to be the first to experience Tryvanta Music Studio.</p>
            <div className={styles.ctaButtons}>
              <Link href="/signup" className={styles.primaryBtn}>
                Join Waitlist
              </Link>
              <Link href="/" className={styles.secondaryBtn}>
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
