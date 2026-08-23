/** Single source of truth for every M-series tool, shared by the M-CAM
 *  floating toolbar (inside Live Classroom) and each dashboard's standalone
 *  Music Tools page. One registry, two entry points — never two copies of a
 *  tool's logic. */
import type { JSX } from "react";
import { Timer, Music2, Guitar, ListMusic, Activity, Clock, Ear, Zap, Piano, ChevronsDown, BookOpenText, FileAudio, SlidersHorizontal } from "lucide-react";
import { Metronome } from "./components/Metronome";
import { Tuner } from "./components/Tuner";
import { ChordFinder } from "./components/ChordFinder";
import { ScaleFinder } from "./components/ScaleFinder";
import { RhythmTrainer } from "./components/RhythmTrainer";
import { PracticeTimer } from "./components/PracticeTimer";
import { EarTrainer } from "./components/EarTrainer";
import { BeatTrainer } from "./components/BeatTrainer";
import { VirtualGuitar } from "./components/VirtualGuitar";
import { VirtualKeyboard } from "./components/VirtualKeyboard";
import { NoteFall } from "./components/NoteFall";
import { StaffReader } from "./components/StaffReader";
import { MTrainer } from "./components/MTrainer";
import { StudioMixer } from "./components/StudioMixer";

export type ToolSize = "compact" | "large";

export interface ToolDef {
  id: string;
  name: string;
  tagline: string;
  icon: JSX.Element;
  size: ToolSize;
  /** analyser: the live classroom mic analyser when launched inside M-CAM;
   *  null when launched standalone (the tool opens its own mic if it needs one). */
  render: (analyser: AnalyserNode | null) => JSX.Element;
}

export const TOOL_REGISTRY: ToolDef[] = [
  { id: "metronome", name: "Metronome", tagline: "Tap tempo, time signature, accent pattern.", icon: <Timer size={20} />, size: "compact", render: () => <Metronome /> },
  { id: "tuner", name: "Tuner", tagline: "Live pitch detection for guitar, bass, violin, ukulele.", icon: <Activity size={20} />, size: "compact", render: (a) => <Tuner analyser={a} /> },
  { id: "ears", name: "M-EARS", tagline: "Pitch matching, interval ID and chord-quality ear training.", icon: <Ear size={20} />, size: "compact", render: (a) => <EarTrainer analyser={a} /> },
  { id: "beat", name: "M-BEAT", tagline: "Tap-timing accuracy trainer with live scoring.", icon: <Zap size={20} />, size: "compact", render: () => <BeatTrainer /> },
  { id: "chords", name: "Chord Finder", tagline: "Shapes and voicings for any root + quality.", icon: <Guitar size={20} />, size: "compact", render: () => <ChordFinder /> },
  { id: "scales", name: "Scale Finder", tagline: "Major, minor, modes, pentatonic, jazz scales.", icon: <ListMusic size={20} />, size: "compact", render: () => <ScaleFinder /> },
  { id: "rhythm", name: "Rhythm Trainer", tagline: "Groove library with gradual tempo progression.", icon: <Music2 size={20} />, size: "compact", render: () => <RhythmTrainer /> },
  { id: "guitar", name: "M-GTR Virtual Guitar", tagline: "Full fretboard with real plucked-string tone, chords & scales.", icon: <Guitar size={20} />, size: "large", render: () => <VirtualGuitar /> },
  { id: "keyboard", name: "Virtual M-Key", tagline: "Playable keyboard with chord/scale overlays and an auto-arranger.", icon: <Piano size={20} />, size: "large", render: () => <VirtualKeyboard /> },
  { id: "fall", name: "M-FALL", tagline: "Synthesia-style falling-notes trainer — upload any .mid file or pick from the library.", icon: <ChevronsDown size={20} />, size: "large", render: () => <NoteFall /> },
  { id: "staff", name: "M-STAFF", tagline: "Sight-reading trainer — identify real staff notation across 7 levels.", icon: <BookOpenText size={20} />, size: "large", render: () => <StaffReader /> },
  { id: "trainer", name: "M-TRAINER", tagline: "Upload a song for real BPM + key detection, then practice in that key.", icon: <FileAudio size={20} />, size: "compact", render: () => <MTrainer /> },
  { id: "studio", name: "M-Studio Master", tagline: "Real multi-track mixer with a mastering limiter and live loudness meter.", icon: <SlidersHorizontal size={20} />, size: "large", render: () => <StudioMixer /> },
  { id: "timer", name: "Practice Timer", tagline: "Structured practice-session countdown.", icon: <Clock size={20} />, size: "compact", render: () => <PracticeTimer /> },
];

export function getTool(id: string): ToolDef | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}
