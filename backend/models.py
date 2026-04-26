from pydantic import BaseModel
from typing import Any, Optional
import datetime
import json

class TempleCreate(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    state: str
    imageLink: str
    zones_config: Any
    exit_routes_config: Any

class CrowdDataCreate(BaseModel):
    temple_id: str
    total_count: int
    status: str
    zones: Any

def temple_to_dict(temple: TempleCreate) -> dict:
    return {
        "id": temple.id,
        "name": temple.name,
        "latitude": temple.latitude,
        "longitude": temple.longitude,
        "state": temple.state,
        "imageLink": temple.imageLink,
        "zones_config": temple.zones_config,
        "exit_routes_config": temple.exit_routes_config,
    }

def crowd_data_to_dict(data: dict) -> dict:
    return {
        "temple_id": data.get("temple_id"),
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "total_count": data.get("total_count", 0),
        "status": data.get("status", "LOW"),
        "zones": data.get("zones", []),
    }
