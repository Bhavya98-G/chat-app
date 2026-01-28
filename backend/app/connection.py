from fastapi import APIRouter, WebSocket, Depends
from authentication.utils import get_user_from_token
from app.connection_manager import manager
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.sql_tables import User
from fastapi import status
from fastapi import WebSocketDisconnect
from core.database import get_db
from models.sql_tables import Message

router = APIRouter(tags=["connections"], prefix="")

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: AsyncSession = Depends(get_db)):
    username = get_user_from_token(token)
    if not username:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return 
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    await manager.connect(user.id, websocket)
    await manager.broadcast({"type": "presence", "user_id": user.id, "status": "online"})
    try: 
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "typing":
                await manager.send_typing_status(data["is_typing"], user.id, data["receiver_id"])
            else:
                new_msg = Message(sender_id=user.id, receiver_id=data["receiver_id"], content=data["message"])
                db.add(new_msg)
                await db.commit()

                await manager.send_personal_message(
                    {
                        "sender": username,
                        "sender_id": user.id,
                        "receiver_id": data["receiver_id"],
                        "message": data['message']
                    },
                    data["receiver_id"]
                )
    except WebSocketDisconnect:
        manager.disconnect(user.id)
        await manager.broadcast({"type": "presence", "user_id": user.id, "status": "offline"})



