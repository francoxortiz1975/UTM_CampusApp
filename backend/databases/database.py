import sqlite3
import os
from werkzeug.security import generate_password_hash, check_password_hash

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