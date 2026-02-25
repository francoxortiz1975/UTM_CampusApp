from flask import Flask, jsonify
import random

app = Flask(__name__)
from datetime import datetime

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

def generate_day_data(open_hour, close_hour):
    data = []
    for hour in range(open_hour, close_hour + 1):
        dt = datetime.strptime(str(hour), "%H")

        # Cross-platform hour formatting
        label = dt.strftime("%I %p").lstrip("0")

        capacity = random.randint(5, 100)

        data.append({
            "time": label,
            "capacity": capacity
        })

    return data


# ======================================================
# SINGLE HOUR REPORT (Parking + Gym)
# /reports/<month>/<weekday>/<time>/<type>/<location>
# ======================================================
@app.route("/reports/<month>/<weekday>/<int:time>/<string:rtype>/<location>")
def single_report(month, weekday, time, rtype, location):

    # Simulate busier mid-day
    if 8 <= time <= 10:
        base = random.randint(30, 60)
    elif 11 <= time <= 14:
        base = random.randint(60, 95)
    elif 15 <= time <= 18:
        base = random.randint(50, 85)
    else:
        base = random.randint(5, 40)

    return jsonify({
        "estimate": base
    })


# ======================================================
# FULL DAY REPORT (Parking)
# /reports/<month>/<weekday>/parking/<location>
# ======================================================
@app.route("/reports/<month>/<weekday>/parking/<location>")
def full_day_parking(month, weekday, location):

    # Parking open 7AM - 10PM
    data = generate_day_data(7, 22)
    return jsonify(data)


# ======================================================
# FULL DAY REPORT (Gym)
# /reports/<month>/<weekday>/gym/<location>
# ======================================================
@app.route("/reports/<month>/<weekday>/gym/<location>")
def full_day_gym(month, weekday, location):

    weekday = weekday.lower()

    if weekday in ["saturday", "sunday"]:
        # Weekend hours: 10AM - 5PM
        data = generate_day_data(10, 17)
    else:
        # Weekday hours: 7AM - 10PM
        data = generate_day_data(7, 22)

    return jsonify(data)


# ======================================================
if __name__ == "__main__":
    app.run(port=5000, debug=True)