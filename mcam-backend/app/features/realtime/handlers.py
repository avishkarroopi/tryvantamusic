"""Dispatch incoming client messages: authorize -> mutate state -> broadcast.

Every mutation authorizes via the capability matrix and emits a notification
where the product should surface one (hand raised, announcement, etc.).
"""
from __future__ import annotations

from app.core.container import container
from app.core.permissions import Capability, Role, can
from app.features.polls.schemas import CreatePoll
from app.features.realtime.hub import Conn, ConnectionManager
from app.features.realtime.protocol import MsgType, make


async def _notify(hub: ConnectionManager, session_id: str, text: str, kind: str) -> None:
    await hub.broadcast(session_id, make(MsgType.NOTIFICATION, kind=kind, text=text))


async def dispatch(hub: ConnectionManager, session_id: str, conn: Conn, msg: dict) -> None:
    mtype = msg.get("type")
    data = msg.get("data", {}) or {}
    role = conn.role

    if mtype == MsgType.CHAT_SEND and can(role, Capability.CHAT):
        body = (data.get("body") or "").strip()
        if not body:
            return
        stored = container.chat_store.add(session_id, conn.user_id, conn.display_name, body)
        await hub.broadcast(session_id, make(
            MsgType.CHAT_MESSAGE, id=stored.id, user_id=conn.user_id,
            display_name=conn.display_name, body=body,
            created_at=stored.created_at.isoformat()))

    elif mtype == MsgType.CHAT_TYPING:
        await hub.broadcast(session_id, make(
            MsgType.CHAT_TYPING, user_id=conn.user_id, display_name=conn.display_name,
            typing=bool(data.get("typing"))), exclude=conn.user_id)

    elif mtype == MsgType.CHAT_PIN and can(role, Capability.PIN_MESSAGE):
        pinned = container.chat_store.pin(session_id, data.get("message_id", ""), bool(data.get("pinned", True)))
        if pinned:
            await hub.broadcast(session_id, make(
                MsgType.CHAT_PINNED, id=pinned.id, body=pinned.body, pinned=pinned.pinned))

    elif mtype == MsgType.ANNOUNCE and can(role, Capability.ANNOUNCE):
        body = (data.get("body") or "").strip()
        if body:
            container.chat_store.add(session_id, conn.user_id, conn.display_name, body, announcement=True)
            await hub.broadcast(session_id, make(
                MsgType.ANNOUNCEMENT, body=body, from_name=conn.display_name))
            await _notify(hub, session_id, f"Announcement from {conn.display_name}", "announcement")

    elif mtype == MsgType.HAND_RAISE and can(role, Capability.RAISE_HAND):
        ch = hub.channel(session_id)
        if ch and conn.user_id not in ch.hand_queue:
            ch.hand_queue.append(conn.user_id)
            await _broadcast_hand_queue(hub, session_id)
            await hub.send_to_role(session_id, Role.teacher, make(
                MsgType.NOTIFICATION, kind="hand_raised",
                text=f"{conn.display_name} raised their hand", user_id=conn.user_id))

    elif mtype == MsgType.HAND_LOWER:
        ch = hub.channel(session_id)
        target = data.get("user_id", conn.user_id)
        # teachers may lower anyone; students only themselves
        if target != conn.user_id and not can(role, Capability.MUTE_OTHERS):
            return
        if ch and target in ch.hand_queue:
            ch.hand_queue.remove(target)
            await _broadcast_hand_queue(hub, session_id)

    elif mtype == MsgType.REACTION and can(role, Capability.REACT):
        emoji = data.get("emoji", "thumbs_up")
        await hub.broadcast(session_id, make(
            MsgType.REACTION, emoji=emoji, user_id=conn.user_id,
            display_name=conn.display_name))

    elif mtype == MsgType.MEDIA_STATE:
        await hub.broadcast(session_id, make(
            MsgType.MEDIA_STATE, user_id=conn.user_id,
            mic_on=bool(data.get("mic_on", True)), cam_on=bool(data.get("cam_on", True)),
            sharing=bool(data.get("sharing", False))), exclude=conn.user_id)
        if data.get("sharing"):
            await _notify(hub, session_id, f"{conn.display_name} is sharing their screen", "screen_share")

    elif mtype == MsgType.POLL_CREATE and can(role, Capability.CREATE_POLL):
        poll = container.poll_store.create(session_id, CreatePoll(**data))
        await hub.broadcast(session_id, make(MsgType.POLL_STATE, **poll.model_dump()))

    elif mtype == MsgType.POLL_VOTE:
        poll = container.poll_store.vote(
            session_id, data["poll_id"], int(data["option_index"]), conn.user_id)
        await hub.broadcast(session_id, make(MsgType.POLL_RESULTS, **poll.model_dump()))

    elif mtype == MsgType.BOARD_OP:
        # Whiteboard draw/shape/text/erase/undo/clear op. Teacher always; students
        # only when the board is unlocked or individually granted.
        if container.board_store.can_draw(session_id, role.value, conn.user_id):
            op = dict(data, author=conn.user_id)
            applied = container.board_store.apply(session_id, op)
            if applied is not None:
                await hub.broadcast(session_id, make(MsgType.BOARD_OP, **applied), exclude=conn.user_id)

    elif mtype == MsgType.BOARD_LOCK and can(role, Capability.PIN_MESSAGE):
        locked = bool(data.get("locked", True))
        container.board_store.set_lock(session_id, locked)
        if "grant_user" in data:
            container.board_store.grant(session_id, data["grant_user"], bool(data.get("granted", True)))
        await hub.broadcast(session_id, make(MsgType.BOARD_LOCK, locked=locked))

    elif mtype == MsgType.BOARD_CLEAR and can(role, Capability.PIN_MESSAGE):
        container.board_store.clear(session_id)
        await hub.broadcast(session_id, make(MsgType.BOARD_CLEAR))


async def _broadcast_hand_queue(hub: ConnectionManager, session_id: str) -> None:
    ch = hub.channel(session_id)
    if ch:
        await hub.broadcast(session_id, make(MsgType.HAND_QUEUE, queue=list(ch.hand_queue)))
