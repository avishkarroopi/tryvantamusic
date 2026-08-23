/** Minimal Standard MIDI File (SMF) parser — reads format 0/1 files, merges
 *  all tracks, resolves tempo-map timing, and emits flat note events
 *  { pitch, startTime, duration } in seconds. Good enough for "drop a .mid
 *  file, play it back" — not a full sequencer (ignores CC/pitch-bend/etc). */
export interface ParsedNote { p: number; t: number; d: number }
export interface ParsedMidi { notes: ParsedNote[]; bpm: number; title: string }

class ByteReader {
  pos = 0;
  constructor(private view: DataView) {}
  u8() { return this.view.getUint8(this.pos++); }
  u16() { const v = this.view.getUint16(this.pos); this.pos += 2; return v; }
  u32() { const v = this.view.getUint32(this.pos); this.pos += 4; return v; }
  bytes(n: number) { const b = new Uint8Array(this.view.buffer, this.view.byteOffset + this.pos, n); this.pos += n; return b; }
  str(n: number) { return String.fromCharCode(...this.bytes(n)); }
  varLen() {
    let value = 0, b: number;
    do { b = this.u8(); value = (value << 7) | (b & 0x7f); } while (b & 0x80);
    return value;
  }
  get eof() { return this.pos >= this.view.byteLength; }
}

export function parseMidiFile(buffer: ArrayBuffer, fileName: string): ParsedMidi {
  const r = new ByteReader(new DataView(buffer));
  if (r.str(4) !== "MThd") throw new Error("Not a MIDI file (missing MThd header)");
  r.u32(); // header length, always 6
  r.u16(); // format (0 or 1)
  const trackCount = r.u16();
  const division = r.u16();
  if (division & 0x8000) throw new Error("SMPTE-based timing not supported");
  const ticksPerBeat = division;

  let usecPerBeat = 500000; // 120 BPM default
  const tempoChanges: { tick: number; usecPerBeat: number }[] = [{ tick: 0, usecPerBeat }];

  type RawEvent = { tick: number; type: "on" | "off"; pitch: number; velocity: number };
  const rawEvents: RawEvent[] = [];

  for (let t = 0; t < trackCount && !r.eof; t++) {
    if (r.str(4) !== "MTrk") throw new Error("Malformed track chunk");
    const length = r.u32();
    const trackEnd = r.pos + length;
    let tick = 0;
    let runningStatus = 0;

    while (r.pos < trackEnd) {
      tick += r.varLen();
      let status = r.u8();
      if (status < 0x80) { r.pos--; status = runningStatus; } // running status reuse
      else runningStatus = status;

      const type = status & 0xf0;
      if (status === 0xff) { // meta event
        const metaType = r.u8();
        const len = r.varLen();
        if (metaType === 0x51 && len === 3) { // Set Tempo
          const b = r.bytes(3);
          usecPerBeat = (b[0] << 16) | (b[1] << 8) | b[2];
          tempoChanges.push({ tick, usecPerBeat });
        } else {
          r.pos += len;
        }
      } else if (status === 0xf0 || status === 0xf7) { // sysex
        r.pos += r.varLen();
      } else if (type === 0x90 || type === 0x80) { // note on/off
        const pitch = r.u8();
        const velocity = r.u8();
        if (type === 0x90 && velocity > 0) rawEvents.push({ tick, type: "on", pitch, velocity });
        else rawEvents.push({ tick, type: "off", pitch, velocity: 0 });
      } else if (type === 0xa0 || type === 0xb0 || type === 0xe0) {
        r.u8(); r.u8();
      } else if (type === 0xc0 || type === 0xd0) {
        r.u8();
      } else {
        break; // unknown status, bail this track
      }
    }
    r.pos = trackEnd;
  }

  // tick -> seconds, honoring tempo changes
  tempoChanges.sort((a, b) => a.tick - b.tick);
  const tickToSeconds = (tick: number): number => {
    let seconds = 0, lastTick = 0, currentUsec = tempoChanges[0].usecPerBeat;
    for (const change of tempoChanges) {
      if (change.tick > tick) break;
      seconds += ((change.tick - lastTick) / ticksPerBeat) * (currentUsec / 1_000_000);
      lastTick = change.tick;
      currentUsec = change.usecPerBeat;
    }
    seconds += ((tick - lastTick) / ticksPerBeat) * (currentUsec / 1_000_000);
    return seconds;
  };

  rawEvents.sort((a, b) => a.tick - b.tick);
  const openNotes = new Map<number, number>(); // pitch -> start tick (first-open wins, simple model)
  const notes: ParsedNote[] = [];
  for (const ev of rawEvents) {
    if (ev.type === "on") {
      if (!openNotes.has(ev.pitch)) openNotes.set(ev.pitch, ev.tick);
    } else if (openNotes.has(ev.pitch)) {
      const startTick = openNotes.get(ev.pitch)!;
      openNotes.delete(ev.pitch);
      const t = tickToSeconds(startTick);
      const d = Math.max(0.05, tickToSeconds(ev.tick) - t);
      notes.push({ p: ev.pitch, t: +t.toFixed(3), d: +d.toFixed(3) });
    }
  }
  notes.sort((a, b) => a.t - b.t);

  const bpm = Math.round(60_000_000 / tempoChanges[0].usecPerBeat);
  return { notes, bpm, title: fileName.replace(/\.(mid|midi)$/i, "") };
}
