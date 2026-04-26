from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List, Optional, Any
from pydantic import BaseModel

from database import get_db
from models import TempleCreate, temple_to_dict, crowd_data_to_dict

app = FastAPI(title="CrowdRakshak API")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass

manager = ConnectionManager()


@app.get("/temples")
def get_temples():
    db = get_db()
    results = db.get_temples()
    
    # Ensure configs are parsed if they were stored as strings (backwards compat)
    for temple in results:
        if isinstance(temple.get("zones_config"), str):
            temple["zones_config"] = json.loads(temple["zones_config"])
        if isinstance(temple.get("exit_routes_config"), str):
            temple["exit_routes_config"] = json.loads(temple["exit_routes_config"])
            
    return results


@app.post("/temples")
def create_temple(temple: TempleCreate):
    db = get_db()
    db.add_temple(temple.id, temple_to_dict(temple))
    return {"status": "ok"}


@app.get("/temples/{temple_id}/crowd")
def get_crowd_data(temple_id: str):
    db = get_db()
    data = db.get_latest_crowd(temple_id)
    if not data:
        # Return a default "LOW" status if no data exists yet
        return {
            "temple_id": temple_id,
            "status": "LOW",
            "total_count": 0,
            "zones": [],
            "timestamp": "now"
        }
    return data


@app.post("/crowd-data")
async def update_crowd(data: dict = Body(...)):
    db = get_db()
    # Save to JSON
    doc_data = crowd_data_to_dict(data)
    db.add_crowd_data(doc_data)

    # Broadcast to all WebSocket clients
    await manager.broadcast(json.dumps(data))
    return {"status": "ok"}


@app.websocket("/ws/crowd")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Seed data for MVP
@app.on_event("startup")
def seed_data():
    db = get_db()
    if len(db.get_temples()) > 0:
        return

    temples = [
        {"id": "T1", "name": "Kashi Vishwanath Temple", "latitude": 25.3109, "longitude": 83.0107, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Sanctum", "lat": 25.3109, "lng": 83.0108, "radius": 60}, {"id": "B", "label": "Gyanvapi Gate", "lat": 25.3112, "lng": 83.0102, "radius": 50}], "exit_routes_config": [{"id": "exit-main", "label": "Main Exit", "color": "#22c55e", "points": [[25.3109, 83.0107], [25.3105, 83.0118]]}]},
        {"id": "T2", "name": "Sankat Mochan Temple", "latitude": 25.2887, "longitude": 82.9996, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Shrine", "lat": 25.2887, "lng": 82.9996, "radius": 55}], "exit_routes_config": [{"id": "exit-assi", "label": "Main Gate", "color": "#22c55e", "points": [[25.2887, 82.9996], [25.2880, 83.0005]]}]},
    ]

    for t in temples:
        tid = t["id"]
        db.add_temple(tid, t)

    print("Seeded temples to JSON database successfully.")
