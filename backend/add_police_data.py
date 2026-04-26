import json
import re

def parse_seed_log(filepath):
    temples = []
    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            match = re.match(r'\[✓\] (.*?): ([\d\.-]+), ([\d\.-]+)', line)
            if match:
                name, lat, lng = match.groups()
                temples.append({
                    "name": name.strip(),
                    "lat": float(lat),
                    "lng": float(lng)
                })
    return temples

def generate_police_number(state):
    # Mocking realistic local police station numbers based on common prefixes
    # In a real app, this would come from a GIS query or directory API
    prefixes = {
        "Uttar Pradesh": "0522-22",
        "Andhra Pradesh": "0866-24",
        "Bihar": "0612-22",
        "Gujarat": "079-23",
        "Maharashtra": "022-22",
        "Karnataka": "080-22",
        "Delhi": "011-23",
        "Kerala": "0471-23",
        "Odisha": "0674-23"
    }
    prefix = prefixes.get(state, "011-23")
    import random
    return f"{prefix}{random.randint(1000, 9999)}"

def main():
    temples_list = parse_seed_log('seed_log.txt')
    
    # We'll use a fixed state for now or try to infer it if we had more data.
    # For this MVP, we'll assign realistic numbers.
    
    db_temples = {}
    for i, t in enumerate(temples_list):
        tid = f"T{i+1}"
        # Mocking state/address for the demo
        state = "Uttar Pradesh" # Defaulting for simplicity in seed
        if i > 50: state = "Andhra Pradesh"
        if i > 100: state = "Bihar"
        if i > 150: state = "Gujarat"
        if i > 200: state = "Maharashtra"
        
        db_temples[tid] = {
            "id": tid,
            "name": t["name"],
            "latitude": t["lat"],
            "longitude": t["lng"],
            "state": state,
            "police_contact": generate_police_number(state),
            "address": f"Near {t['name']}, {state}",
            "zones_config": [],
            "exit_routes_config": []
        }

    # Load existing crowd data if any
    try:
        with open('db.json', 'r') as f:
            existing = json.load(f)
            crowd_data = existing.get("crowd_data", [])
    except:
        crowd_data = []

    final_db = {
        "temples": db_temples,
        "crowd_data": crowd_data
    }

    with open('db.json', 'w') as f:
        json.dump(final_db, f, indent=2)

    print(f"Updated db.json with {len(db_temples)} temples and local police contacts.")

if __name__ == "__main__":
    main()
