import cv2
import time
import requests
import argparse
from ultralytics import YOLO
from config import Config

# Load model
model = YOLO("yolov8n.pt")

# Activate camera
cap = cv2.VideoCapture(0)

last_sent_time = 0

parser = argparse.ArgumentParser()
parser.add_argument("--title", type=str, required=True)

args = parser.parse_args()

def send_to_server(people_count):
    try:
        response = requests.post(Config.BACKEND_URL, json={
            "title": args.title,
            "content": {
                "people_count": people_count,
            },
        })
        print("Request:", response)
    except Exception as e:
        print("Error:", e)

def handle_hotkeys():
    key = cv2.waitKey(1) & 0xFF
    if key == ord('d'):
        Config.DEBUG_MODE = not Config.DEBUG_MODE
        print("Config.DEBUG_MODE:", Config.DEBUG_MODE)

while True:
    start_time = time.time()

    ret, frame = cap.read()
    if not ret:
        break

    people_count = 0
    rejected_count = 0

    for result in model(frame, verbose=False):
        for box in result.boxes:
            class_index = int(box.cls[0])
            class_confidence = float(box.conf[0])

            class_name = model.names[class_index]

            if class_name == "person":
                if class_confidence > Config.HIGH_CONFIDENCE_THRESHOLD:
                    people_count += 1
                    status = "GOOD"
                    color = (0, 255, 0)
                elif class_confidence > Config.CONFIDENCE_THRESHOLD:
                    people_count += 1
                    status = "OKAY"
                    color = (0, 165, 255)
                else:
                    rejected_count += 1
                    status = "BAD"
                    color = (0, 0, 255)
            else:
                status = "INVALID"
                color = (255, 255, 0)

            if Config.DEBUG_MODE:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                # Bounding box
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

                #Label
                cv2.putText(frame, f"{class_name} {class_confidence:.2f} ({status})", (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

    if Config.DEBUG_MODE:
        cv2.putText(frame, f"People: {people_count}", (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        cv2.putText(frame, f"Rejected: {rejected_count}", (20, 75),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        cv2.putText(frame, f"FPS: {1 / (time.time() - start_time):.1f}", (20, 110),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 2)

        # Resolution
        h, w, _ = frame.shape
        cv2.putText(frame, f"{w}x{h}", (20, 145),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)

        # Timestamp
        cv2.putText(frame, time.strftime("%H:%M:%S"), (20, 175),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
        
    cv2.imshow("scanner", frame)

    # === SEND DATA ===
    if time.time() - last_sent_time > Config.SEND_INTERVAL:
        send_to_server(people_count)
        last_sent_time = time.time()

    handle_hotkeys()

cap.release()
cv2.destroyAllWindows()