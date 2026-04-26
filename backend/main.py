import json
import asyncio
from typing import List, Optional, Any
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
except Exception as e:
    print("Warning: Could not initialize Firebase. Make sure serviceAccountKey.json is present.", e)
    db = None

app = FastAPI(title="CrowdRakshak API (Firebase Edition)")

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

class TempleCreate(BaseModel):
    id: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    state: str
    imageLink: str
    zones_config: Any
    exit_routes_config: Any

@app.get("/temples")
def get_temples():
    if not db:
        return []
    temples_ref = db.collection("temples")
    docs = temples_ref.stream()
    temples = []
    for doc in docs:
        data = doc.to_dict()
        data["id"] = doc.id
        temples.append(data)
    return temples

@app.post("/temples")
def create_temple(temple: TempleCreate):
    if not db:
        raise HTTPException(status_code=500, detail="Firebase not initialized")
    doc_ref = db.collection("temples").document(temple.id)
    doc_ref.set(temple.dict())
    return {"status": "ok"}

@app.get("/temples/{temple_id}/crowd")
def get_crowd_data(temple_id: str):
    if not db:
        return {}
    # Fetch the latest crowd data for this temple
    data_ref = db.collection("crowd_data").where("temple_id", "==", temple_id).order_by("timestamp", direction=firestore.Query.DESCENDING).limit(1)
    docs = data_ref.stream()
    for doc in docs:
        return doc.to_dict()
    raise HTTPException(status_code=404, detail="Data not found")

@app.post("/crowd-data")
async def update_crowd(data: dict = Body(...)):
    if db:
        new_data = {
            "temple_id": data["temple_id"],
            "count": data["total_count"],
            "status": data["status"],
            "zone_data": data["zones"],
            "timestamp": firestore.SERVER_TIMESTAMP
        }
        db.collection("crowd_data").add(new_data)

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
