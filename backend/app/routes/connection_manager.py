from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            await self.active_connections[user_id].send_json(message)

    async def send_typing_status(self, is_typing: bool, sender_id: int, receiver_id: int):
        if receiver_id in self.active_connections:
            await self.active_connections[receiver_id].send_json({
                'type': 'typing',
                'sender_id': sender_id,
                'is_typing': is_typing
            })
    def get_online_users(self):
        return list(self.active_connections.keys())

    async def broadcast(self, message: dict):
        disconnected_users = []
        for user_id, connection in self.active_connections.items():
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to user {user_id}: {e}")
                disconnected_users.append(user_id)
        
        for user_id in disconnected_users:
            self.disconnect(user_id)
        
    

manager = ConnectionManager()