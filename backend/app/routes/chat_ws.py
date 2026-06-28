from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.auth.services import authenticate_websocket
from app.chat.connection_manager import manager
from app.chat import conversation_service as cs
from app.chat import message_service as ms
from app.chat import bot_service
from app.chat.schemas import WSMessageIn, WSTypingIn, WSReadIn

router = APIRouter(tags=["chat-ws"])


async def _broadcast_presence(user_id: int, online: bool):
    event = {"type": "presence", "user_id": user_id, "status": "online" if online else "offline"}
    for uid in manager.online_users():
        if uid != user_id:
            await manager.send_to_user(uid, event)


async def _fan_out(conversation_id: int, db: AsyncSession, event: dict, exclude: int | None = None):
    for uid in await cs.get_member_ids(db, conversation_id):
        if uid != exclude and manager.is_online(uid):
            await manager.send_to_user(uid, event)


async def _handle_event(data: dict, user_id: int, db: AsyncSession):
    event_type = data.get("type")

    if event_type == "message":
        evt = WSMessageIn(**data)
        await cs.assert_member(db, user_id, evt.conversation_id)
        msg = await ms.save_message(db, evt.conversation_id, user_id, evt.content)
        out = {
            "type": "message",
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "content": msg.content,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        }
        await _fan_out(evt.conversation_id, db, out)  # no exclude -> sender gets the echo
        member_ids = await cs.get_member_ids(db, evt.conversation_id)
        bot_id = await bot_service.find_bot_member(db, member_ids)
        if bot_id is not None and bot_id != user_id:
            reply = await bot_service.generate_and_save_reply(
                db, evt.conversation_id, bot_id, user_id, evt.content
            )
            bot_out = {
                "type": "message",
                "id": reply.id,
                "conversation_id": reply.conversation_id,
                "sender_id": reply.sender_id,
                "content": reply.content,
                "created_at": reply.created_at.isoformat() if reply.created_at else None,
            }
            await _fan_out(evt.conversation_id, db, bot_out)

    elif event_type == "typing":
        evt = WSTypingIn(**data)
        await cs.assert_member(db, user_id, evt.conversation_id)
        out = {
            "type": "typing",
            "conversation_id": evt.conversation_id,
            "user_id": user_id,
            "is_typing": evt.is_typing,
        }
        await _fan_out(evt.conversation_id, db, out, exclude=user_id)

    elif event_type == "read":
        evt = WSReadIn(**data)
        await cs.assert_member(db, user_id, evt.conversation_id)
        await ms.mark_read(db, user_id, evt.conversation_id)
        out = {"type": "read", "conversation_id": evt.conversation_id, "user_id": user_id}
        await _fan_out(evt.conversation_id, db, out, exclude=user_id)

    else:
        raise ValueError(f"unknown event type: {event_type!r}")


@router.websocket("/ws/{token}")
async def chat_ws(websocket: WebSocket, token: str):
    await websocket.accept()
    # Short-lived session for auth only, released before the receive loop so the
    # socket never holds a DB connection (or its transaction snapshot) while idle.
    async with AsyncSessionLocal() as db:
        user = await authenticate_websocket(token, db)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    manager.connect(user.id, websocket)
    await _broadcast_presence(user.id, online=True)
    try:
        while True:
            data = await websocket.receive_json()
            # Fresh session per event. One session for the whole connection would
            # pin a single MySQL REPEATABLE READ snapshot taken at connect time,
            # hiding conversations created later (the "not a member" bug).
            try:
                async with AsyncSessionLocal() as db:
                    await _handle_event(data, user.id, db)
            except cs.NotAMember:
                await websocket.send_json(
                    {"type": "error", "detail": "not a member of this conversation"}
                )
            except Exception as e:
                await websocket.send_json(
                    {"type": "error", "detail": f"could not process event: {e}"}
                )
    except WebSocketDisconnect:
        manager.disconnect(user.id)
        await _broadcast_presence(user.id, online=False)

