"""Audio quality scoring + real-time recommendations (pure, testable).

Inputs are the metrics the client already measures from Web Audio + WebRTC
stats: peak/RMS/noise-floor in dBFS, clipping %, packet loss %, RTT, and a
couple of booleans. Output is a 0-100 score, a coarse level, and human
recommendations like the brief asks for ("Microphone clipping detected.").
"""
from __future__ import annotations
from dataclasses import dataclass, field


@dataclass
class AudioMetrics:
    peak_dbfs: float = -12.0        # 0 = full scale
    rms_dbfs: float = -20.0
    noise_floor_dbfs: float = -60.0
    clipping_pct: float = 0.0       # % of frames at/over 0 dBFS
    loss_pct: float = 0.0           # network packet loss
    rtt_ms: float = 40.0
    noise_suppression_on: bool = False
    using_headphones: bool = True
    instrument: str = "piano"
    is_music_profile: bool = True


@dataclass
class AudioAssessment:
    score: int
    level: str                      # excellent | good | fair | poor
    recommendations: list[str] = field(default_factory=list)


def assess(m: AudioMetrics) -> AudioAssessment:
    score = 100
    recs: list[str] = []

    # clipping / distortion — the worst offender for music
    if m.clipping_pct > 1.0 or m.peak_dbfs > -0.5:
        score -= 35
        recs.append("Microphone clipping detected — lower input gain.")
    elif m.peak_dbfs > -3.0:
        score -= 10
        recs.append("Levels are hot — leave 3-6 dB of headroom for transients.")

    # signal-to-noise
    snr = m.rms_dbfs - m.noise_floor_dbfs
    if m.noise_floor_dbfs > -45:
        score -= 20
        recs.append("High background noise — move away from fans/AC or use a closer mic.")
    if snr < 12:
        score -= 10
        recs.append("Weak signal over noise — move closer to the mic or raise gain slightly.")

    # silence / dead mic
    if m.rms_dbfs < -55 and m.peak_dbfs < -45:
        score -= 25
        recs.append("Almost no signal — check the mic is selected and unmuted.")

    # music-specific DSP guidance
    if m.is_music_profile and m.noise_suppression_on:
        score -= 15
        recs.append(f"Switch off Noise Suppression for {m.instrument} — it removes musical detail.")

    # monitoring
    if m.is_music_profile and not m.using_headphones:
        score -= 10
        recs.append("Headphones recommended — open mic + speakers cause echo and bleed.")

    # network
    if m.loss_pct > 3 or m.rtt_ms > 250:
        score -= 20
        recs.append("Unstable network — audio priority is on; video will drop first.")
    elif m.loss_pct > 1 or m.rtt_ms > 150:
        score -= 8
        recs.append("Some network jitter — consider switching to a wired connection.")

    score = max(0, min(100, score))
    level = ("excellent" if score >= 85 else "good" if score >= 70
             else "fair" if score >= 50 else "poor")
    if not recs:
        recs.append("Audio is clean and in tune. You're good to play.")
    return AudioAssessment(score=score, level=level, recommendations=recs)
