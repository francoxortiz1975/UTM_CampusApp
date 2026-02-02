import sqlite3
import os

DB_DIR = os.path.join("backend", "databases")
DB_PATH = os.path.join(DB_DIR, "users.db")


def create_user(username, email, password):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
    INSERT INTO User (username, email, password)
    VALUES (?, ?, ?)
    """, (username, email, password))
    
    conn.commit()
    conn.close()

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

#Temporary for testing
create_user("alice", "alice@example.com", "hashedpassword123")