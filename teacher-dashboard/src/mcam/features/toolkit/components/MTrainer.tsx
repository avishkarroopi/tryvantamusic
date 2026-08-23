/** M-TRAINER: upload any audio file, get real BPM + key detection, and see
 *  the matching scale/chord tones to practice along. */
import { FileAudio, Upload, Music2, Activity } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import { useMTrainer } from "../hooks/useMTrainer";

export function MTrainer() {
  const t = useMTrainer();

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 16, width: "100%" }}>
      {!t.result && (
        <label style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "40px 20px",
          borderRadius: 14, border: `1.5px dashed ${color.hairline}`, cursor: "pointer", textAlign: "center",
        }}>
          <input type="file" accept="audio/*" style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void t.analyze(f); }} />
          <Upload size={28} color={color.scoreMuted} />
          <span style={{ fontWeight: 600 }}>{t.analyzing ? "Analyzing…" : "Upload a song to analyze"}</span>
          <span style={{ fontSize: 12, color: color.scoreMuted }}>Real BPM + key detection, computed from the actual audio — no external service.</span>
        </label>
      )}

      {t.error && <p style={{ color: color.redzone, fontSize: 13 }}>{t.error}</p>}

      {t.result && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileAudio size={20} color={color.signal} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.result.fileName}</div>
              <div style={{ fontSize: 12, color: color.scoreMuted }}>{Math.round(t.result.durationSec)}s</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div style={box}>
              <div style={boxLabel}><Activity size={12} /> Tempo</div>
              <div style={boxValue}>{t.result.bpm} BPM</div>
            </div>
            <div style={box}>
              <div style={boxLabel}><Music2 size={12} /> Key</div>
              <div style={boxValue}>{t.result.key}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: color.scoreMuted, marginBottom: 4 }}>Detection confidence</div>
            <div style={{ height: 6, borderRadius: 3, background: color.surfaceRaised, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round(t.result.confidence * 100)}%`, background: color.signal }} />
            </div>
          </div>

          <div style={{ borderTop: `1px solid ${color.hairline}`, paddingTop: 12 }}>
            <div style={{ fontSize: 12, color: color.scoreMuted, marginBottom: 8 }}>Practice in {t.result.key}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {t.practiceScale.map((n) => <span key={n} style={pill}>{n}</span>)}
            </div>
            <div style={{ fontSize: 11, color: color.scoreMuted, marginBottom: 4 }}>Tonic chord</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {t.practiceChord.map((n) => <span key={n} style={{ ...pill, background: "rgba(51,201,160,0.15)", color: color.signal, borderColor: color.signal }}>{n}</span>)}
            </div>
          </div>

          <button onClick={t.reset} style={ghostBtn}>Analyze another song</button>
        </>
      )}
    </div>
  );
}

const box: React.CSSProperties = { borderRadius: 10, border: `1px solid ${color.hairline}`, background: color.surfaceRaised, padding: 12 };
const boxLabel: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: color.scoreMuted, textTransform: "uppercase", marginBottom: 4 };
const boxValue: React.CSSProperties = { fontFamily: font.mono, fontWeight: 700, fontSize: 17 };
const pill: React.CSSProperties = { padding: "4px 10px", borderRadius: 999, fontSize: 12, border: `1px solid ${color.hairline}`, background: color.surfaceRaised };
const ghostBtn: React.CSSProperties = {
  padding: "10px 14px", borderRadius: 8, border: `1px solid ${color.hairline}`, cursor: "pointer",
  background: "transparent", color: color.score, fontSize: 13,
};
