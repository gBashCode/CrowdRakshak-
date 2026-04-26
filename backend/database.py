import json
import os
from typing import Dict, List, Any, Optional

class SimpleJSONDB:
    def __init__(self, filename: str = "db.json"):
        self.filename = filename
        self.data = {"temples": {}, "crowd_data": []}
        self.load()

    def load(self):
        if os.path.exists(self.filename):
            try:
                with open(self.filename, 'r') as f:
                    content = f.read()
                    if content:
                        self.data = json.loads(content)
            except Exception as e:
                print(f"Error loading database: {e}")

    def save(self):
        try:
            with open(self.filename, 'w') as f:
                json.dump(self.data, f, indent=2)
        except Exception as e:
            print(f"Error saving database: {e}")

    def get_temples(self) -> List[Dict]:
        return list(self.data.get("temples", {}).values())

    def add_temple(self, temple_id: str, data: Dict):
        self.data["temples"][temple_id] = data
        self.save()

    def add_crowd_data(self, data: Dict):
        if "crowd_data" not in self.data:
            self.data["crowd_data"] = []
        self.data["crowd_data"].append(data)
        # Keep only last 1000 entries to save space
        if len(self.data["crowd_data"]) > 1000:
            self.data["crowd_data"] = self.data["crowd_data"][-1000:]
        self.save()

    def get_latest_crowd(self, temple_id: str) -> Optional[Dict]:
        crowd_data = self.data.get("crowd_data", [])
        for entry in reversed(crowd_data):
            if entry.get("temple_id") == temple_id:
                return entry
        return None

# Singleton instance
_db = SimpleJSONDB()

def get_db():
    return _db

def initialize_firebase(path=None):
    # No-op for JSON DB
    pass
