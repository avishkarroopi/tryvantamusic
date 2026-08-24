import styles from "./Approach.module.css";

const steps = [
  { icon: "🎯", number: "01", title: "Assess", desc: "We understand your current level, goals, and learning style through a free assessment." },
  { icon: "🤝", number: "02", title: "Match", desc: "We pair you with the perfect mentor based on your instrument, style, and personality." },
  { icon: "📚", number: "03", title: "Learn", desc: "Begin structured sessions with your mentor. Clear goals for every class." },
  { icon: "📊", number: "04", title: "Review", desc: "Regular progress checks ensure you're building skills correctly." },
  { icon: "🚀", number: "05", title: "Advance", desc: "Level up with new challenges, techniques, and optional certifications." },
];

export default function Approach() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>Your Journey</span>
        <h2 className={styles.title}>The Tryvanta Music Approach</h2>
        <p className={styles.subtitle}>A clear, proven path from where you are to where you want to be.</p>
      </div>

      <div className={styles.stepper}>
        <div className={styles.progressLine}>
          <div className={styles.progressFill} />
        </div>

        {steps.map((step) => (
          <div className={styles.step} key={step.number}>
            <div className={styles.stepMarker}>
              <div className={styles.markerPulse} />
              <span className={styles.stepIcon}>{step.icon}</span>
            </div>
            <div className={styles.stepContent}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h4 className={styles.stepTitle}>{step.title}</h4>
              <p className={styles.stepDescription}>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
