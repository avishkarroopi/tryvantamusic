from app.features.audio import profiles
from app.features.audio.diagnostics import AudioMetrics, assess


def test_every_music_profile_disables_speech_dsp():
    for name in profiles.list_instruments():
        p = profiles.get_profile(name)
        if p["base_mode"] == "music_hifi":
            g = p["getUserMedia"]
            assert g["noiseSuppression"] is False
            assert g["autoGainControl"] is False
            assert p["opus"]["maxBitrate"] >= 256_000


def test_clipping_dominates_score_and_is_reported():
    a = assess(AudioMetrics(peak_dbfs=0.0, clipping_pct=5.0))
    assert a.score < 70
    assert any("clipping" in r.lower() for r in a.recommendations)


def test_noise_suppression_flagged_for_music():
    a = assess(AudioMetrics(noise_suppression_on=True, instrument="violin", is_music_profile=True))
    assert any("noise suppression" in r.lower() for r in a.recommendations)


def test_headphones_recommended_when_absent():
    a = assess(AudioMetrics(using_headphones=False, is_music_profile=True))
    assert any("headphone" in r.lower() for r in a.recommendations)


def test_clean_audio_scores_high():
    a = assess(AudioMetrics(peak_dbfs=-6, rms_dbfs=-18, noise_floor_dbfs=-62,
                            using_headphones=True))
    assert a.score >= 85 and a.level == "excellent"
