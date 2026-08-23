"""Per-instrument audio profiles — the domain knowledge that makes M-CAM a
music tool, not a meeting tool.

Speech DSP (noise suppression, AGC, aggressive high-pass) destroys the very
things that matter in music: a violin's air and bow noise, a piano's dynamic
range, a drum's transients, a flute's breath. Each profile says exactly which
DSP to disable, what Opus settings to publish, and an EQ/monitoring hint.

Pure data + functions (no pydantic) so it's trivially testable and reusable by
both the API and the client policy.
"""
from __future__ import annotations

# base audio mode maps onto Phase 1's AudioMode ("music_hifi" | "balanced" | "talk")
_MUSIC = "music_hifi"
_TALK = "talk"

# Every music profile disables NS/AGC/EC and ships stereo hi-bitrate Opus.
_HIFI_DSP = {"echoCancellation": False, "noiseSuppression": False,
             "autoGainControl": False, "channelCount": 2, "sampleRate": 48000}
_HIFI_OPUS = {"dtx": False, "red": True, "stereo": True, "maxBitrate": 256_000,
              "application": "audio"}


def _music(hpf_hz: int, eq_hint: str, guidance: str, *, mono: bool = False) -> dict:
    dsp = dict(_HIFI_DSP)
    if mono:
        dsp["channelCount"] = 1
    return {
        "base_mode": _MUSIC,
        "getUserMedia": dsp,
        "opus": dict(_HIFI_OPUS, stereo=not mono),
        "highpass_hz": hpf_hz,      # gentle rumble filter only; never speech-style HPF
        "eq_hint": eq_hint,
        "guidance": guidance,
        "headphones_required": True,  # open DSP means echo if using speakers
    }


PROFILES: dict[str, dict] = {
    "piano": _music(
        30, "flat; preserve <60Hz and >12kHz",
        "Grand dynamic range — keep AGC OFF or soft passages get pumped. Headphones a must."),
    "guitar": _music(
        60, "slight 2-4kHz presence; keep body 80-120Hz",
        "Acoustic body lives at 80-120Hz; don't high-pass it away. NS off keeps pick detail."),
    "violin": _music(
        70, "air up to 12-15kHz; do not roll off highs",
        "Bow noise and air are musical, not defects — noise suppression ruins tone."),
    "drums": _music(
        25, "protect transients; limiter not compressor",
        "Huge transients — AGC pumps and NS gates the tail. Both OFF; watch the clip meter."),
    "vocals": _music(
        80, "gentle 3-5kHz presence; de-ess lightly if needed",
        "Singing voice — NS off preserves breath and vibrato. Headphones stop bleed."),
    "flute": _music(
        90, "keep breath 6-10kHz",
        "Breath texture is part of the tone; suppression makes it sound synthetic."),
    "cello": _music(
        25, "protect low body <70Hz",
        "Deep body needs the low end intact — minimal high-pass only."),
    "theory": {  # no live instrument — normal speech is fine and saves bandwidth
        "base_mode": _TALK,
        "getUserMedia": {"echoCancellation": True, "noiseSuppression": True,
                         "autoGainControl": True, "channelCount": 1, "sampleRate": 48000},
        "opus": {"dtx": True, "red": False, "stereo": False, "maxBitrate": 40_000},
        "highpass_hz": 100, "eq_hint": "speech clarity",
        "guidance": "Discussion mode — speech DSP is fine here.",
        "headphones_required": False,
    },
}

DEFAULT = "piano"


def list_instruments() -> list[str]:
    return list(PROFILES.keys())


def get_profile(instrument: str) -> dict:
    return dict(PROFILES.get(instrument.lower(), PROFILES[DEFAULT]), instrument=instrument.lower())
