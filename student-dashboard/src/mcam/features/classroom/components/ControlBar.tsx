/** The classroom control bar: mic / cam / screen / hand / reactions / leave.
 *  Teacher also sees record + end. Minimal, dark, keyboard accessible. */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Mic, MicOff, Video, VideoOff, MonitorUp, Hand, Smile, Circle, PhoneOff, Square,
} from "lucide-react";
import { color, font } from "../../../design-system/tokens";

interface Props {
  role: "teacher" | "student" | "parent" | "observer";
  mic: boolean; cam: boolean; sharing: boolean; handRaised: boolean; recording: boolean;
  onToggleMic: () => void; onToggleCam: () => void; onToggleShare: () => void;
  onToggleHand: () => void; onReact: (emoji: string) => void;
  onLeave: () => void; onRecord?: () => void; onEnd?: () => void;
}

const REACTIONS = ["👍", "👏", "❤️", "🎉"];

export function ControlBar(p: Props) {
  const [showReacts, setShowReacts] = useState(false);
  const canPublish = p.role === "teacher" || p.role === "student";

  return (
    <div style={{
      display: "flex", gap: 8, alignItems: "center", justifyContent: "center",
      padding: "10px 14px", background: color.surface,
      borderTop: `1px solid ${color.hairline}`, fontFamily: font.body,
    }}>
      {canPublish && (
        <>
          <IconBtn active={p.mic} label={p.mic ? "Mute" : "Unmute"} onClick={p.onToggleMic}
            danger={!p.mic}>{p.mic ? <Mic size={18} /> : <MicOff size={18} />}</IconBtn>
          <IconBtn active={p.cam} label={p.cam ? "Stop video" : "Start video"} onClick={p.onToggleCam}
            danger={!p.cam}>{p.cam ? <Video size={18} /> : <VideoOff size={18} />}</IconBtn>
          <IconBtn active={p.sharing} label="Share screen" onClick={p.onToggleShare}>
            <MonitorUp size={18} />
          </IconBtn>
          <IconBtn active={p.handRaised} label="Raise hand" onClick={p.onToggleHand}>
            <Hand size={18} />
          </IconBtn>
        </>
      )}

      <div style={{ position: "relative" }}>
        <IconBtn label="React" onClick={() => setShowReacts((s) => !s)}><Smile size={18} /></IconBtn>
        {showReacts && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            style={{
              position: "absolute", bottom: 52, left: "50%", transform: "translateX(-50%)",
              display: "flex", gap: 6, padding: 8, borderRadius: 12,
              background: color.surfaceRaised, border: `1px solid ${color.hairline}`,
            }}>
            {REACTIONS.map((e) => (
              <button key={e} onClick={() => { p.onReact(e); setShowReacts(false); }}
                style={{ fontSize: 22, background: "none", border: "none", cursor: "pointer" }}>
                {e}
              </button>
            ))}
          </motion.div>
        )}
      </div>

      {p.role === "teacher" && (
        <IconBtn active={p.recording} label={p.recording ? "Stop recording" : "Record"}
          onClick={p.onRecord} danger={p.recording}>
          {p.recording ? <Square size={16} /> : <Circle size={16} />}
        </IconBtn>
      )}

      <div style={{ width: 1, height: 24, background: color.hairline, margin: "0 4px" }} />

      <button onClick={p.onLeave} style={leaveStyle} aria-label="Leave">
        <PhoneOff size={18} /> Leave
      </button>
      {p.role === "teacher" && (
        <button onClick={p.onEnd} style={{ ...leaveStyle, background: color.redzone }}
          aria-label="End for all">End</button>
      )}
    </div>
  );
}

function IconBtn(props: {
  children: React.ReactNode; label: string; onClick?: () => void;
  active?: boolean; danger?: boolean;
}) {
  return (
    <motion.button whileTap={{ scale: 0.92 }} onClick={props.onClick} aria-label={props.label}
      title={props.label}
      style={{
        width: 44, height: 44, borderRadius: 10, cursor: "pointer",
        display: "grid", placeItems: "center",
        color: props.danger ? color.redzone : props.active ? color.signal : color.score,
        background: props.active ? "rgba(51,201,160,0.12)" : color.surfaceRaised,
        border: `1px solid ${props.active ? color.signalDim : color.hairline}`,
      }}>
      {props.children}
    </motion.button>
  );
}

const leaveStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 6, height: 44, padding: "0 14px",
  borderRadius: 10, border: "none", cursor: "pointer", color: "#fff",
  background: "#B4402A", fontWeight: 600,
};
