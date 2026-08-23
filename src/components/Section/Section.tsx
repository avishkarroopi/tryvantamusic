import type { ReactNode } from "react";
import styles from "./Section.module.css";

type Background = "primary" | "secondary" | "tertiary";
type Padding = "sm" | "md" | "lg" | "xl";

interface SectionProps {
  id?: string;
  background?: Background;
  padding?: Padding;
  className?: string;
  children: ReactNode;
}

const paddingClass: Record<Padding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
  xl: styles.paddingXl,
};

export default function Section({ id, background = "primary", padding = "md", className = "", children }: SectionProps) {
  const classes = [styles.section, styles[background], paddingClass[padding], className].filter(Boolean).join(" ");
  return (
    <section id={id} className={classes}>
      <div className={styles.container}>{children}</div>
    </section>
  );
}
