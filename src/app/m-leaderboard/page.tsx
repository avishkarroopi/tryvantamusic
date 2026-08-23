"use client";

import { useState } from "react";
import { Trophy, Users } from "lucide-react";
import styles from "./page.module.css";

// Recovered from "remaining pages data.zip" / m-leaderboard.html. The capture
// showed an empty leaderboard ("No rankings available yet") with a
// Students/Teachers toggle — reproduced as-is. The Student Dashboard sidebar
// shell it was embedded in is Phase 2 and intentionally not rebuilt here.
export default function LeaderboardPage() {
  const [tab, setTab] = useState<"students" | "teachers">("students");

  return (
    <main className={styles.main}>
      <div className={styles.glow} />
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleRow}>
            <div className={styles.trophyBadge}>
              <Trophy size={20} color="#fff" aria-hidden="true" />
            </div>
            <h1 className={styles.title}>
              Muziclly <span className={styles.titleAccent}>Leaderboard</span>
            </h1>
          </div>
        </header>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "students" ? styles.tabActive : ""}`}
            onClick={() => setTab("students")}
          >
            <Sparkles />
            Students
          </button>
          <button
            className={`${styles.tab} ${tab === "teachers" ? styles.tabActive : ""}`}
            onClick={() => setTab("teachers")}
          >
            <Users size={16} aria-hidden="true" />
            Teachers
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.emptyState}>
            <Trophy size={48} className={styles.emptyIcon} aria-hidden="true" />
            <p className={styles.emptyTitle}>No rankings available yet.</p>
            <p className={styles.emptyText}>Be the first to reach the top!</p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Sparkles() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
      <path d="M20 2v4" />
      <path d="M22 4h-4" />
      <circle cx="4" cy="20" r="2" />
    </svg>
  );
}
