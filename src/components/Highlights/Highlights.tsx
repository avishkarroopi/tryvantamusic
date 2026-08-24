import styles from "./Highlights.module.css";

const highlights = [
  { icon: "🏛️", title: "20 Years Legacy", desc: "A strong musical foundation built over two decades of teaching, learning, and performance." },
  { icon: "👤", title: "1-to-1 Learning", desc: "Personalised online classes tailored to each student's level, pace, and individual goals." },
  { icon: "🎓", title: "Elite Founders", desc: "Founded by certified professionals from KMMC (A.R. Rahman's Academy)." },
  { icon: "🎸", title: "Independent Playing", desc: "Students learn to listen, understand, and confidently play songs on their own." },
  { icon: "🌍", title: "Proven Impact", desc: "25,000+ students trained and 150+ music tutors mentored globally." },
  { icon: "⭐", title: "4.9 Rated", desc: "Highly rated on Google with genuine parent and student testimonials." },
];

export default function Highlights() {
  return (
    <>
      <h3 className={styles.title}>Why Choose Tryvanta Music?</h3>
      <div className={styles.grid}>
        {highlights.map((h) => (
          <div className={styles.card} key={h.title}>
            <div className={styles.icon}>{h.icon}</div>
            <div>
              <h4 className={styles.heading}>{h.title}</h4>
              <p className={styles.desc}>{h.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
