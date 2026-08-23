import styles from "./Difference.module.css";

const items = [
  { icon: "⚖️", title: "Skill vs Syllabus", desc: "We prioritize deep musical understanding and skill development over just rushing through a syllabus." },
  { icon: "👂", title: "Listen → Play", desc: "Our unique Ear Training method teaches students to identify notes by ear, not just copy-paste." },
  { icon: "📈", title: "Measurable Progress", desc: "We guarantee clear, measurable growth with transparent tracking and regular parent updates." },
  { icon: "💻", title: "Structured System", desc: 'Professional student dashboard and structured materials. No random "WhatsApp teaching".' },
];

export default function Difference() {
  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.title}>How We Are Different</h2>
        <p className={styles.subtitle}>Most academies focus on syllabus. We focus on skill.</p>
      </div>
      <div className={styles.grid}>
        {items.map((item) => (
          <div className={styles.card} key={item.title}>
            <div className={styles.iconWrapper}>{item.icon}</div>
            <h3 className={styles.cardTitle}>{item.title}</h3>
            <p className={styles.cardDescription}>{item.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}
