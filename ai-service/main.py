import cv2
import time
import json
import requests
import random
from datetime import datetime

try:
    from ultralytics import YOLO
    HAS_YOLO = True
except ImportError:
    HAS_YOLO = False
    print("Warning: ultralytics (YOLO) not found. Running in simulation mode only.")

# Configuration
MODEL_PATH = "yolov8n.pt"  # Nano model for speed
BACKEND_URL = "http://localhost:8000/crowd-data"
TEMPLE_ID = "T1"
PROCESS_INTERVAL = 2  # seconds
ZONES = {
    "A": {"x1": 0, "y1": 0, "x2": 640, "y2": 320},  # Example zone coordinates
    "B": {"x1": 0, "y1": 320, "x2": 640, "y2": 640}
}

def get_status(count):
    if count < 50: return "LOW"
    if count < 150: return "MODERATE"
    return "HIGH"

def is_in_zone(x, y, zone_coords):
    return zone_coords["x1"] <= x <= zone_coords["x2"] and zone_coords["y1"] <= y <= zone_coords["y2"]

def main():
    # Load model if available
    model = None
    if HAS_YOLO:
        try:
            model = YOLO(MODEL_PATH)
        except Exception as e:
            print(f"Error loading model: {e}. Switching to simulation.")
            model = None

    # Initialize video capture
    cap = cv2.VideoCapture(0) if HAS_YOLO else None
    
    simulation_mode = not (cap and cap.isOpened() and model)
    if simulation_mode:
        print("Running in Simulation Mode...")

    print(f"Starting AI Crowd Detection for Temple {TEMPLE_ID}...")

    try:
        while True:
            start_time = time.time()
            
            if not simulation_mode:
                ret, frame = cap.read()
                if not ret:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                
                results = model(frame, classes=[0], verbose=False)
                total_count = 0
                zone_counts = {z_id: 0 for z_id in ZONES}
                
                for r in results:
                    for box in r.boxes:
                        total_count += 1
                        x1, y1, x2, y2 = box.xyxy[0]
                        cx, cy = int((x1 + x2) / 2), int((y1 + y2) / 2)
                        for z_id, coords in ZONES.items():
                            if is_in_zone(cx, cy, coords):
                                zone_counts[z_id] += 1
                                break
            else:
                total_count = random.randint(20, 200)
                zone_counts = {
                    "A": int(total_count * 0.4),
                    "B": int(total_count * 0.6)
                }

            payload = {
                "temple_id": TEMPLE_ID,
                "timestamp": datetime.now().isoformat(),
                "total_count": total_count,
                "zones": [{"id": z_id, "count": count} for z_id, count in zone_counts.items()],
                "status": get_status(total_count)
            }

            print(f"Detected: {total_count} people. Status: {payload['status']}")
            
            # Send to backend
            try:
                requests.post(BACKEND_URL, json=payload, timeout=1)
            except Exception as e:
                print(f"Backend unreachable at {BACKEND_URL}")

            elapsed = time.time() - start_time
            sleep_time = max(0, PROCESS_INTERVAL - elapsed)
            time.sleep(sleep_time)

    except KeyboardInterrupt:
        print("Stopping AI Service...")
    finally:
        if cap: cap.release()

if __name__ == "__main__":
    main()
