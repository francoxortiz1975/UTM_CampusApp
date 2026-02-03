from flask import Flask, request, jsonify
import sqlite3
from components.scraper import scrape_data

app = Flask(__name__)
DB_PATH = "databases/test.db"

@app.route("/scrape", methods=["GET"])
def scrape():
    data = scrape_data()  # Run your web scraping
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS items (id INTEGER PRIMARY KEY, title TEXT)")
    for item in data:
        c.execute("INSERT INTO items (title) VALUES (?)", (item,))
    conn.commit()
    conn.close()
    return jsonify({"status": "success", "data": data})

@app.route("/items", methods=["GET"])
def get_items():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT * FROM items")
    items = [{"id": row[0], "title": row[1]} for row in c.fetchall()]
    conn.close()
    return jsonify(items)

@app.route('/user', methods=['POST'])
def handle_user():
    data = request.get_json()
    
    if data and data.get("command") == "create":
        # Extract the user data
        user_id = data.get("id")
        username = data.get("username")
        email = data.get("email")
        password = data.get("password")
        
        # TODO: Still needs to pass data to database, for now just returns success message
        return jsonify({"message": "User created successfully", "user": username}), 201
    
    return jsonify({"error": "Invalid command or data"}), 400

if __name__ == "__main__":
    app.run(debug=True)
