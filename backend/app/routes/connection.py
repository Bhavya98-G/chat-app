from fastapi import APIRouter, WebSocket, Depends
from app.auth.services import authenticate_websocket
from app.routes.connection_manager import manager
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status
from fastapi import WebSocketDisconnect
from app.core.database import get_db
from app.models.sql_tables import Message
from app.bot.bot_agent import bot_agent
from langchain_core.messages import HumanMessage

BOT_USER_ID = 1

router = APIRouter(tags=["connections"], prefix="")

@router.websocket("/ws/{token}")
async def websocket_endpoint(websocket: WebSocket, token: str, db: AsyncSession = Depends(get_db)):
    await websocket.accept()
    user = await authenticate_websocket(token, db)
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    username = f"{user.first_name} {user.last_name or ''}".strip()
    await manager.connect(user.id, websocket)
    await manager.broadcast({"type": "presence", "user_id": user.id, "status": "online"})
    try: 
        while True:
            data = await websocket.receive_json()
            if data['receiver_id'] == BOT_USER_ID:
                inputs = {
                    "messages": [HumanMessage(content=data['content'])],
                    "user_id": user.id
                }
                final_state = await bot_agent.ainvoke(inputs)
                bot_response = final_state["messages"][-1].content
                await manager.send_personal_message({
                    "sender_id": BOT_USER_ID,
                    "content": bot_response,
                    "type": "message"
                }, user.id)
            elif data.get("type") == "typing":
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



