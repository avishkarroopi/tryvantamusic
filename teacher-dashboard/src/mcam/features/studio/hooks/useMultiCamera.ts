/** Manage multiple simultaneous camera streams (face / instrument / top / side /
 *  USB / external). Opens getUserMedia per deviceId and tracks them by id. */
import { useCallback, useEffect, useRef, useState } from "react";

export interface CameraFeed { deviceId: string; label: string; stream: MediaStream; }

export function useMultiCamera() {
  const [feeds, setFeeds] = useState<CameraFeed[]>([]);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const streams = useRef(new Map<string, MediaStream>());

  const refreshDevices = useCallback(async () => {
    try { await navigator.mediaDevices.getUserMedia({ video: true }); } catch { /* denied */ }
    const all = await navigator.mediaDevices.enumerateDevices();
    setDevices(all.filter((d) => d.kind === "videoinput"));
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices.addEventListener("devicechange", refreshDevices);
    return () => navigator.mediaDevices.removeEventListener("devicechange", refreshDevices);
  }, [refreshDevices]);

  const openCamera = useCallback(async (deviceId: string, label: string) => {
    if (streams.current.has(deviceId)) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 },
               frameRate: { ideal: 60 } },
      audio: false,
    });
    streams.current.set(deviceId, stream);
    setFeeds((f) => [...f, { deviceId, label, stream }]);
  }, []);

  const closeCamera = useCallback((deviceId: string) => {
    streams.current.get(deviceId)?.getTracks().forEach((t) => t.stop());
    streams.current.delete(deviceId);
    setFeeds((f) => f.filter((x) => x.deviceId !== deviceId));
  }, []);

  useEffect(() => () => { streams.current.forEach((s) => s.getTracks().forEach((t) => t.stop())); }, []);

  return { feeds, devices, openCamera, closeCamera, refreshDevices };
}
