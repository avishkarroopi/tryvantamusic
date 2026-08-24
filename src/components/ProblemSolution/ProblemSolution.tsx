import styles from "./ProblemSolution.module.css";

const problems = [
  { icon: "📱", title: "App-Only Learning", desc: "No feedback, no accountability. You plateau quickly without human guidance." },
  { icon: "🎲", title: "Random Teachers", desc: "Inconsistent teaching styles. No structured path. Progress feels scattered." },
  { icon: "😤", title: "Self-Doubt Loop", desc: "Without proper feedback, you don't know if you're improving or building bad habits." },
];

const solutions = [
  { icon: "👨‍🏫", title: "Human-Led Sessions", desc: "Real mentors who understand your goals and adapt to your pace." },
  { icon: "📊", title: "Structured Curriculum", desc: "Clear milestones. Track your progress. Know exactly where you are." },
  { icon: "🎯", title: "Personalized Feedback", desc: "Regular assessments ensure you're building skills, not bad habits." },
];

export default function ProblemSolution() {
  return (
    <>
      <div className={styles.header}>
        <span className={styles.label}>The Gap in Music Education</span>
        <h2 className={styles.title}>Why Most People Struggle to Learn Music</h2>
      </div>

      <div className={styles.comparison}>
        <div className={styles.problemSide}>
          <div className={styles.sideHeader}>
            <span className={styles.sideIcon}>✕</span>
            <h3 className={styles.sideTitle}>The Problem</h3>
          </div>
          <div className={styles.problemList}>
            {problems.map((p) => (
              <div className={styles.problemItem} key={p.title}>
                <div className={styles.problemIcon}>{p.icon}</div>
                <div className={styles.problemContent}>
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bridge}>
          <div className={styles.bridgeLine} />
          <div className={styles.bridgeIcon}>→</div>
          <div className={styles.bridgeLine} />
        </div>

        <div className={styles.solutionSide}>
          <div className={styles.sideHeader}>
            <span className={styles.sideIconSolution}>✓</span>
            <h3 className={styles.sideTitle}>The Tryvanta Music Way</h3>
          </div>
          <div className={styles.solutionList}>
            {solutions.map((s) => (
              <div className={styles.solutionItem} key={s.title}>
                <div className={styles.solutionIcon}>{s.icon}</div>
                <div className={styles.solutionContent}>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomStatement}>
        <p className={styles.statementText}>
          <span className={styles.highlight}>Structure</span> + <span className={styles.highlight}>Human Guidance</span> ={" "}
          <span className={styles.highlight}>Real Progress</span>
        </p>
      </div>
    </>
  );
}
