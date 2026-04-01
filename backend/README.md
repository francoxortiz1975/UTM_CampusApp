# Backend — Flask API

The **Flask** service that powers authentication, occupancy-style **reports**, the **events calendar**, and **lost-and-found** data. It uses **SQLAlchemy** with **SQLite** (`database.db` by default), **Flask-Bcrypt** for passwords, and **flask-cors** so the Next.js app can call the API during development.

## Stack

- Flask 3
- Flask-SQLAlchemy 3
- Flask-Bcrypt / bcrypt
- flask-cors
- SQLite (`sqlite:///database.db`)

## Prerequisites

- Python 3.10+ recommended

## Setup

From the `backend` directory:

```bash
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Running the server

```bash
python3 app.py
```

Debug mode is enabled in `app.py` for local development. The API listens on **port 5000** by default: [http://localhost:5000](http://localhost:5000).

On first run (and whenever models change in development), SQLAlchemy creates tables inside the configured SQLite database.

## Application layout

- `app.py` — Entry point: builds the app and runs the development server
- `app/__init__.py` — `create_app()`, extensions, blueprint registration, `create_all()`
- `app/config.py` — Secret key, session cookies, database URI
- `app/routes/` — Blueprints:
  - `/auth` — signup, login, logout, profile
  - `/reports` — food / gym / parking style reports; scanner ingest
  - `/calendar` — monthly events, pending items, accept / decline, create
  - `/lostandfound` — CRUD-style listing and comments
- `app/components/` — Domain logic (users, reports, events, authenticator, etc.)

## API surface (summary)

| Prefix | Purpose |
|--------|---------|
| `/auth/signup`, `/auth/login`, `/auth/logout` | JSON body; session cookies on success |
| `/auth/profile` | Current user profile (GET) |
| `/reports/...` | GET patterns for time/location reports; POST `/reports/` and `/reports/scanner` for updates |
| `/calendar/<month>`, `/calendar/pending`, `/calendar`, `/calendar/accept/<id>`, `/calendar/decline/<id>` | Events |
| `/lostandfound/` and related routes | Listings and comments |

Exact paths and payloads are defined in the route modules under `app/routes/`.

## Configuration and security

- `SECRET_KEY` and `SQLALCHEMY_DATABASE_URI` live in `app/config.py`. Replace the placeholder secret and use a production-grade database before deployment.
- `SESSION_COOKIE_SECURE` is `False` for local HTTP; set to `True` when serving only over HTTPS.

## Updating dependencies

After installing or upgrading packages:

```bash
pip freeze > requirements.txt
```

Commit intentional changes only; avoid blindly freezing unrelated global packages into this file.
