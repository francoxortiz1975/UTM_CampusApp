# Scanner — Live occupancy feed

A small **Python** utility that reads frames from the default webcam, runs **Ultralytics YOLOv8** person detection, and periodically **POSTs** an estimated people count to the Flask backend (`/reports/scanner`). It is optional: the dashboard can still use baseline or manually submitted data without it.

## Stack

- OpenCV (`cv2`) for capture and preview
- Ultralytics YOLOv8 (`yolov8n.pt` downloaded on first use)
- `requests` for HTTP
- PyTorch (pulled in by Ultralytics)

**Hardware:** a connected camera (device index `0` in code).

## Prerequisites

- Python 3.10+ and a virtual environment (recommended)
- **Backend running** at the URL configured in `config.py` (default `http://localhost:5000/reports/scanner/`)
- Sufficient disk/RAM for PyTorch and the YOLO weights

## Setup

From the `scanner` directory:

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running

The entry point is **`app.py`** (not a separate `scanner.py` file).

```bash
python app.py --title <location_key>
```

`<location_key>` must be one of the configured venue identifiers, for example:

`oph_foodcourt`, `dh_starbucks`, `dh_foodcourt`, `cct_foodcourt`, `second_cup`, `dv_foodcourt`, `ib_foodcourt`

If `--title` is missing or invalid, the program prints the allowed list and exits.

### Behaviour

- Counts detections labeled `person` using confidence thresholds from `config.py`.
- Sends a JSON payload `{ "title": "...", "people_count": N }` to the backend every **`SEND_INTERVAL`** seconds (default 30).
- Press **`d`** in the preview window to toggle **debug overlays** (bounding boxes, FPS, counts).

## Configuration

Edit `config.py`:

| Setting | Meaning |
|---------|---------|
| `BACKEND_URL` | Full URL for the scanner ingest endpoint |
| `SEND_INTERVAL` | Minimum seconds between POSTs |
| `CONFIDENCE_THRESHOLD` / `HIGH_CONFIDENCE_THRESHOLD` | Detection gating |
| `DEBUG_MODE` | Verbose visualization (also toggled with `d`) |

If the API runs on another host or port, update `BACKEND_URL` accordingly.

## Updating dependencies

```bash
pip freeze > requirements.txt
```

Only freeze after intentional installs/upgrades so the file stays reproducible for your teammates.
