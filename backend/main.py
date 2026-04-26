from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from typing import List, Optional, Any
from pydantic import BaseModel
from google.cloud.firestore_v1 import FieldFilter

from database import initialize_firebase, get_db
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
    temples_ref = db.collection("temples")
    docs = temples_ref.stream()
    results = []
    for doc in docs:
        temple = doc.to_dict()
        temple["id"] = doc.id
        
        # Parse JSON strings back to objects
        if isinstance(temple.get("zones_config"), str):
            temple["zones_config"] = json.loads(temple["zones_config"])
        if isinstance(temple.get("exit_routes_config"), str):
            temple["exit_routes_config"] = json.loads(temple["exit_routes_config"])
            
        results.append(temple)
    return results


@app.post("/temples")
def create_temple(temple: TempleCreate):
    db = get_db()
    db.collection("temples").document(temple.id).set(temple_to_dict(temple))
    return {"status": "ok"}


@app.get("/temples/{temple_id}/crowd")
def get_crowd_data(temple_id: str):
    db = get_db()
    crowd_ref = db.collection("crowd_data")
    query = (
        crowd_ref
        .where(filter=FieldFilter("temple_id", "==", temple_id))
        .order_by("timestamp", direction="DESCENDING")
        .limit(1)
    )
    docs = list(query.stream())
    if not docs:
        raise HTTPException(status_code=404, detail="Data not found")
    data = docs[0].to_dict()
    data["id"] = docs[0].id
    return data


@app.post("/crowd-data")
async def update_crowd(data: dict = Body(...)):
    db = get_db()
    # Save to Firestore
    doc_data = crowd_data_to_dict(data)
    db.collection("crowd_data").add(doc_data)

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

    # Check if temples already exist
    existing = list(db.collection("temples").limit(1).stream())
    if existing:
        print("Temples already seeded, skipping.")
        return

    temples = [
        {"id": "T1", "name": "Kashi Vishwanath Temple", "latitude": 25.3109, "longitude": 83.0107, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Sanctum", "lat": 25.3109, "lng": 83.0108, "radius": 60}, {"id": "B", "label": "Gyanvapi Gate", "lat": 25.3112, "lng": 83.0102, "radius": 50}, {"id": "C", "label": "Vishwanath Gali", "lat": 25.3106, "lng": 83.0115, "radius": 70}], "exit_routes_config": [{"id": "exit-main", "label": "Main Exit → Dashashwamedh Ghat", "color": "#22c55e", "points": [[25.3109, 83.0107], [25.3105, 83.0118], [25.3098, 83.0128], [25.3093, 83.0138], [25.3089, 83.0148]]}, {"id": "exit-north", "label": "North Exit → Lahurabir", "color": "#3b82f6", "points": [[25.3109, 83.0107], [25.3115, 83.0102], [25.3122, 83.0096], [25.3130, 83.0088]]}, {"id": "exit-emergency", "label": "Emergency Exit → Maidagin", "color": "#f59e0b", "points": [[25.3109, 83.0107], [25.3116, 83.0115], [25.3125, 83.0120], [25.3135, 83.0125]], "dashed": True}]},
        {"id": "T2", "name": "Sankat Mochan Temple", "latitude": 25.2887, "longitude": 82.9996, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Shrine", "lat": 25.2887, "lng": 82.9996, "radius": 55}, {"id": "B", "label": "Outer Courtyard", "lat": 25.2882, "lng": 83.0002, "radius": 65}], "exit_routes_config": [{"id": "exit-assi", "label": "Main Gate → Assi Ghat Road", "color": "#22c55e", "points": [[25.2887, 82.9996], [25.2880, 83.0005], [25.2873, 83.0015], [25.2865, 83.0025]]}, {"id": "exit-lanka", "label": "Side Exit → Lanka", "color": "#a855f7", "points": [[25.2887, 82.9996], [25.2893, 82.9988], [25.2900, 82.9978]], "dashed": True}]},
        {"id": "T3", "name": "Durga Temple", "latitude": 25.2802, "longitude": 83.0061, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Hall", "lat": 25.2802, "lng": 83.0061, "radius": 50}, {"id": "B", "label": "Durgakund Side", "lat": 25.2798, "lng": 83.0070, "radius": 60}], "exit_routes_config": [{"id": "exit-lanka", "label": "Main Gate → Lanka Road", "color": "#22c55e", "points": [[25.2802, 83.0061], [25.2795, 83.0070], [25.2788, 83.0082]]}, {"id": "exit-durgakund", "label": "Side Exit → Durgakund", "color": "#3b82f6", "points": [[25.2802, 83.0061], [25.2808, 83.0052], [25.2815, 83.0044]], "dashed": True}]},
        {"id": "T4", "name": "Ram Janmabhoomi Mandir", "latitude": 26.7956, "longitude": 82.1943, "state": "Uttar Pradesh", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Temple", "lat": 26.7956, "lng": 82.1943, "radius": 80}, {"id": "B", "label": "Hanuman Garhi", "lat": 26.7960, "lng": 82.1950, "radius": 60}], "exit_routes_config": [{"id": "exit-main", "label": "Main Exit", "color": "#22c55e", "points": [[26.7956, 82.1943], [26.7950, 82.1930]]}]},
        {"id": "T5", "name": "Badrinath Temple", "latitude": 30.7441, "longitude": 79.4930, "state": "Uttarakhand", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Shrine", "lat": 30.7441, "lng": 79.4930, "radius": 50}, {"id": "B", "label": "Tapt Kund", "lat": 30.7445, "lng": 79.4935, "radius": 40}], "exit_routes_config": [{"id": "exit-main", "label": "River Exit", "color": "#3b82f6", "points": [[30.7441, 79.4930], [30.7430, 79.4920]]}]},
        {"id": "T6", "name": "Kedarnath Temple", "latitude": 30.7352, "longitude": 79.0669, "state": "Uttarakhand", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Temple", "lat": 30.7352, "lng": 79.0669, "radius": 50}], "exit_routes_config": [{"id": "exit-main", "label": "Valley Exit", "color": "#22c55e", "points": [[30.7352, 79.0669], [30.7340, 79.0660]]}]},
        {"id": "T7", "name": "Meenakshi Temple", "latitude": 9.9195, "longitude": 78.1193, "state": "Tamil Nadu", "imageLink": "", "zones_config": [{"id": "A", "label": "Gopuram", "lat": 9.9195, "lng": 78.1193, "radius": 60}, {"id": "B", "label": "Golden Lotus Tank", "lat": 9.9190, "lng": 78.1185, "radius": 50}], "exit_routes_config": [{"id": "exit-main", "label": "East Gate", "color": "#22c55e", "points": [[9.9195, 78.1193], [9.9195, 78.1205]]}]},
        {"id": "T8", "name": "Brihadeeswara Temple", "latitude": 10.7828, "longitude": 79.1318, "state": "Tamil Nadu", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Vimana", "lat": 10.7828, "lng": 79.1318, "radius": 70}, {"id": "B", "label": "Nandi Pavilion", "lat": 10.7830, "lng": 79.1325, "radius": 40}], "exit_routes_config": [{"id": "exit-main", "label": "Fort Exit", "color": "#3b82f6", "points": [[10.7828, 79.1318], [10.7820, 79.1330]]}]},
        {"id": "T9", "name": "Siddhivinayak Temple", "latitude": 19.0169, "longitude": 72.8302, "state": "Maharashtra", "imageLink": "", "zones_config": [{"id": "A", "label": "Main Hall", "lat": 19.0169, "lng": 72.8302, "radius": 40}], "exit_routes_config": [{"id": "exit-main", "label": "Dadar Exit", "color": "#22c55e", "points": [[19.0169, 72.8302], [19.0175, 72.8310]]}]},
        {"id": "T10", "name": "Trimbakeshwar Temple", "latitude": 19.9324, "longitude": 73.5304, "state": "Maharashtra", "imageLink": "", "zones_config": [{"id": "A", "label": "Jyotirlinga", "lat": 19.9324, "lng": 73.5304, "radius": 45}], "exit_routes_config": [{"id": "exit-main", "label": "Kushavarta", "color": "#f59e0b", "points": [[19.9324, 73.5304], [19.9330, 73.5315]]}]},
    ]

    for t in temples:
        doc_id = t.pop("id")
        t["zones_config"] = json.dumps(t["zones_config"])
        t["exit_routes_config"] = json.dumps(t["exit_routes_config"])
        db.collection("temples").document(doc_id).set(t)

    print("Seeded temples to Firestore successfully.")


# Initialize Firebase on module load
initialize_firebase("serviceAccountKey.json")
