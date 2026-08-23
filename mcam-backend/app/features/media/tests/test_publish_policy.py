"""Audio-fidelity regression: assert music mode actually ships raw audio.
If any of these flip True, we've silently become a Zoom clone."""
from app.features.media.service import _publish_policy
from app.features.media.schemas import AudioMode


def test_music_hifi_disables_speech_dsp():
    gum = _publish_policy(AudioMode.music_hifi)["getUserMedia"]
    assert gum["echoCancellation"] is False
    assert gum["noiseSuppression"] is False
    assert gum["autoGainControl"] is False
    assert gum["channelCount"] == 2


def test_music_hifi_opus_never_cuts_sustained_notes():
    opus = _publish_policy(AudioMode.music_hifi)["opus"]
    assert opus["dtx"] is False          # a held pp note is not silence
    assert opus["stereo"] is True
    assert opus["maxBitrate"] >= 128_000


def test_talk_mode_is_speech_optimised():
    gum = _publish_policy(AudioMode.talk)["getUserMedia"]
    assert gum["noiseSuppression"] is True
