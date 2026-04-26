import os
import json
from database import initialize_firebase, get_db

def upload_temples_from_log():
    # Initialize Firebase using the existing database.py function
    initialize_firebase("serviceAccountKey.json")
    db = get_db()
    
    temples_ref = db.collection("temples")
    
    try:
        with open("seed_log.txt", "r", encoding="utf-8") as f:
            lines = f.readlines()
    except FileNotFoundError:
        print("Error: seed_log.txt not found.")
        return

    # Find what the maximum current ID is, or just start from a high number to avoid collisions
    # with the 10 MVP temples (T1-T10)
    current_id_num = 11 
    
    added_count = 0
    
    print("Starting upload to Firebase...")
    
    for line in lines:
        line = line.strip()
        if line.startswith("[✓]"):
            # Format: [✓] Temple Name: Latitude, Longitude
            try:
                # Remove the checkmark prefix
                content = line[3:].strip()
                
                # Split by the first colon to separate name and coordinates
                name_part, coords_part = content.split(":", 1)
                name = name_part.strip()
                
                # Split coordinates by comma
                lat_str, lng_str = coords_part.strip().split(",", 1)
                lat = float(lat_str.strip())
                lng = float(lng_str.strip())
                
                temple_id = f"T{current_id_num}"
                
                # Construct the Firestore document using the same structure as main.py MVP temples
                temple_data = {
                    "name": name,
                    "latitude": lat,
                    "longitude": lng,
                    "state": "Unknown",  # The log doesn't provide state, so we use a default
                    "imageLink": "",
                    "zones_config": json.dumps([
                        {"id": "A", "label": "Main Area", "lat": lat, "lng": lng, "radius": 50}
                    ]),
                    "exit_routes_config": json.dumps([])
                }
                
                # Upload to Firestore
                temples_ref.document(temple_id).set(temple_data)
                print(f"Uploaded: {name} as {temple_id}")
                
                current_id_num += 1
                added_count += 1
            except Exception as e:
                print(f"Could not parse line: '{line}' - Error: {e}")

    print(f"Successfully uploaded {added_count} temples to Firebase.")

if __name__ == "__main__":
    upload_temples_from_log()
