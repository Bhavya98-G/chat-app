from fastapi import WebSocket

class ConnectionManager():
    def __init__(self):
        self.active_connections : dict[int, WebSocket] = {}

    def connect(self, user_id, websocket):
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id):
        self.active_connections.pop(user_id, None)

    def is_online(self, user_id):
        if user_id in self.active_connections:
            return True
        return False
    
    def online_users(self):
        return list(self.active_connections.keys())
    
    async def send_to_user(self, user_id, message):
        websocket = self.active_connections.get(user_id)
        if websocket is None:
            return False
        try:
            await websocket.send_json(message)
            return True
        except Exception:
            self.disconnect(user_id)
            return False
    
manager = ConnectionManager()