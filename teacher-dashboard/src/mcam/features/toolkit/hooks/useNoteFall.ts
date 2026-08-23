/** M-FALL: Synthesia-style falling-notes sight-reading trainer. Audio-clock
 *  driven (not setInterval) so the note highway and judging never drift,
 *  polyphonic (chords), with a small built-in song library. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { playKeyNote } from "../../../lib/audio/keySynth";
import { parseMidiFile } from "../../../lib/audio/midiParser";

export interface SongNote { p: number; t: number; d: number } // pitch (MIDI), time (s), duration (s)
export interface Song { id: string; title: string; difficulty: "Easy" | "Medium" | "Hard"; bpm: number; notes: SongNote[] }

export const SONG_LIBRARY: Song[] = [
  {
    id: "scale_c", title: "C Major Scale", difficulty: "Easy", bpm: 100,
    notes: [
      { p: 60, t: 0, d: 0.5 }, { p: 62, t: 0.5, d: 0.5 }, { p: 64, t: 1.0, d: 0.5 },
      { p: 65, t: 1.5, d: 0.5 }, { p: 67, t: 2.0, d: 0.5 }, { p: 69, t: 2.5, d: 0.5 },
      { p: 71, t: 3.0, d: 0.5 }, { p: 72, t: 3.5, d: 1.0 },
      { p: 72, t: 5.0, d: 0.5 }, { p: 71, t: 5.5, d: 0.5 }, { p: 69, t: 6.0, d: 0.5 },
      { p: 67, t: 6.5, d: 0.5 }, { p: 65, t: 7.0, d: 0.5 }, { p: 64, t: 7.5, d: 0.5 },
      { p: 62, t: 8.0, d: 0.5 }, { p: 60, t: 8.5, d: 1.0 },
    ],
  },
  {
    id: "twinkle", title: "Twinkle Twinkle", difficulty: "Easy", bpm: 120,
    notes: [
      { p: 60, t: 0, d: 0.5 }, { p: 60, t: 0.5, d: 0.5 }, { p: 67, t: 1.0, d: 0.5 }, { p: 67, t: 1.5, d: 0.5 },
      { p: 69, t: 2.0, d: 0.5 }, { p: 69, t: 2.5, d: 0.5 }, { p: 67, t: 3.0, d: 1.0 },
      { p: 65, t: 4.5, d: 0.5 }, { p: 65, t: 5.0, d: 0.5 }, { p: 64, t: 5.5, d: 0.5 }, { p: 64, t: 6.0, d: 0.5 },
      { p: 62, t: 6.5, d: 0.5 }, { p: 62, t: 7.0, d: 0.5 }, { p: 60, t: 7.5, d: 1.0 },
    ],
  },
  {
    id: "chords_basic", title: "Basic Triads (I–IV–V–I)", difficulty: "Medium", bpm: 90,
    notes: [
      { p: 60, t: 0, d: 1 }, { p: 64, t: 0, d: 1 }, { p: 67, t: 0, d: 1 },
      { p: 65, t: 2, d: 1 }, { p: 69, t: 2, d: 1 }, { p: 72, t: 2, d: 1 },
      { p: 67, t: 4, d: 1 }, { p: 71, t: 4, d: 1 }, { p: 74, t: 4, d: 1 },
      { p: 60, t: 6, d: 2 }, { p: 64, t: 6, d: 2 }, { p: 67, t: 6, d: 2 },
    ],
  },
];

export const MIDI_START = 48; // C3
export const MIDI_END = 84;   // C6

export type NoteStatus = "upcoming" | "hit" | "missed";
export interface FallNote extends SongNote { id: number; status: NoteStatus }

const HIT_WINDOW_S = 0.18; // +/- for a hittable note
const PERFECT_WINDOW_S = 0.06;

export function useNoteFall() {
  const [customSongs, setCustomSongs] = useState<Song[]>([]);
  const [songIdx, setSongIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [notes, setNotes] = useState<FallNote[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState({ hits: 0, perfects: 0, misses: 0, combo: 0, bestCombo: 0 });
  const [lastJudgement, setLastJudgement] = useState<{ text: string; ts: number } | null>(null);
  const [scrollSpeed, setScrollSpeed] = useState(160); // px/sec
  const [uploadError, setUploadError] = useState<string | null>(null);

  const library = useMemo(() => [...SONG_LIBRARY, ...customSongs], [customSongs]);
  const ctxRef = useRef<AudioContext | null>(null);
  const startAudioTimeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const song = library[songIdx] ?? library[0];

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    if (ctxRef.current.state === "suspended") void ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const load = useCallback((idx: number) => {
    setSongIdx(idx);
    setNotes(library[idx].notes.map((n, i) => ({ ...n, id: i, status: "upcoming" as NoteStatus })));
    setStats({ hits: 0, perfects: 0, misses: 0, combo: 0, bestCombo: 0 });
    setElapsed(0);
    setPlaying(false);
  }, [library]);

  useEffect(() => { load(0); }, [load]);

  const start = useCallback(() => {
    const ctx = ensureCtx();
    startAudioTimeRef.current = ctx.currentTime;
    setNotes(song.notes.map((n, i) => ({ ...n, id: i, status: "upcoming" as NoteStatus })));
    setStats({ hits: 0, perfects: 0, misses: 0, combo: 0, bestCombo: 0 });
    setPlaying(true);
  }, [ensureCtx, song]);

  const stop = useCallback(() => setPlaying(false), []);
  const restart = useCallback(() => { setPlaying(false); load(songIdx); }, [load, songIdx]);

  // playback clock + auto-miss sweep
  useEffect(() => {
    if (!playing) { if (rafRef.current) cancelAnimationFrame(rafRef.current); return; }
    const ctx = ctxRef.current!;
    const tick = () => {
      const t = ctx.currentTime - startAudioTimeRef.current;
      setElapsed(t);
      setNotes((prev) => {
        let changed = false;
        const next = prev.map((n) => {
          if (n.status === "upcoming" && t > n.t + HIT_WINDOW_S) {
            changed = true;
            return { ...n, status: "missed" as NoteStatus };
          }
          return n;
        });
        if (changed) {
          const newlyMissed = next.filter((n, i) => n.status === "missed" && prev[i].status === "upcoming").length;
          if (newlyMissed > 0) {
            setStats((s) => ({ ...s, misses: s.misses + newlyMissed, combo: 0 }));
          }
        }
        return changed ? next : prev;
      });
      const last = song.notes[song.notes.length - 1];
      if (t > last.t + last.d + 2) { setPlaying(false); return; }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, song]);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); void ctxRef.current?.close(); }, []);

  /** Called when the learner presses a key (mouse/touch/QWERTY) — judges the
   *  closest hittable upcoming note at this pitch. */
  const pressNote = useCallback((midi: number) => {
    const ctx = ensureCtx();
    playKeyNote(ctx, midi, 0.55, 0.5);
    if (!playing) return;
    const t = ctx.currentTime - startAudioTimeRef.current;

    setNotes((prev) => {
      let bestIdx = -1, bestDiff = Infinity;
      prev.forEach((n, i) => {
        if (n.status !== "upcoming" || n.p !== midi) return;
        const diff = Math.abs(n.t - t);
        if (diff <= HIT_WINDOW_S && diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      });
      if (bestIdx === -1) return prev;
      const perfect = bestDiff <= PERFECT_WINDOW_S;
      setStats((s) => {
        const combo = s.combo + 1;
        return { hits: s.hits + 1, perfects: s.perfects + (perfect ? 1 : 0), misses: s.misses, combo, bestCombo: Math.max(s.bestCombo, combo) };
      });
      setLastJudgement({ text: perfect ? "Perfect!" : "Good", ts: Date.now() });
      const next = [...prev];
      next[bestIdx] = { ...next[bestIdx], status: "hit" };
      return next;
    });
  }, [ensureCtx, playing]);

  const accuracy = useMemo(() => {
    const total = stats.hits + stats.misses;
    return total === 0 ? 100 : Math.round((stats.hits / total) * 100);
  }, [stats]);

  /** Song upload: real .mid/.midi files (parsed via a minimal SMF parser) or
   *  a .json file matching the Song shape — either way it's appended to the
   *  library and auto-selected. */
  const uploadSong = useCallback(async (file: File) => {
    setUploadError(null);
    try {
      let song: Song;
      if (/\.(mid|midi)$/i.test(file.name)) {
        const buf = await file.arrayBuffer();
        const parsed = parseMidiFile(buf, file.name);
        if (parsed.notes.length === 0) throw new Error("No notes found in this MIDI file.");
        song = {
          id: `upload-${Date.now()}`, title: parsed.title, bpm: parsed.bpm,
          difficulty: parsed.notes.length > 200 ? "Hard" : parsed.notes.length > 60 ? "Medium" : "Easy",
          notes: parsed.notes,
        };
      } else if (/\.json$/i.test(file.name)) {
        const text = await file.text();
        const raw = JSON.parse(text) as Partial<Song>;
        if (!Array.isArray(raw.notes) || raw.notes.some((n) => typeof n.p !== "number" || typeof n.t !== "number")) {
          throw new Error("JSON must have a notes[] array of { p, t, d }.");
        }
        song = {
          id: `upload-${Date.now()}`, title: raw.title || file.name.replace(/\.json$/i, ""),
          bpm: raw.bpm ?? 100, difficulty: raw.difficulty ?? "Medium", notes: raw.notes as SongNote[],
        };
      } else {
        throw new Error("Unsupported file type — upload a .mid/.midi or .json file.");
      }
      setCustomSongs((prev) => [...prev, song]);
      setSongIdx(library.length); // library will include the new song on next render; index = old length
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Could not read this file.");
    }
  }, [library.length]);

  return {
    song, songIdx, setSongIdx: load, playing, start, stop, restart, notes, elapsed,
    stats, accuracy, lastJudgement, pressNote, scrollSpeed, setScrollSpeed,
    library, uploadSong, uploadError,
  };
}
