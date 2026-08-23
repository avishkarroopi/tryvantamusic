"""Wire protocol for the classroom real-time channel.

One envelope, many types. Chat, typing, hand, reactions, polls, media-state,
control and notifications all travel over the same WS so the client opens one
connection per lesson. Server->client and client->server share the envelope.
"""
from __future__ import annotations
from enum import Enum
from typing import Any
from pydantic import BaseModel


class MsgType(str, Enum):
    # client -> server
    CHAT_SEND = "chat.send"
    CHAT_TYPING = "chat.typing"
    CHAT_PIN = "chat.pin"
    ANNOUNCE = "announce"
    HAND_RAISE = "hand.raise"
    HAND_LOWER = "hand.lower"
    REACTION = "reaction"
    MEDIA_STATE = "media.state"        # mic/cam/screen on-off, presenter indicator
    POLL_CREATE = "poll.create"
    POLL_VOTE = "poll.vote"
    BOARD_OP = "board.op"            # whiteboard operation (draw/shape/text/erase/...)
    BOARD_LOCK = "board.lock"        # teacher locks/unlocks the board
    BOARD_CLEAR = "board.clear"
    # server -> client
    ROSTER = "roster"
    CHAT_MESSAGE = "chat.message"
    CHAT_PINNED = "chat.pinned"
    ANNOUNCEMENT = "announcement"
    HAND_QUEUE = "hand.queue"
    POLL_STATE = "poll.state"
    POLL_RESULTS = "poll.results"
    BOARD_STATE = "board.state"      # snapshot on join
    NOTIFICATION = "notification"
    ERROR = "error"


class Envelope(BaseModel):
    type: MsgType
    data: dict[str, Any] = {}


def make(type_: MsgType, **data: Any) -> dict:
    return Envelope(type=type_, data=data).model_dump(mode="json")
