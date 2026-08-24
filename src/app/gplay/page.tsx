import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Music, Mic2 as MicVocal, Sparkles, Bell, ArrowLeft } from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Coming Soon to Android | TRYVANTA MUSIC",
  description: "We're fine-tuning the acoustics. The full Tryvanta Music Studio Experience is coming to the Play Store soon.",
};

// Ported from the recovered original (_next/static/chunks/8999b71d2729d1c5.js).
export default function GPlayPage() {
  return (
    <main className={styles.container}>
      <div className={styles.background}>
        <div className={styles.blobPurple} />
        <div className={styles.blobOrange} />
        <div style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
          <Music
            className={styles.animateBounce}
            style={{ position: "absolute", top: "20%", left: "10%", width: 40, height: 40, color: "white", animationDuration: "3s" }}
          />
          <Music
            style={{
              position: "absolute",
              top: "70%",
              left: "80%",
              width: 60,
              height: 60,
              color: "white",
              animation: "float 5s infinite ease-in-out",
              transform: "rotate(15deg)",
            }}
          />
          <MicVocal
            className={styles.animatePulse}
            style={{ position: "absolute", top: "15%", right: "15%", width: 30, height: 30, color: "white", animationDuration: "4s" }}
          />
        </div>
        <div className={styles.noise} />
      </div>

      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <div className={styles.iconGlow} />
          <div className={styles.glassBox}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 24, marginBottom: 12 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} style={{ width: 4, height: "100%", backgroundColor: "#E8C547", borderRadius: 2, animation: `pulse 1.${n}s infinite ease-in-out` }} />
              ))}
            </div>
            <div
              style={{
                position: "relative",
                width: 60,
                height: 60,
                borderRadius: 12,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(0,0,0,0.2)",
              }}
            >
              <Image src="/logo-icon.png" alt="Tryvanta Music" fill style={{ objectFit: "contain", padding: 4 }} priority />
            </div>
            <div
              className={styles.animateBounce}
              style={{ position: "absolute", top: 15, right: 15, filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))" }}
            >
              <Sparkles style={{ width: 16, height: 16, color: "#FFF" }} />
            </div>
          </div>
        </div>

        <div className={styles.titleBox}>
          <h1 className={styles.title}>
            Setting the <br />
            <span className={styles.gradientText}>Stage</span> for Android
          </h1>
          <p className={styles.subtitle}>
            We&apos;re fine-tuning the acoustics. The full Tryvanta Music <span style={{ color: "#E8C547", fontWeight: 500 }}>Studio Experience</span>{" "}
            is coming to the Play Store soon.
          </p>
        </div>

        <div className={styles.actionBox}>
          <button className={`${styles.primaryButton} group`}>
            <div className={styles.buttonContent}>
              <span>Get Front Row Access</span>
              <Bell style={{ width: 20, height: 20, color: "#1E1E2A" }} />
            </div>
          </button>
        </div>

        <div className={styles.links}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 12 }}>
              <div style={{ width: 2, height: "60%", background: "white", opacity: 0.5, animation: "pulse 1s infinite" }} />
              <div style={{ width: 2, height: "100%", background: "white", opacity: 0.5, animation: "pulse 1.2s infinite" }} />
              <div style={{ width: 2, height: "40%", background: "white", opacity: 0.5, animation: "pulse 0.8s infinite" }} />
            </div>
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>Mastering in Progress...</span>
          </div>

          <Link href="/" className={styles.backLink}>
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Studio
          </Link>
        </div>
      </div>
    </main>
  );
}
