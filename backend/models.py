"""
Firestore data models for CrowdRakshak.

These are plain Python dicts/Pydantic models — Firestore is schemaless,
so we don't need SQLAlchemy ORM models anymore.

Collections:
  - temples       (doc id = temple id, e.g. "T1")
  - crowd_data    (auto-generated doc ids, temple_id field for queries)
"""

from pydantic import BaseModel
from typing import Any, Optional
import datetime


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
    """Convert a TempleCreate model to a Firestore-friendly dict."""
    import json
    return {
        "name": temple.name,
        "latitude": temple.latitude,
        "longitude": temple.longitude,
        "state": temple.state,
        "imageLink": temple.imageLink,
        "zones_config": json.dumps(temple.zones_config),
        "exit_routes_config": json.dumps(temple.exit_routes_config),
    }


def crowd_data_to_dict(data: dict) -> dict:
    """Convert crowd data payload to a Firestore-friendly dict."""
    return {
        "temple_id": data["temple_id"],
        "timestamp": datetime.datetime.utcnow(),
        "count": data["total_count"],
        "status": data["status"],
        "zone_data": data["zones"],
    }
