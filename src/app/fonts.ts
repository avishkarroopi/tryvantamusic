import localFont from "next/font/local";
import { Michroma, Kaushan_Script } from "next/font/google";

// Self-hosted from the recovered woff files (fonts.gstatic.com/s/outfit/v15/*,
// fonts.gstatic.com/s/italianno/v18/*) so the site renders identically offline
// and without depending on Google Fonts at build/runtime.
export const outfit = localFont({
  src: [
    { path: "../fonts/Outfit-300.woff", weight: "300", style: "normal" },
    { path: "../fonts/Outfit-400.woff", weight: "400", style: "normal" },
    { path: "../fonts/Outfit-500.woff", weight: "500", style: "normal" },
    { path: "../fonts/Outfit-600.woff", weight: "600", style: "normal" },
    { path: "../fonts/Outfit-700.woff", weight: "700", style: "normal" },
    { path: "../fonts/Outfit-800.woff", weight: "800", style: "normal" },
    { path: "../fonts/Outfit-900.woff", weight: "900", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});

export const italianno = localFont({
  src: [{ path: "../fonts/Italianno-400.woff", weight: "400", style: "normal" }],
  variable: "--font-italianno",
  display: "swap",
});

// Brand wordmark fonts, matched from the supplied brand-kit reference images
// (not the site's original recovered fonts — these are new, for the
// Tryvanta rebrand). Best-effort visual matches, not a guaranteed exact
// match to whatever the brand kit's designer actually used — replace if the
// real font names/files ever become available.
export const tryvantaSans = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-tryvanta-sans",
  display: "swap",
});

export const musicScript = Kaushan_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-music-script",
  display: "swap",
});
