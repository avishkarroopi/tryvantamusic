import Image from "next/image";
import Button from "@/components/Button/Button";
import styles from "./Hero.module.css";

const waveHeights = [40, 75, 30, 60, 25, 80, 45, 65, 35, 70, 50, 55];

export default function Hero() {
  return (
    <section className={styles.hero} id="hero">
      <div className={styles.bgElements}>
        <div className={styles.gradientBlob1} />
        <div className={styles.gradientBlob2} />
        <div className={styles.gradientBlob3} />
        <div className={styles.noiseOverlay} />
      </div>

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            <span>Human-Led Music Education</span>
          </div>

          <h1 className={styles.headline}>
            Master Music with
            <span className={styles.gradientText}> Structure</span>
            <br />& Real
            <span className={styles.gradientText}> Mentorship</span>
          </h1>

          <p className={styles.subtext}>
            Transform your musical journey with personalized guidance from verified tutors. Build lasting skills
            through our structured curriculum designed for real progress.
          </p>

          <div className={styles.ctaGroup}>
            <Button variant="primary" size="lg" href="/assessment" id="hero-cta-primary">
              Start Your Journey<span className={styles.ctaArrow}>→</span>
            </Button>
            <Button variant="secondary" size="lg" href="#how-it-works" id="hero-cta-secondary">
              See How It Works
            </Button>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <span className={styles.statNumber}>1500+</span>
              <span className={styles.statLabel}>Active Students</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>150+</span>
              <span className={styles.statLabel}>Expert Tutors</span>
            </div>
            <div className={styles.statDivider} />
            <div className={styles.stat}>
              <span className={styles.statNumber}>4.9★</span>
              <span className={styles.statLabel}>Average Rating</span>
            </div>
          </div>

          <div className={styles.certificateWrapper}>
            <Image
              src="/kidsafe-certified.png"
              alt="kidSAFE Certified"
              width={120}
              height={60}
              className={styles.certificateImage}
            />
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.visualCard}>
            <div className={styles.imageContainer}>
              <div className={styles.musicCircle}>
                <div className={styles.circleRing} />
                <div className={styles.circleRing} />
                <div className={styles.circleRing} />
                <div className={styles.noteIcon}>🎵</div>
              </div>
            </div>

            <div className={`${styles.floatingCard} ${styles.cardTop}`}>
              <span className={styles.cardIcon}>🎹</span>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Piano Lesson</span>
                <span className={styles.cardSub}>Live Session</span>
              </div>
              <span className={styles.liveIndicator} />
            </div>

            <div className={`${styles.floatingCard} ${styles.cardBottom}`}>
              <span className={styles.cardIcon}>🎸</span>
              <div className={styles.cardContent}>
                <span className={styles.cardTitle}>Guitar Lesson</span>
                <span className={styles.cardSub}>Module 3 of 12</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} />
              </div>
            </div>

            <div className={`${styles.floatingCard} ${styles.cardRight}`}>
              <span className={styles.starRating}>★★★★★</span>
              <span className={styles.ratingText}>&quot;Best learning experience!&quot;</span>
            </div>
          </div>

          <div className={styles.waveContainer}>
            {waveHeights.map((h, i) => (
              <div key={i} className={styles.waveBar} style={{ animationDelay: `${i * 0.1}s`, height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
