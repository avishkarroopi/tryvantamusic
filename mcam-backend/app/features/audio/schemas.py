from pydantic import BaseModel


class InstrumentProfileOut(BaseModel):
    instrument: str
    base_mode: str
    getUserMedia: dict
    opus: dict
    highpass_hz: int
    eq_hint: str
    guidance: str
    headphones_required: bool


class MetricsIn(BaseModel):
    peak_dbfs: float = -12.0
    rms_dbfs: float = -20.0
    noise_floor_dbfs: float = -60.0
    clipping_pct: float = 0.0
    loss_pct: float = 0.0
    rtt_ms: float = 40.0
    noise_suppression_on: bool = False
    using_headphones: bool = True
    instrument: str = "piano"
    is_music_profile: bool = True


class AssessmentOut(BaseModel):
    score: int
    level: str
    recommendations: list[str]
