import Image from "next/image";
import styles from "./Mentors.module.css";

const mentors = [
  { icon: "👨‍🏫", name: "Christopher", role: "Senior Keyboard & Guitar Facilitator" },
  { icon: "👩‍🏫", name: "Lokeshwari", role: "Children Learning Specialist" },
  { icon: "🎸", name: "Tanisha Singh", role: "Senior Guitar Facilitator" },
];

export default function Mentors() {
  return (
    <section className={styles.section} id="mentors">
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image src="/mentors-group.png" alt="Muziclly Top Mentors" width={600} height={450} className={styles.image} />
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>Guided by Expert Mentors</h2>
          <p className={styles.subtitle}>Our mentors specialize in the integrated 12-month curriculum.</p>
          <ul className={styles.list}>
            {mentors.map((m) => (
              <li className={styles.listItem} key={m.name}>
                <span className={styles.icon}>{m.icon}</span>
                <div className={styles.info}>
                  <strong className={styles.name}>{m.name}</strong>
                  <span className={styles.role}>{m.role}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className={styles.footerBadge}>
            <span className={styles.badgeIcon}>🌍</span>Plus 150+ experienced mentors worldwide.
          </div>
        </div>
      </div>
    </section>
  );
}
