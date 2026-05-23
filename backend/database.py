import sqlite3
import os
import json

DB_DIR = "data"
DB_PATH = os.path.join(DB_DIR, "db.sqlite")

def init_db():
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        state TEXT DEFAULT '{}',
        journals TEXT DEFAULT '[]',
        tasks TEXT DEFAULT '[]',
        coach_history TEXT DEFAULT '[]'
    );
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_user(username):
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (username,)).fetchone()
    conn.close()
    if user:
        return dict(user)
    return None

def create_user(username, password_hash):
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (id, password_hash) VALUES (?, ?)",
            (username, password_hash)
        )
        conn.commit()
        return True
    except sqlite3.IntegrityError:
        return False
    finally:
        conn.close()

def update_user_field(username, field, json_value):
    # Ensure json_value is serialized to string
    if not isinstance(json_value, str):
        json_value = json.dumps(json_value)
    
    allowed_fields = {"state", "journals", "tasks", "coach_history"}
    if field not in allowed_fields:
        raise ValueError(f"Unauthorized field write: {field}")
        
    conn = get_db_connection()
    conn.execute(
        f"UPDATE users SET {field} = ? WHERE id = ?",
        (json_value, username)
    )
    conn.commit()
    conn.close()
