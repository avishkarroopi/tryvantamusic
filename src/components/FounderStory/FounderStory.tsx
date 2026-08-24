import Image from "next/image";
import { CircleCheck, GraduationCap, Users } from "lucide-react";
import styles from "./FounderStory.module.css";

export default function FounderStory() {
  return (
    <section className={styles.section} id="founder">
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <div className={styles.backdropCircle} />
          <Image
            src="/founder-guitar.png"
            alt="Dr. Avishkar Roopi Gurram - Founder of Tryvanta Music"
            width={450}
            height={562}
            className={styles.founderImage}
          />
          <div className={styles.experienceBadge}>
            <span className={styles.badgeNumber}>14+</span>
            <span className={styles.badgeText}>Years of Teaching</span>
          </div>
        </div>

        <div className={styles.content}>
          <div>
            <span className={styles.label}>Founder Story</span>
            <h2 className={styles.title}>
              Meet <span className={styles.titleHighlight}>Dr. Avishkar Roopi Gurram</span>
            </h2>
            <p className={styles.role}>Founder &amp; CEO, Tryvanta Music</p>
          </div>

          <p className={styles.description}>
            Avishkar&rsquo;s journey began as a passionate musician and teacher. Over 14+ years, he noticed a serious
            gap in music education—many learners spent years in classes but still lacked clarity, strong basics, and
            confidence.
          </p>

          <div className={styles.highlightBox}>
            <p className={styles.quote}>
              &quot;When learners gain clarity, discipline, and the right guidance, music becomes a lifelong
              skill—not a temporary hobby.&quot;
            </p>
          </div>

          <p className={styles.description}>
            He founded Tryvanta Music to shift the focus from just &quot;playing songs&quot; to{" "}
            <strong style={{ color: "var(--color-text-primary)" }}>truly understanding music</strong>. His structured
            approach focuses on:
          </p>

          <div className={styles.grid}>
            <div className={styles.gridItem}>
              <CircleCheck size={20} className={styles.checkIcon} aria-hidden="true" />
              <span>Strong Foundations</span>
            </div>
            <div className={styles.gridItem}>
              <CircleCheck size={20} className={styles.checkIcon} aria-hidden="true" />
              <span>Correct Learning Sequence</span>
            </div>
            <div className={styles.gridItem}>
              <CircleCheck size={20} className={styles.checkIcon} aria-hidden="true" />
              <span>Ear Training</span>
            </div>
            <div className={styles.gridItem}>
              <CircleCheck size={20} className={styles.checkIcon} aria-hidden="true" />
              <span>Consistent Practice</span>
            </div>
          </div>

          <div
            className={styles.grid}
            style={{ marginTop: "var(--space-6)", borderTop: "1px solid var(--color-border-subtle)", paddingTop: "var(--space-6)" }}
          >
            <div className={styles.gridItem}>
              <GraduationCap size={24} className={styles.checkIcon} aria-hidden="true" />
              <span>KMMC (A.R. Rahman Academy) Alumni</span>
            </div>
            <div className={styles.gridItem}>
              <Users size={24} className={styles.checkIcon} aria-hidden="true" />
              <span>Mentored 750+ Students &amp; 20+ Tutors</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
