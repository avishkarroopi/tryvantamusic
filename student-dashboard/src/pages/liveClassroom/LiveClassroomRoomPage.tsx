import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Mic, MessageSquareText, PenTool } from "lucide-react";
import { color, font } from "@/mcam/design-system/tokens";
import { useMcamAuth } from "@/mcam/integration/mcamAuth";
import { mcamSessionIdForBatch } from "@/mcam/integration/mcamClassroom";
import { MCAM_API_BASE, MCAM_WS_BASE } from "@/mcam/integration/config";
import { useClassroom } from "@/mcam/features/classroom/hooks/useClassroom";
import { useRealtime } from "@/mcam/features/classroom/hooks/useRealtime";
import { useMusicRoom } from "@/mcam/features/classroom/hooks/useMusicRoom";
import { ChatPanel } from "@/mcam/features/classroom/components/ChatPanel";
import { ControlBar } from "@/mcam/features/classroom/components/ControlBar";
import { ParticipantList } from "@/mcam/features/classroom/components/ParticipantList";
import { PollCard } from "@/mcam/features/classroom/components/PollCard";
import { ReactionsLayer } from "@/mcam/features/classroom/components/ReactionsLayer";
import { SessionTimer } from "@/mcam/features/classroom/components/SessionTimer";
import { Whiteboard } from "@/mcam/features/whiteboard/components/Whiteboard";
import { FloatingToolbar } from "@/mcam/features/toolkit/components/FloatingToolbar";
import { student } from "@/mocks/seed";
import { useToast } from "@/hooks/useToast";

type Tab = "classroom" | "whiteboard";

/**
 * Live Classroom room — student side. Mirrors the Teacher Dashboard's
 * `LiveClassroomRoomPage` (same ported M-CAM modules, same integration
 * layer) but joins rather than hosts: no "start classroom" action, no
 * end/admit/remove/lock controls, no Studio tab. If the teacher hasn't
 * started the class yet, this polls and shows a waiting screen instead of
 * erroring, since the backend's `/join` 404s until the room exists
 * (see mcam-backend/app/features/classroom/service.py#ClassroomRegistry.get).
 */
export function LiveClassroomRoomPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const sessionId = mcamSessionIdForBatch(enrollmentId!);
  const auth = useMcamAuth({ id: student.id, name: student.name });

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 40, background: color.stage,
        color: color.score, fontFamily: font.body, display: "flex", flexDirection: "column",
      }}
    >
      <RoomTopBar sessionId={sessionId} onBack={() => navigate("/dashboard/live-classroom")} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {auth.error ? (
          <RoomError message={auth.error.message} />
        ) : auth.loading || !auth.token ? (
          <RoomLoading label="Signing in to M-CAM…" />
        ) : (
          <RoomInner sessionId={sessionId} token={auth.token} />
        )}
      </div>
    </div>
  );
}

function RoomTopBar({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12, padding: "10px 16px",
        borderBottom: `1px solid ${color.hairline}`, background: color.surface,
      }}
    >
      <button
        onClick={onBack}
        aria-label="Back to Live Classroom"
        style={{
          display: "flex", alignItems: "center", gap: 6, height: 34, padding: "0 12px",
          borderRadius: 8, cursor: "pointer", color: color.score, background: color.surfaceRaised,
          border: `1px solid ${color.hairline}`, fontSize: 13,
        }}
      >
        <ArrowLeft size={15} /> Back
      </button>
      <div style={{ fontFamily: font.display, fontSize: 15 }}>Live Classroom</div>
      <span style={{ fontSize: 12, color: color.scoreMuted }}>{sessionId}</span>
    </div>
  );
}

function RoomLoading({ label }: { label: string }) {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center", color: color.scoreMuted, fontSize: 14 }}>
      {label}
    </div>
  );
}

function RoomError({ message }: { message: string }) {
  return (
    <div style={{ height: "100%", display: "grid", placeItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, maxWidth: 420, textAlign: "center" }}>
        <AlertTriangle size={28} color={color.redzone} />
        <p style={{ fontFamily: font.display, fontSize: 16 }}>Couldn't join the classroom</p>
        <p style={{ fontSize: 13, color: color.scoreMuted }}>{message}</p>
      </div>
    </div>
  );
}

/** Mounted only once `token` is a real, guaranteed string — every hook below
 *  depends on it, keeping hook order unconditional. */
function RoomInner({ sessionId, token }: { sessionId: string; token: string }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("classroom");
  const [handRaised, setHandRaised] = useState(false);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [waiting, setWaiting] = useState(true);
  const [joinError, setJoinError] = useState<Error>();
  const startedAt = useMemo(() => Date.now(), []);

  const classroom = useClassroom(MCAM_API_BASE, token, sessionId);
  const rt = useRealtime({ wsBase: MCAM_WS_BASE, token, sessionId, role: "student", name: student.name });
  const musicRoom = useMusicRoom({ apiBase: MCAM_API_BASE, accessToken: token, sessionId, role: "student" });

  // Poll until the teacher has started the classroom (backend 404s /join
  // until then — that's an expected, not an error, outcome here).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function attempt() {
      try {
        await classroom.join(student.name, "student");
        if (cancelled) return;
        setWaiting(false);
        classroom.refreshRoster();
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("not live")) {
          timer = setTimeout(attempt, 4000);
        } else {
          setJoinError(err instanceof Error ? err : new Error(message));
        }
      }
    }
    attempt();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLeave() {
    await classroom.leave();
    musicRoom.disconnect();
    navigate("/dashboard/live-classroom");
  }

  async function handleConnectMedia() {
    try {
      await musicRoom.connect();
      push({ kind: "success", title: "Connected to media plane", description: "Audio is live over LiveKit." });
    } catch (err) {
      push({
        kind: "error",
        title: "Couldn't connect audio/video",
        description: err instanceof Error ? err.message : "LiveKit is not reachable.",
      });
    }
  }

  if (joinError) return <RoomError message={joinError.message} />;
  if (waiting) return <RoomLoading label="Waiting for your teacher to start the class…" />;

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <RoomTabs tab={tab} onChange={setTab} />

        <div style={{ flex: 1, minHeight: 0, position: "relative", padding: 16, overflow: "auto" }}>
          {tab === "classroom" && (
            <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", gap: 12 }}>
              <div
                style={{
                  position: "relative", flex: 1, minHeight: 220, borderRadius: 16, background: color.surface,
                  border: `1px solid ${color.hairline}`, display: "grid", placeItems: "center", overflow: "hidden",
                }}
              >
                <ReactionsLayer reactions={rt.reactions} />
                <div style={{ textAlign: "center", color: color.scoreMuted }}>
                  <p style={{ fontFamily: font.display, fontSize: 18, color: color.score, marginBottom: 6 }}>
                    {musicRoom.state === "connected" ? "Live" : "Stage"}
                  </p>
                  <p style={{ fontSize: 13, marginBottom: 12 }}>
                    {musicRoom.state === "connected"
                      ? `Connected · quality ${musicRoom.health.quality} · ${musicRoom.health.rttMs}ms RTT`
                      : "Audio/video isn't connected yet"}
                  </p>
                  {musicRoom.state !== "connected" && (
                    <button onClick={handleConnectMedia} style={connectBtn}>
                      <Mic size={15} /> Connect audio/video
                    </button>
                  )}
                  {musicRoom.pitch && (
                    <p style={{ marginTop: 10, fontSize: 12, color: color.signal }}>
                      Detected pitch: {musicRoom.pitch.note} ({musicRoom.pitch.cents > 0 ? "+" : ""}
                      {musicRoom.pitch.cents}c)
                    </p>
                  )}
                </div>
              </div>
              <div style={{ height: 240 }}>
                <PollCard poll={rt.poll} isTeacher={false} onCreate={rt.createPoll} onVote={rt.vote} />
              </div>
            </div>
          )}

          {tab === "whiteboard" && (
            <div style={{ height: "100%" }}>
              <Whiteboard client={rt.client} isTeacher={false} />
            </div>
          )}
        </div>

        <SessionTimer startedAt={startedAt} />
        <ControlBar
          role="student"
          mic={mic}
          cam={cam}
          sharing={false}
          handRaised={handRaised}
          recording={false}
          onToggleMic={() => {
            const next = !mic;
            setMic(next);
            rt.setMediaState({ mic_on: next, cam_on: cam, sharing: false });
          }}
          onToggleCam={() => {
            const next = !cam;
            setCam(next);
            rt.setMediaState({ mic_on: mic, cam_on: next, sharing: false });
          }}
          onToggleShare={() => push({ kind: "info", title: "Screen share needs a connected media session", description: "Connect audio/video first." })}
          onToggleHand={() => {
            const next = !handRaised;
            setHandRaised(next);
            if (next) rt.raiseHand();
            else rt.lowerHand();
          }}
          onReact={(emoji) => rt.react(emoji)}
          onLeave={handleLeave}
        />
      </div>

      <div style={{ width: 320, borderLeft: `1px solid ${color.hairline}`, display: "flex", flexDirection: "column" }}>
        <ParticipantList
          participants={classroom.roster?.participants ?? []}
          waiting={classroom.roster?.waiting ?? []}
          handQueue={rt.handQueue}
          isTeacher={false}
          onAdmit={() => {}}
          onRemove={() => {}}
        />
        <div style={{ flex: 1, minHeight: 280 }}>
          <ChatPanel
            messages={rt.messages}
            typing={rt.typing}
            selfId={student.id}
            canAnnounce={false}
            onSend={rt.sendChat}
            onTyping={rt.setTypingState}
            onAnnounce={rt.announce}
            onOpen={rt.clearUnread}
          />
        </div>
      </div>

      <FloatingToolbar analyser={null} apiBase={MCAM_API_BASE} token={token} sessionId={sessionId} room={musicRoom.roomRef.current} />
    </div>
  );
}

function RoomTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: typeof MessageSquareText }[] = [
    { id: "classroom", label: "Classroom", icon: MessageSquareText },
    { id: "whiteboard", label: "Whiteboard", icon: PenTool },
  ];
  return (
    <div style={{ display: "flex", gap: 4, padding: "10px 16px 0", borderBottom: `1px solid ${color.hairline}` }}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13,
              borderRadius: "10px 10px 0 0", cursor: "pointer", border: "none",
              background: active ? color.surface : "transparent",
              color: active ? color.score : color.scoreMuted,
              borderBottom: active ? `2px solid ${color.signal}` : "2px solid transparent",
            }}
          >
            <Icon size={15} /> {t.label}
          </button>
        );
      })}
    </div>
  );
}

const connectBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10,
  cursor: "pointer", background: color.signal, color: color.stage, border: "none", fontWeight: 600, fontSize: 13,
};
