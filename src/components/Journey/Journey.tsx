import Image from "next/image";
import styles from "./Journey.module.css";

const items = [
  { icon: "🎓", text: "Founded by KMMC (A.R. Rahman’s Academy) alumni." },
  { icon: "🗓️", text: "One unified 12-month structured program." },
  { icon: "🎵", text: "Integrated curriculum: Play, Sing, and Understand." },
  { icon: "🏠", text: "Safe, home-based learning trusted by parents globally." },
];

export default function Journey() {
  return (
    <section className={styles.section} id="journey">
      <div className={styles.container}>
        <div className={styles.imageWrapper}>
          <Image src="/journey.png" alt="Tryvanta Music Founders and Students" width={600} height={450} className={styles.image} />
        </div>
        <div className={styles.content}>
          <h2 className={styles.title}>
            <span className={styles.highlight}>20+ Years</span> of Musical Journey
          </h2>
          <ul className={styles.list}>
            {items.map((item) => (
              <li className={styles.listItem} key={item.text}>
                <span className={styles.icon}>{item.icon}</span>
                <span className={styles.text}>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
