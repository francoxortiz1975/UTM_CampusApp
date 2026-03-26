from flask import Blueprint, request, jsonify
from ..components.event import Event

calendar_bp = Blueprint("calendar", __name__)

@calendar_bp.route("/<month>", methods=["GET"])
def get_events(month):
    # Filter events where the date string contains the specified month
    events = Event.query.filter(Event.date.like(f"%{month}%")).all()
    
    return jsonify([event.to_dict() for event in events]), 200

@calendar_bp.route("", methods=["POST"])
def create_event():
    data = request.get_json(silent=True)
    
    # Validate that the payload exists and contains all required fields
    if not data or not all(key in data for key in ("name", "date", "location")):
        return jsonify({"error": "Missing required fields: name, date, location"}), 400
    
    # Create the new event and save it to the database
    new_event = Event(
        name=data["name"],
        date=data["date"],
        location=data["location"]
    )
    new_event.save()
    
    return jsonify(new_event.to_dict()), 201