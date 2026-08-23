/** Roster + waiting room. Teachers admit/remove; hand-raised sorts to top. */
import { motion, AnimatePresence } from "framer-motion";
import { Hand, MicOff, VideoOff, UserCheck, UserX, MonitorUp } from "lucide-react";
import { color, font } from "../../../design-system/tokens";
import type { Participant } from "../hooks/useClassroom";

interface Props {
  participants: Participant[]; waiting: Participant[];
  handQueue: string[]; isTeacher: boolean;
  onAdmit: (id: string) => void; onRemove: (id: string) => void;
}

export function ParticipantList(p: Props) {
  const ordered = [...p.participants].sort(
    (a, b) => Number(p.handQueue.includes(b.user_id)) - Number(p.handQueue.includes(a.user_id)));

  return (
    <div style={{ fontFamily: font.body, color: color.score, padding: 12, overflowY: "auto" }}>
      {p.isTeacher && p.waiting.length > 0 && (
        <>
          <Label>Waiting room · {p.waiting.length}</Label>
          <AnimatePresence>
            {p.waiting.map((w) => (
              <motion.div key={w.user_id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={row}>
                <Avatar name={w.display_name} />
                <span style={{ flex: 1 }}>{w.display_name}</span>
                <button aria-label="Admit" onClick={() => p.onAdmit(w.user_id)} style={admitBtn}>
                  <UserCheck size={16} />
                </button>
                <button aria-label="Deny" onClick={() => p.onRemove(w.user_id)} style={denyBtn}>
                  <UserX size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      <Label>In class · {ordered.length}</Label>
      {ordered.map((m) => {
        const raised = p.handQueue.includes(m.user_id);
        return (
          <div key={m.user_id} style={{ ...row, background: raised ? "rgba(51,201,160,0.08)" : "transparent" }}>
            <Avatar name={m.display_name} />
            <span style={{ flex: 1 }}>
              {m.display_name}
              {m.role === "teacher" && <Tag>host</Tag>}
            </span>
            {raised && <Hand size={15} color={color.signal} />}
            {m.sharing && <MonitorUp size={15} color={color.peak} />}
            {!m.mic_on && <MicOff size={15} color={color.scoreMuted} />}
            {!m.cam_on && <VideoOff size={15} color={color.scoreMuted} />}
            {p.isTeacher && m.role !== "teacher" && (
              <button aria-label="Remove" onClick={() => p.onRemove(m.user_id)} style={denyBtn}>
                <UserX size={15} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

const row: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, padding: "8px 6px", fontSize: 14,
};
function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, letterSpacing: 0.4, textTransform: "uppercase",
    color: color.scoreMuted, margin: "12px 6px 4px" }}>{children}</div>;
}
function Tag({ children }: { children: React.ReactNode }) {
  return <span style={{ marginLeft: 8, fontSize: 10, padding: "2px 6px", borderRadius: 999,
    background: color.surfaceRaised, color: color.scoreMuted }}>{children}</span>;
}
function Avatar({ name }: { name: string }) {
  return <div style={{ width: 30, height: 30, borderRadius: 999, background: color.surfaceRaised,
    display: "grid", placeItems: "center", fontSize: 13, color: color.signal }}>
    {name.slice(0, 1).toUpperCase()}</div>;
}
const admitBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, cursor: "pointer",
  color: color.stage, background: color.signal, border: "none" };
const denyBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, cursor: "pointer",
  color: color.scoreMuted, background: color.surfaceRaised, border: `1px solid ${color.hairline}` };
