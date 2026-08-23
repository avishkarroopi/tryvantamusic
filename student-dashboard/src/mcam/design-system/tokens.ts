/**
 * M-CAM V5 design tokens — "Stage & Signal".
 * Dark-first (you teach in a dim practice room). The accent is a tuner needle
 * going green: in-tune / live / connected / good — the most native metaphor in
 * a musician's world, chosen deliberately over generic AI-default accents.
 */

export const color = {
  stage: "#0E1116", // app background — a dim hall, not pure black
  surface: "#161A21", // panels, cards
  surfaceRaised: "#1C222B",
  hairline: "#232833", // 1px structure, dividers

  score: "#F5F2EC", // primary text — warm paper, not clinical white
  scoreMuted: "#A7ADBA", // secondary text

  signal: "#33C9A0", // tuner-green: in-tune / live / connected / good
  signalDim: "#1E7A63",
  peak: "#F5A524", // VU amber: caution, approaching clip, degraded network
  redzone: "#F4622E", // clipping, disconnected, error
} as const;

export const font = {
  display: `"Clash Display", ui-sans-serif, system-ui, sans-serif`, // characterful, restrained
  body: `"Inter", ui-sans-serif, system-ui, sans-serif`,
  mono: `"JetBrains Mono", ui-monospace, monospace`, // timecodes, BPM, latency
} as const;

export const scale = {
  // 4px base grid
  space: (n: number) => `${n * 4}px`,
  radius: { sm: "6px", md: "10px", lg: "16px", pill: "999px" },
  type: {
    caption: "12px",
    body: "15px",
    lead: "18px",
    title: "24px",
    display: "40px",
  },
} as const;

/** Connection/health color derived from live quality — the Staff bar reads this. */
export function healthColor(q: { rttMs: number; lossPct: number }): string {
  if (q.lossPct > 3 || q.rttMs > 250) return color.redzone;
  if (q.lossPct > 1 || q.rttMs > 150) return color.peak;
  return color.signal; // in tune
}
