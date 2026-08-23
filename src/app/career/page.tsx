import type { Metadata } from "next";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Careers | MUZICLLY",
  description: "Join a fast-growing team shaping music education with technology, creativity, and mentorship.",
};

interface Role {
  title: string;
  badge: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  eligibility: string[];
  salary: string;
}

const roles: Role[] = [
  {
    title: "Full Stack Developer (Fresher)",
    badge: "Fresher",
    description:
      "We are looking for a motivated Full Stack Developer who can build scalable web applications and work across both frontend and backend systems.",
    responsibilities: [
      "Develop responsive web applications using modern frameworks",
      "Build REST APIs and integrate with frontend",
      "Work with databases (MongoDB / MySQL)",
      "Debug, test, and optimize applications",
      "Collaborate with UI/UX and backend teams",
    ],
    skills: ["Frontend: HTML, CSS, JavaScript, React.js (preferred)", "Backend: Node.js / Java / Python", "Database: MongoDB or SQL", "Basic understanding of Git & APIs"],
    eligibility: ["Fresher / 0–1 year experience", "B.E/B.Tech/BCA/MCA or equivalent"],
    salary: "₹4–6 LPA (based on technical + HR performance)",
  },
  {
    title: "Digital Marketing Executive (Fresher)",
    badge: "Fresher",
    description: "We are hiring a Digital Marketing Executive to manage online campaigns, SEO, and brand presence.",
    responsibilities: [
      "Manage social media platforms",
      "Run Google Ads / Meta Ads campaigns",
      "Perform SEO & keyword optimization",
      "Analyze campaign performance using analytics tools",
      "Create content strategies",
    ],
    skills: ["Basic SEO knowledge", "Social media marketing", "Google Analytics / Ads (basic understanding)", "Content writing skills"],
    eligibility: ["Any graduate (Marketing preferred)", "Fresher with internship/project experience"],
    salary: "₹4–5 LPA",
  },
  {
    title: "AI Engineer (Fresher)",
    badge: "Fresher",
    description: "We are looking for an AI Engineer who is passionate about machine learning, deep learning, and real-world AI applications.",
    responsibilities: [
      "Build and train ML models",
      "Work on datasets, preprocessing, and feature engineering",
      "Implement AI solutions (NLP, Computer Vision, etc.)",
      "Deploy models using APIs or cloud services",
      "Optimize model performance",
    ],
    skills: ["Python (must)", "Libraries: NumPy, Pandas, Scikit-learn", "Basic Deep Learning (TensorFlow / PyTorch)", "Understanding of ML algorithms", "Knowledge of projects like YOLO, NLP, etc. (plus point)"],
    eligibility: ["Fresher with AI/ML projects", "B.Tech / MCA / relevant field"],
    salary: "₹5–6 LPA",
  },
  {
    title: "Data Analyst (Fresher)",
    badge: "Fresher",
    description: "We are hiring a Data Analyst to interpret data, generate insights, and support business decisions.",
    responsibilities: [
      "Analyze datasets and generate reports",
      "Create dashboards and visualizations",
      "Perform data cleaning and preprocessing",
      "Work with stakeholders to understand requirements",
      "Provide actionable insights",
    ],
    skills: ["Excel (Advanced)", "SQL", "Python (Pandas, Matplotlib)", "Power BI / Tableau (preferred)"],
    eligibility: ["Fresher with data-related projects", "B.Tech / BSc / BCA / MCA"],
    salary: "₹4–5.5 LPA",
  },
  {
    title: "UI/UX Designer (Fresher)",
    badge: "Fresher",
    description:
      "We are looking for a creative and detail-oriented UI/UX Designer who can design intuitive, user-friendly, and visually appealing digital experiences for web and mobile applications.",
    responsibilities: [
      "Design user interfaces for web and mobile applications",
      "Create wireframes, prototypes, and mockups",
      "Conduct basic user research and usability testing",
      "Collaborate with developers to implement designs",
      "Ensure consistency in design systems and branding",
      "Improve user experience based on feedback",
    ],
    skills: ["Tools: Figma / Adobe XD / Sketch", "Understanding of UI principles (layout, color, typography)", "Basic UX knowledge (user flow, usability, wireframing)", "Knowledge of responsive design", "Basic HTML/CSS (plus point, not mandatory)"],
    eligibility: ["Fresher / 0–1 year experience", "Any graduate (Design / IT preferred)", "Strong portfolio (mandatory – projects, case studies)"],
    salary: "₹4–5.5 LPA (based on design skills + interview performance)",
  },
];

export default function CareerPage() {
  return (
    <>
      <Navbar />
      <main>
        <div className={`container ${styles.page}`}>
          <section className={styles.hero}>
            <p className={styles.eyebrow}>WE ARE HIRING</p>
            <h1 className={styles.title}>Build your career with Muziclly</h1>
            <p className={styles.subtitle}>
              Join a fast-growing team shaping music education with technology, creativity, and mentorship. Explore
              open roles and apply directly through email.
            </p>
            <div className={styles.heroMeta}>
              <span>Open Positions: {roles.length}</span>
              <span>Experience: Fresher / 0-1 Year</span>
              <span>Location: Hyderabad (On-site/Hybrid by role)</span>
            </div>
          </section>

          <div className={styles.list}>
            {roles.map((role) => (
              <section className={styles.card} key={role.title}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>{role.title}</h2>
                  <span className={styles.badge}>{role.badge}</span>
                </div>
                <p className={styles.description}>{role.description}</p>

                <h3 className={styles.sectionTitle}>Responsibilities</h3>
                <ul className={styles.bullets}>
                  {role.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>

                <h3 className={styles.sectionTitle}>Required Skills</h3>
                <ul className={styles.bullets}>
                  {role.skills.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>

                <h3 className={styles.sectionTitle}>Eligibility</h3>
                <ul className={styles.bullets}>
                  {role.eligibility.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>

                <div className={styles.footer}>
                  <p className={styles.salary}>
                    <strong>Salary:</strong> {role.salary}
                  </p>
                </div>

                <a
                  href={`mailto:hello@muziclly.com?subject=${encodeURIComponent(`Application for ${role.title}`)}`}
                  className={styles.applyButton}
                >
                  Apply via Email
                </a>
              </section>
            ))}

            <section className={styles.applyInfo}>
              <h3>How to Apply</h3>
              <p>
                Click the Apply button for your preferred role and share your updated resume/portfolio to
                <a href="mailto:hello@muziclly.com"> hello@muziclly.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
