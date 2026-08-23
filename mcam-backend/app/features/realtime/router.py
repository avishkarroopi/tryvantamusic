"""WebSocket endpoint for a live classroom: /v1/rt/sessions/{session_id}.

Auth is via ?token= (access JWT) since browsers can't set WS headers. On
connect we register with the hub and push current roster/pinned; on disconnect
we notify the room and (via the classroom service) emit a leave event so
attendance closes the record.
"""
from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from app.core.container import container
from app.core.permissions import Role
from app.core.security import decode
from app.features.realtime.hub import Conn
from app.features.realtime.handlers import dispatch
from app.features.realtime.protocol import MsgType, make

router = APIRouter(tags=["realtime"])


@router.websocket("/v1/rt/sessions/{session_id}")
async def classroom_socket(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
    role: Role = Query(Role.student),
    name: str = Query("Guest"),
):
    try:
        claims = decode(token)
        if claims.get("type") != "access":
            raise ValueError("wrong token type")
        user_id = claims["sub"]
    except Exception:
        await websocket.close(code=4401)  # unauthorized
        return

    hub = container.hub
    conn = Conn(ws=websocket, user_id=user_id, role=role, display_name=name)
    await hub.connect(session_id, conn)

    # welcome: current chat history + pinned + hand queue
    ch = hub.channel(session_id)
    await websocket.send_json(make(
        MsgType.ROSTER,
        online=[c.user_id for c in ch.conns.values()] if ch else [],
        hand_queue=list(ch.hand_queue) if ch else [],
        pinned=[m.model_dump(mode="json") for m in container.chat_store.pinned(session_id)],
    ))
    snap = container.board_store.snapshot(session_id)
    if snap["ops"]:
        await websocket.send_json(make(MsgType.BOARD_STATE, **snap))
    await hub.broadcast(session_id, make(
        MsgType.NOTIFICATION, kind="joined", text=f"{name} joined", user_id=user_id),
        exclude=user_id)

    try:
        while True:
            msg = await websocket.receive_json()
            await dispatch(hub, session_id, conn, msg)
    except WebSocketDisconnect:
        pass
    except Exception:  # noqa: BLE001 — never let one bad frame kill the socket loop uncleanly
        pass
    finally:
        await hub.disconnect(session_id, user_id)
        await hub.broadcast(session_id, make(
            MsgType.NOTIFICATION, kind="left", text=f"{name} left", user_id=user_id))
