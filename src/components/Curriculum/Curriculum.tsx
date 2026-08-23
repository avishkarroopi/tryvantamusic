import styles from "./Curriculum.module.css";

const levels = [
  {
    title: "Beginner Level",
    duration: "3 Months",
    points: [
      "Instrument posture & basic technique",
      "Introduction to notes, rhythm & tempo",
      "Basic scales and finger exercises",
      "Simple songs & melody playing",
      "Ear training basics (listen → identify → play)",
    ],
  },
  {
    title: "Intermediate Level 1",
    duration: "3 Months",
    points: [
      "Strengthening technique & hand coordination",
      "Expanded scales, chords & patterns",
      "Timing, dynamics & expression",
      "Playing full songs independently",
      "Applied ear training (recognising intervals & chords)",
    ],
  },
  {
    title: "Intermediate Level 2",
    duration: "3 Months",
    points: [
      "Advanced chord progressions & variations",
      "Song application & performance skills",
      "Improvisation fundamentals",
      "Sight reading & structured practice routines",
      "Exam-oriented preparation (Trinity / ABRSM ready)",
    ],
  },
  {
    title: "Advanced Level",
    duration: "3 Months",
    points: [
      "Performance-level repertoire",
      "Advanced ear training & musical interpretation",
      "Confidence in independent learning",
      "Recording / stage preparation fundamentals",
      "Certification-ready performance & assessment",
    ],
  },
];

export default function Curriculum() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.overline}>Our Core Curriculum</span>
        <h2 className={styles.title}>One System. One Duration. Complete Musicianship.</h2>
        <div className={styles.programTitle}>
          <span className={styles.programHighlight}>Muziclly Structured Music Program</span>
          <span className={styles.programSub}>The 12-Month Unified Journey to Musical Excellence</span>
        </div>
      </div>

      <div className={styles.optionsGrid}>
        <div className={styles.optionCard}>
          <div className={styles.optionHeader}>
            <span className={styles.optionNumber}>1</span>
            <h3>Choose Your Instrument</h3>
          </div>
          <p className={styles.optionDesc}>Pick ONE primary discipline for your 1-year journey:</p>
          <ul className={styles.optionList}>
            <li>🎹 Piano / Keyboard</li>
            <li>🎸 Guitar (Acoustic / Electric)</li>
          </ul>
        </div>

        <div className={styles.optionCard}>
          <div className={styles.optionHeader}>
            <span className={styles.optionNumber}>2</span>
            <h3>Integral Curriculum (Included for ALL)</h3>
          </div>
          <p className={styles.optionDesc}>Every student, regardless of instrument, learns:</p>
          <ul className={styles.optionList}>
            <li>🎤 Bollywood Singing (Recommended)</li>
            <li>👂 Ear Training (Pitch &amp; Rhythm)</li>
            <li>🎼 Music Theory &amp; Understanding</li>
          </ul>
        </div>
      </div>

      <div className={styles.roadmap}>
        <h3 className={styles.roadmapTitle}>
          The 1-Year Roadmap <span className={styles.roadmapSub}>(Same for All Disciplines)</span>
        </h3>
        <div className={styles.timelineGrid}>
          {levels.map((level) => (
            <div className={styles.levelCard} key={level.title}>
              <div className={styles.levelHeader}>
                <h4 className={styles.levelTitle}>{level.title}</h4>
                <span className={styles.levelDuration}>{level.duration}</span>
              </div>
              <ul className={styles.levelPoints}>
                {level.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className={styles.totalDuration}>Total Duration: 12 Months</div>
      </div>
    </div>
  );
}
