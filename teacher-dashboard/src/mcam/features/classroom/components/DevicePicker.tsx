/** Camera / microphone / speaker selection. Enumerates devices and reports the
 *  chosen ids up so the media layer can switch tracks (setSinkId for speakers). */
import { useEffect, useState } from "react";
import { color, font } from "../../../design-system/tokens";

interface Selected { cameraId?: string; micId?: string; speakerId?: string; }

export function DevicePicker({ value, onChange }: {
  value: Selected; onChange: (next: Selected) => void;
}) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const load = async () => {
      // Permission first, otherwise labels are empty.
      try { await navigator.mediaDevices.getUserMedia({ audio: true, video: true }); } catch { /* denied */ }
      setDevices(await navigator.mediaDevices.enumerateDevices());
    };
    load();
    navigator.mediaDevices.addEventListener("devicechange", load);
    return () => navigator.mediaDevices.removeEventListener("devicechange", load);
  }, []);

  const group = (kind: MediaDeviceInfo["kind"]) => devices.filter((d) => d.kind === kind);

  return (
    <div style={{ fontFamily: font.body, color: color.score, display: "grid", gap: 12, padding: 16 }}>
      <Field label="Camera">
        <Select options={group("videoinput")} value={value.cameraId}
          onChange={(id) => onChange({ ...value, cameraId: id })} />
      </Field>
      <Field label="Microphone">
        <Select options={group("audioinput")} value={value.micId}
          onChange={(id) => onChange({ ...value, micId: id })} />
      </Field>
      <Field label="Speaker">
        <Select options={group("audiooutput")} value={value.speakerId}
          onChange={(id) => onChange({ ...value, speakerId: id })} />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, color: color.scoreMuted }}>
      {label}{children}
    </label>
  );
}
function Select({ options, value, onChange }: {
  options: MediaDeviceInfo[]; value?: string; onChange: (id: string) => void;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        height: 40, padding: "0 10px", borderRadius: 10, color: color.score,
        background: color.stage, border: `1px solid ${color.hairline}`, outline: "none",
      }}>
      {options.map((d) => (
        <option key={d.deviceId} value={d.deviceId}>{d.label || `${d.kind} (${d.deviceId.slice(0, 6)})`}</option>
      ))}
    </select>
  );
}
