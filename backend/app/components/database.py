import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash
from flask import Flask, request, jsonify

DB_DIR = os.path.join("backend", "databases")
DB_PATH = os.path.join(DB_DIR, "users.db")


def create_user(username, email, password):
    """Create a user with a hashed password. Pass plain-text password; it is hashed before storage."""
    password_hash = generate_password_hash(password)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO User (username, email, password)
    VALUES (?, ?, ?)
    """, (username, email, password_hash))
    conn.commit()
    conn.close()


def verify_user(username, password):
    """Verify credentials: returns (True, user_id) if valid, (False, None) otherwise."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, password FROM User WHERE username = ?",
        (username,),
    )
    row = cursor.fetchone()
    conn.close()
    if row is None:
        return False, None
    user_id, stored_hash = row
    if not check_password_hash(stored_hash, password):
        return False, None
    return True, user_id

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS User (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
)
""")

conn.commit()
conn.close()

# Temporary for testing — password is hashed before storage
# create_user("alice", "alice@example.com", "password123")


# ============================
# SCRUM-19: HTTP server stub
# ============================

def launch_db_server(host="127.0.0.1", port=5050):
    """
    Launch a minimal HTTP server for the database layer.
    This server intentionally does NOT perform DB operations yet.
    It exists to satisfy SCRUM-19 acceptance criteria.
    """
    app = Flask(__name__)

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify(
            status="ok",
            service="database",
            note="SCRUM-19 stub server"
        ), 200

    @app.route("/", methods=["GET", "POST", "PUT", "DELETE"])
    def root():
        return jsonify(
            status="received",
            method=request.method,
            message="SCRUM-19 stub: request accepted, no action performed"
        ), 200

    app.run(host=host, port=port, debug=True)


if __name__ == "__main__":
    # Running this file directly launches the DB HTTP server
    launch_db_server()
