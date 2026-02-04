from flask import Flask, jsonify
import sqlite3
import requests
from bs4 import BeautifulSoup

def scrape_data():
    url = "https://example.com"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, "html.parser")
    items = [el.text for el in soup.select("h2.title")]  # Example selector
    return items

app = Flask(__name__)
DB_PATH = "databases/test.db"

conn = sqlite3.connect(DB_PATH)

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

if __name__ == "__main__":
    app.run(debug=True)
