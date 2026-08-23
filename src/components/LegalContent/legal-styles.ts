import type { CSSProperties } from "react";

// Recovered verbatim from the inline `style` attributes used directly in the
// original privacy-policy and terms-of-service pages (no CSS module there).
export const legalStyles: Record<string, CSSProperties> = {
  page: { paddingBottom: "4rem", paddingTop: "4rem" },
  h1: { marginBottom: "2rem" },
  lastUpdated: { marginBottom: "2rem", fontSize: "1.125rem", color: "var(--color-text-secondary)" },
  section: { marginBottom: "3rem" },
  h2: { marginBottom: "1rem", color: "var(--color-text-accent)" },
  pMb1: { marginBottom: "1rem" },
  ul: { listStyleType: "disc", paddingLeft: "1.5rem", marginBottom: "1rem", color: "var(--color-text-secondary)" },
  ulNoMb: { listStyleType: "disc", paddingLeft: "1.5rem", color: "var(--color-text-secondary)" },
  ulMt1: { listStyleType: "disc", paddingLeft: "1.5rem", marginTop: "1rem", color: "var(--color-text-secondary)" },
  li: { marginBottom: "0.5rem" },
  strong: { color: "var(--color-text-primary)" },
  contactLink: { marginTop: "1rem", color: "var(--color-text-primary)", fontWeight: "bold" },
};
