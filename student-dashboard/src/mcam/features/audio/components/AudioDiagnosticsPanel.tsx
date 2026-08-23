/** The diagnostics surface: quality score, latency, packet loss, background
 *  noise, headphone detection, mic/speaker tests, and live AI recommendations. */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Wifi, Headphones, Gauge, Mic, Volume2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { AudioMeter } from "./AudioMeter";
import type { Assessment } from "../hooks/useAudioEngine";

export function AudioDiagnosticsPanel(p: {
  level: { rms_dbfs: number; peak_dbfs: number; clipping_pct: number; noise_floor_dbfs: number };
  net: { loss_pct: number; rtt_ms: number };
  assessment: Assessment | null;
  headphones: boolean; onHeadphones: (v: boolean) => void;
  onMicTest: () => Promise<number>; onSpeakerTest: () => void;
}) {
  const [micResult, setMicResult] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const score = p.assessment?.score ?? 0;
  const tone = score >= 85 ? color.signal : score >= 50 ? color.peak : color.redzone;

  return (
    <div style={{
      fontFamily: font.body, color: color.score, display: "grid", gap: 14, padding: 16,
      background: color.surface, borderRadius: 16, border: `1px solid ${color.hairline}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Ring score={score} tone={tone} />
        <div>
          <div style={{ fontSize: 12, color: color.scoreMuted }}>Audio quality</div>
          <div style={{ fontSize: 22, fontWeight: 600, textTransform: "capitalize" }}>
            {p.assessment?.level ?? "measuring…"}
          </div>
        </div>
      </div>

      <div><div style={{ fontSize: 11, color: color.scoreMuted, marginBottom: 6 }}>Input level</div>
        <AudioMeter rms={p.level.rms_dbfs} peak={p.level.peak_dbfs} clipping={p.level.clipping_pct} /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Stat icon={<Gauge size={15} />} label="Latency"
          value={`${Math.round(p.net.rtt_ms)} ms`} tone={p.net.rtt_ms > 150 ? color.peak : color.signal} />
        <Stat icon={<Wifi size={15} />} label="Packet loss"
          value={`${p.net.loss_pct.toFixed(1)}%`} tone={p.net.loss_pct > 1 ? color.peak : color.signal} />
        <Stat icon={<Activity size={15} />} label="Noise floor"
          value={`${p.level.noise_floor_dbfs.toFixed(0)} dB`}
          tone={p.level.noise_floor_dbfs > -45 ? color.peak : color.signal} />
        <button onClick={() => p.onHeadphones(!p.headphones)}
          style={{ ...statBox, cursor: "pointer", borderColor: p.headphones ? color.signalDim : color.hairline }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, color: color.scoreMuted, fontSize: 12 }}>
            <Headphones size={15} /> Headphones</span>
          <span style={{ color: p.headphones ? color.signal : color.peak, fontWeight: 600 }}>
            {p.headphones ? "On" : "Off"}</span>
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={testBtn} disabled={testing}
          onClick={async () => { setTesting(true); setMicResult(await p.onMicTest()); setTesting(false); }}>
          <Mic size={15} /> {testing ? "Listening…" : "Test mic"}
        </button>
        <button style={testBtn} onClick={p.onSpeakerTest}><Volume2 size={15} /> Test speaker</button>
        {micResult !== null && (
          <span style={{ alignSelf: "center", fontSize: 12, color: color.scoreMuted }}>
            peak {micResult} dBFS</span>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <AnimatePresence initial={false}>
          {(p.assessment?.recommendations ?? []).map((r) => {
            const good = /clean|good|in tune/i.test(r);
            return (
              <motion.div key={r} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 10px", borderRadius: 10,
                  background: color.stage, border: `1px solid ${color.hairline}`, fontSize: 13,
                }}>
                {good ? <CheckCircle2 size={15} color={color.signal} style={{ flexShrink: 0, marginTop: 1 }} />
                      : <AlertTriangle size={15} color={color.peak} style={{ flexShrink: 0, marginTop: 1 }} />}
                {r}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

const statBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 4, padding: "10px 12px", borderRadius: 12,
  background: "#0E1116", border: "1px solid #232833", alignItems: "flex-start",
};
const testBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10,
  background: "#1C222B", color: "#F5F2EC", border: "1px solid #232833", cursor: "pointer", fontSize: 13,
};

function Stat(p: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  return (
    <div style={statBox}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, color: color.scoreMuted, fontSize: 12 }}>
        {p.icon} {p.label}</span>
      <span style={{ color: p.tone, fontWeight: 600, fontFamily: font.mono }}>{p.value}</span>
    </div>
  );
}
function Ring({ score, tone }: { score: number; tone: string }) {
  const r = 26, c = 2 * Math.PI * r, off = c * (1 - score / 100);
  return (
    <svg width={64} height={64} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={32} cy={32} r={r} fill="none" stroke={color.hairline} strokeWidth={6} />
      <motion.circle cx={32} cy={32} r={r} fill="none" stroke={tone} strokeWidth={6}
        strokeLinecap="round" strokeDasharray={c} animate={{ strokeDashoffset: off }}
        style={{ strokeDashoffset: off }} />
      <text x={32} y={32} transform="rotate(90 32 32)" textAnchor="middle" dominantBaseline="central"
        fill={color.score} fontSize={16} fontFamily={font.mono}>{score}</text>
    </svg>
  );
}
