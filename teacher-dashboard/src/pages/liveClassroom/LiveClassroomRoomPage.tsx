import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle, ArrowLeft, LayoutGrid, MessageSquareText, Mic, Music4, PenTool,
} from "lucide-react";
import { color, font } from "@/mcam/design-system/tokens";
import { useMcamAuth } from "@/mcam/integration/mcamAuth";
import { ensureClassroomLive, mcamSessionIdForBatch } from "@/mcam/integration/mcamClassroom";
import { MCAM_API_BASE, MCAM_WS_BASE } from "@/mcam/integration/config";
import { useClassroom } from "@/mcam/features/classroom/hooks/useClassroom";
import { useRealtime } from "@/mcam/features/classroom/hooks/useRealtime";
import { useMusicRoom } from "@/mcam/features/classroom/hooks/useMusicRoom";
import { useMedia } from "@/mcam/features/classroom/hooks/useMedia";
import { useRoomVideoTracks } from "@/mcam/features/classroom/hooks/useRoomVideoTracks";
import { VideoGrid } from "@/mcam/features/classroom/components/VideoGrid";
import { useStudio } from "@/mcam/features/studio/hooks/useStudio";
import { useMultiCamera } from "@/mcam/features/studio/hooks/useMultiCamera";
import { ChatPanel } from "@/mcam/features/classroom/components/ChatPanel";
import { ControlBar } from "@/mcam/features/classroom/components/ControlBar";
import { ParticipantList } from "@/mcam/features/classroom/components/ParticipantList";
import { PollCard } from "@/mcam/features/classroom/components/PollCard";
import { ReactionsLayer } from "@/mcam/features/classroom/components/ReactionsLayer";
import { SessionTimer } from "@/mcam/features/classroom/components/SessionTimer";
import { Whiteboard } from "@/mcam/features/whiteboard/components/Whiteboard";
import { SceneManager } from "@/mcam/features/studio/components/SceneManager";
import { StudioCanvas } from "@/mcam/features/studio/components/StudioCanvas";
import { FloatingToolbar } from "@/mcam/features/toolkit/components/FloatingToolbar";
import { teacher } from "@/mocks/seed";
import { useToast } from "@/hooks/useToast";
import { useFirebaseIdentity } from "@/hooks/useFirebaseIdentity";

type Tab = "classroom" | "whiteboard" | "studio";

/**
 * Live Classroom room — mounts the ported M-CAM classroom/whiteboard/studio
 * modules against the real M-CAM backend, wired through the integration
 * layer (`@/mcam/integration`). This is M-CAM's own "Stage & Signal" dark
 * theatre theme rather than the Dashboard's light chrome — a deliberate,
 * common pattern (a focused "on-air" view distinct from admin chrome) noted
 * in M-CAM_PRODUCTION_INTEGRATION_STATUS.md.
 */
export function LiveClassroomRoomPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const sessionId = mcamSessionIdForBatch(batchId!);
  // Real, verified identity when this session arrived via the main site's
  // sign-in handoff; falls back to the mock teacher only if that never
  // happened (e.g. the dashboard's own standalone mock-login flow) — so
  // the real path is fixed without breaking that unrelated existing one.
  const firebaseIdentity = useFirebaseIdentity();
  const currentTeacher = firebaseIdentity.identity
    ? { id: firebaseIdentity.identity.uid, name: firebaseIdentity.identity.name }
    : { id: teacher.id, name: teacher.name };
  const auth = useMcamAuth(currentTeacher);
  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState<Error>();

  useEffect(() => {
    if (!auth.token) return;
    let cancelled = false;
    setStarting(true);
    ensureClassroomLive(auth.token, sessionId)
      .then(() => {
        if (!cancelled) setStarting(false);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setStartError(err instanceof Error ? err : new Error(String(err)));
          setStarting(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [auth.token, sessionId]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 40, background: color.stage,
        color: color.score, fontFamily: font.body, display: "flex", flexDirection: "column",
      }}
    >
      <RoomTopBar sessionId={sessionId} onBack={() => navigate("/dashboard/live-classroom")} />
      <div style={{ flex: 1, minHeight: 0 }}>
        {auth.error || startError ? (
          <RoomError message={(auth.error ?? startError)!.message} />
        ) : auth.loading || starting || !auth.token ? (
          <RoomLoading label={auth.loading ? "Signing in to M-CAM…" : "Starting classroom…"} />
        ) : (
          <RoomInner sessionId={sessionId} token={auth.token} currentTeacher={currentTeacher} />
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
        <p style={{ fontFamily: font.display, fontSize: 16 }}>Couldn't start the classroom</p>
        <p style={{ fontSize: 13, color: color.scoreMuted }}>{message}</p>
      </div>
    </div>
  );
}

/** Mounted only once `token` is a real, guaranteed string — every hook below
 *  depends on it, so this split keeps hook order unconditional (see
 *  M-CAM_PRODUCTION_INTEGRATION_STATUS.md for why). */
function RoomInner({ sessionId, token, currentTeacher }: { sessionId: string; token: string; currentTeacher: { id: string; name: string } }) {
  const navigate = useNavigate();
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>("classroom");
  const [handRaised, setHandRaised] = useState(false);
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const startedAt = useMemo(() => Date.now(), []);

  const classroom = useClassroom(MCAM_API_BASE, token, sessionId);
  const rt = useRealtime({ wsBase: MCAM_WS_BASE, token, sessionId, role: "teacher", name: currentTeacher.name });
  const musicRoom = useMusicRoom({ apiBase: MCAM_API_BASE, accessToken: token, sessionId, role: "teacher" });
  const media = useMedia(musicRoom.roomRef.current);
  const videoTiles = useRoomVideoTracks(musicRoom.roomRef.current);
  const studio = useStudio(MCAM_API_BASE, token, sessionId);
  const camera = useMultiCamera();

  useEffect(() => {
    classroom.join(currentTeacher.name, "teacher").then(() => classroom.refreshRoster());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLeave() {
    await classroom.leave();
    musicRoom.disconnect();
    navigate("/dashboard/live-classroom");
  }

  async function handleEnd() {
    await classroom.end();
    musicRoom.disconnect();
    push({ kind: "info", title: "Classroom ended" });
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
        description: err instanceof Error ? err.message : "LiveKit is not reachable — see integration status doc.",
      });
    }
  }

  const streamsMap = useMemo(() => {
    const m = new Map<string, MediaStream>();
    camera.feeds.forEach((f) => m.set(f.deviceId, f.stream));
    return m;
  }, [camera.feeds]);

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
                <VideoGrid tiles={videoTiles} />
                <ReactionsLayer reactions={rt.reactions} />
                {videoTiles.length === 0 && (
                  <div style={{ textAlign: "center", color: color.scoreMuted }}>
                    <p style={{ fontFamily: font.display, fontSize: 18, color: color.score, marginBottom: 6 }}>
                      {musicRoom.state === "connected" ? "Live" : "Stage"}
                    </p>
                    <p style={{ fontSize: 13, marginBottom: 12 }}>
                      {musicRoom.state === "connected"
                        ? `Connected · quality ${musicRoom.health.quality} · ${musicRoom.health.rttMs}ms RTT · camera is off`
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
                )}
              </div>
              <div style={{ height: 240 }}>
                <PollCard poll={rt.poll} isTeacher onCreate={rt.createPoll} onVote={rt.vote} />
              </div>
            </div>
          )}

          {tab === "whiteboard" && (
            <div style={{ height: "100%" }}>
              <Whiteboard client={rt.client} isTeacher />
            </div>
          )}

          {tab === "studio" && (
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, height: "100%" }}>
              <SceneManager
                scenes={studio.scenes}
                activeId={studio.activeId}
                onSwitch={studio.setActiveId}
                onCreate={studio.createScene}
                onDuplicate={studio.duplicateScene}
                onRename={studio.renameScene}
                onDelete={studio.deleteScene}
                onReorder={studio.reorderScene}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <AddCameraSourceButton
                  camera={camera}
                  onAdd={(device) => {
                    studio.patchConfig((c) => ({
                      ...c,
                      sources: [
                        ...c.sources,
                        {
                          id: `src_${Date.now()}`, kind: "camera", label: device.label || "Camera",
                          deviceId: device.deviceId, rect: { x: 0, y: 0, w: 1, h: 1 }, z: c.sources.length,
                          visible: true,
                          settings: {
                            brightness: 1, contrast: 1, saturation: 1, exposure: 1, zoom: 1, rotation: 0,
                            mirror: false, flip: false, crop: null, blur: 0, greenScreen: false, chromaColor: "#00b140",
                          },
                        },
                      ],
                    }));
                  }}
                >
                  <LayoutGrid size={15} /> Add camera source
                </AddCameraSourceButton>
                <StudioCanvas
                  scene={studio.active}
                  streams={streamsMap}
                  editable
                  selectedSourceId={null}
                  onSelectSource={() => {}}
                  onMoveSource={(id, rect) =>
                    studio.patchConfig((c) => ({
                      ...c,
                      sources: c.sources.map((s) => (s.id === id ? { ...s, rect } : s)),
                    }))
                  }
                />
              </div>
            </div>
          )}
        </div>

        <SessionTimer startedAt={startedAt} />
        <ControlBar
          role="teacher"
          mic={mic}
          cam={cam}
          sharing={false}
          handRaised={handRaised}
          recording={false}
          onToggleMic={() => {
            if (!musicRoom.roomRef.current) {
              push({ kind: "info", title: "Not connected yet", description: "Connect audio/video first." });
              return;
            }
            musicRoom.toggleMute(); // actually mutes/unmutes the published LiveKit audio tracks
            const next = !mic;
            setMic(next);
            rt.setMediaState({ mic_on: next, cam_on: cam, sharing: false });
          }}
          onToggleCam={async () => {
            if (!musicRoom.roomRef.current) {
              push({ kind: "info", title: "Not connected yet", description: "Connect audio/video first." });
              return;
            }
            try {
              await media.toggleCam(); // actually publishes/unpublishes the camera track over LiveKit
              const next = !cam;
              setCam(next);
              rt.setMediaState({ mic_on: mic, cam_on: next, sharing: false });
            } catch (err) {
              push({
                kind: "error",
                title: "Couldn't access your camera",
                description: err instanceof Error ? err.message : "Check camera permissions and try again.",
              });
            }
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
          onRecord={() => push({ kind: "info", title: "Recording needs LiveKit egress + object storage configured", description: "See M-CAM_PRODUCTION_INTEGRATION_STATUS.md." })}
          onEnd={handleEnd}
        />
      </div>

      <div style={{ width: 320, borderLeft: `1px solid ${color.hairline}`, display: "flex", flexDirection: "column" }}>
        <ParticipantList
          participants={classroom.roster?.participants ?? []}
          waiting={classroom.roster?.waiting ?? []}
          handQueue={rt.handQueue}
          isTeacher
          onAdmit={classroom.admit}
          onRemove={classroom.remove}
        />
        <div style={{ flex: 1, minHeight: 280 }}>
          <ChatPanel
            messages={rt.messages}
            typing={rt.typing}
            selfId={currentTeacher.id}
            canAnnounce
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

/** "Add camera source" — was always opening the same first-detected camera
 *  (hardcoded `devices[0]`, no way to pick a different one, so a second
 *  click just no-opped since that device was already open). This actually
 *  lets you pick which plugged-in camera to add — e.g. a piano teacher's
 *  face cam AND a separate overhead/instrument cam. */
function AddCameraSourceButton({
  camera, onAdd, children,
}: {
  camera: ReturnType<typeof useMultiCamera>;
  // Deliberately not MediaDeviceInfo — its deviceId/label/etc. are getters
  // on the prototype, not own properties, so spreading an instance (as an
  // earlier version of this did) silently drops them all. Plain data only.
  onAdd: (device: { deviceId: string; label: string }) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const openDeviceIds = new Set(camera.feeds.map((f) => f.deviceId));
  const available = camera.devices.filter((d) => !openDeviceIds.has(d.deviceId));

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => {
          if (camera.devices.length === 0) void camera.refreshDevices();
          setOpen((o) => !o);
        }}
        style={connectBtn}
      >
        {children}
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 19 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, minWidth: 240,
              background: color.surfaceRaised, border: `1px solid ${color.hairline}`, borderRadius: 10,
              overflow: "hidden", boxShadow: "0 12px 30px rgba(0,0,0,0.4)",
            }}
          >
            {available.length === 0 ? (
              <div style={{ padding: "12px 14px", fontSize: 13, color: color.scoreMuted }}>
                {camera.devices.length === 0 ? "No cameras found — check your device is plugged in." : "All detected cameras are already added."}
              </div>
            ) : (
              available.map((d, i) => (
                <button
                  key={d.deviceId}
                  onClick={async () => {
                    setOpen(false);
                    const deviceId = d.deviceId;
                    const label = d.label || `Camera ${i + 1}`;
                    await camera.openCamera(deviceId, label);
                    onAdd({ deviceId, label });
                  }}
                  style={{
                    display: "block", width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13,
                    color: color.score, background: "transparent", border: "none", cursor: "pointer",
                    borderBottom: `1px solid ${color.hairline}`,
                  }}
                >
                  {d.label || `Camera ${i + 1}`}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function RoomTabs({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: typeof MessageSquareText }[] = [
    { id: "classroom", label: "Classroom", icon: MessageSquareText },
    { id: "whiteboard", label: "Whiteboard", icon: PenTool },
    { id: "studio", label: "Studio", icon: Music4 },
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
