import uuid

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: dict[uuid.UUID, list[WebSocket]] = {}

    async def connect(self, user_id: uuid.UUID, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: uuid.UUID, ws: WebSocket) -> None:
        conns = self._connections.get(user_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns and user_id in self._connections:
            del self._connections[user_id]

    async def send_to_user(self, user_id: uuid.UUID, payload: dict) -> None:
        for ws in list(self._connections.get(user_id, [])):
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(user_id, ws)

    def is_online(self, user_id: uuid.UUID) -> bool:
        return bool(self._connections.get(user_id))


manager = ConnectionManager()
