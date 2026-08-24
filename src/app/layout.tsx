import type { Metadata } from "next";
import { outfit, italianno } from "./fonts";
import { AuthProvider } from "@/context/AuthContext";
import FloatingContact from "@/components/FloatingContact/FloatingContact";
import "./globals.css";

export const metadata: Metadata = {
  title: "TRYVANTA MUSIC — Structured Music Learning. Real Mentorship. Lasting Skill.",
  description:
    "Learn music the right way with structured learning paths, verified tutors, and real human mentorship. Book your free assessment today.",
  authors: [{ name: "TRYVANTA MUSIC" }],
  keywords: [
    "music education",
    "online music lessons",
    "music mentorship",
    "learn music online",
    "structured music learning",
    "verified music tutors",
  ],
  openGraph: {
    title: "TRYVANTA MUSIC — Structured Music Learning. Real Mentorship.",
    description: "Human-led music education with structure, accountability, and real mentorship.",
    siteName: "TRYVANTA MUSIC",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TRYVANTA MUSIC — Structured Music Learning",
    description: "Human-led music education with structure, accountability, and real mentorship.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${italianno.variable}`}>
      <body>
        <AuthProvider>
          {children}
          <FloatingContact />
        </AuthProvider>
      </body>
    </html>
  );
}
