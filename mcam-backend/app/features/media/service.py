"""Media use-cases: mint a short-lived, role-scoped LiveKit token and
attach the publish policy the client must apply for the chosen audio mode.

The publish_policy is the contract that stops M-CAM being a Zoom clone:
in music_hifi it forces DSP off, stereo, DTX off, high bitrate.
"""
from datetime import timedelta

from livekit import api

from app.core.config import get_settings
from app.core.errors import Forbidden
from app.core.events import DomainEvent, EventBus
from app.features.media.schemas import (
    AudioMode, JoinRequest, JoinResponse, ParticipantRole,
)

# Publishing is only granted to teacher/student. Parent/observer are read-only.
_CAN_PUBLISH = {ParticipantRole.teacher, ParticipantRole.student}


def _publish_policy(mode: AudioMode) -> dict:
    if mode is AudioMode.music_hifi:
        return {
            "getUserMedia": {
                "echoCancellation": False,
                "noiseSuppression": False,
                "autoGainControl": False,
                "channelCount": 2,
                "sampleRate": 48000,
            },
            "opus": {"dtx": False, "red": True, "stereo": True,
                     "maxBitrate": 256_000, "application": "audio"},
            "note": "Instrument track ships raw; a separate talk track keeps AEC/NS on.",
        }
    if mode is AudioMode.balanced:
        return {
            "getUserMedia": {"echoCancellation": True, "noiseSuppression": False,
                             "autoGainControl": False, "channelCount": 2,
                             "sampleRate": 48000},
            "opus": {"dtx": False, "red": True, "stereo": True, "maxBitrate": 128_000},
        }
    return {  # talk
        "getUserMedia": {"echoCancellation": True, "noiseSuppression": True,
                         "autoGainControl": True, "channelCount": 1,
                         "sampleRate": 48000},
        "opus": {"dtx": True, "red": False, "stereo": False, "maxBitrate": 40_000},
    }


class MediaService:
    def __init__(self, event_bus: EventBus) -> None:
        self._bus = event_bus

    async def join(self, req: JoinRequest, user: dict) -> JoinResponse:
        s = get_settings()
        can_publish = req.role in _CAN_PUBLISH

        grant = api.VideoGrants(
            room=req.session_id,
            room_join=True,
            can_publish=can_publish,
            can_subscribe=True,
            can_publish_data=can_publish,
        )
        # PRODUCTION FIX (integration audit): requirements.txt pinned only
        # `livekit-api>=0.7`; the current release (1.2.0) renamed the token
        # builder's `with_ttl_seconds(int)` to `with_ttl(timedelta)`, so every
        # media/join call raised AttributeError and 500'd. Updated to the
        # current builder API; behavior (TTL value) is unchanged.
        token = (
            api.AccessToken(s.livekit_api_key, s.livekit_api_secret)
            .with_identity(user["user_id"])
            .with_name(user.get("user_id"))
            .with_ttl(timedelta(seconds=s.media_token_ttl_seconds))
            .with_grants(grant)
            .to_jwt()
        )

        await self._bus.publish(DomainEvent(
            topic="session.participant.joined",
            org_id=user.get("org_id"),
            payload={"session_id": req.session_id, "user_id": user["user_id"],
                     "role": req.role.value, "audio_mode": req.audio_mode.value},
        ))

        return JoinResponse(
            livekit_url=s.livekit_url,
            token=token,
            role=req.role,
            audio_mode=req.audio_mode,
            publish_policy=_publish_policy(req.audio_mode),
        )
