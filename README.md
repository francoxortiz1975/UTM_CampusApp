# Campus Dashboard — CSC301 Group Project

**🔗 Live demo: [utm-campus-app.vercel.app](https://utm-campus-app.vercel.app)**

> The live demo runs on a mock, in-memory API (Next.js route handlers) that reproduces the Flask backend's behavior with seeded sample data — no separate server required. See [`frontend/src/lib/mock.ts`](frontend/src/lib/mock.ts).

A full-stack campus services hub that brings food availability, gym and parking occupancy, events, an interactive map, and a lost-and-found board into a single web experience. The system combines a **Next.js** web app, a **Flask** API with session-based authentication, and an optional **computer-vision scanner** that feeds live crowd estimates into the backend.

## Repository layout

| Directory | Role |
|-----------|------|
| [`frontend/`](frontend/) | Next.js (App Router) UI: dashboards, charts, and API integration |
| [`backend/`](backend/) | Flask REST API, SQLAlchemy models, SQLite database |
| [`scanner/`](scanner/) | YOLOv8 + OpenCV pipeline that POSTs people counts to the API |

## Features (high level)

- **Food, gym, and parking** — Time- and location-aware availability driven by the reports service (including optional live updates from the scanner).
- **Events** — Campus calendar with submission and moderation-style flows.
- **Lost and found** — Listings with comments; uses authenticated sessions where applicable.
- **Campus map** — Navigation to buildings and in-building services.

## Prerequisites

- **Node.js** 20+ (recommended for Next.js 16)
- **Python** 3.10+ (backend and scanner; use a virtual environment per package)
- **Webcam** (only if you run the scanner)

## Quick start

Run the **backend** first so the frontend and scanner have an API to talk to.

1. **Backend** — See [`backend/README.md`](backend/README.md)  
   - Default API: `http://localhost:5000`

2. **Frontend** — See [`frontend/README.md`](frontend/README.md)  
   - Default app: `http://localhost:3000`  
   - The UI expects the API on port **5000** during local development.

3. **Scanner** (optional) — See [`scanner/README.md`](scanner/README.md)  
   - Requires the backend running and `scanner/config.py` pointing at your API.

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, Lucide icons  
- **Backend:** Flask 3, Flask-SQLAlchemy, Flask-Bcrypt, flask-cors, SQLite  
- **Scanner:** Ultralytics YOLOv8, OpenCV, PyTorch, `requests`

## Development notes

- CORS is enabled on the API for convenient local and LAN testing; tighten settings for production.
- Backend `Config` uses a development `SECRET_KEY` and SQLite file (`database.db`); change these before any real deployment.

---

*CSC301 — Introduction to Software Engineering (group project)*
