from flask import Blueprint, request
from ..components.event import Event
from ..components.statusreport import StatusCode, StatusReport

calendar_bp = Blueprint("calendar", __name__)

@calendar_bp.route("/<int:month>", methods=["GET"])
def get_events(month):
    month = str(month).zfill(2)
    events = Event.get_by_month_and_accepted(month)

    status = StatusReport(
        [event.to_dict() for event in events],
        StatusCode.OK
    )
    return status.json(), status.code()


@calendar_bp.route("/pending", methods=["GET"])
def get_all_pending():
    pending_events = Event.get_pending_events()

    status = StatusReport(
        [event.to_dict() for event in pending_events],
        StatusCode.OK
    )
    return status.json(), status.code()


@calendar_bp.route("/accept/<int:id>", methods=["POST"])
def change_status(id):
    event = Event.get_by_id(id)

    if not event:
        status = StatusReport(
            "Event with id does not exist",
            StatusCode.NOT_FOUND
        )
        return status.json(), status.code()
    
    event.status = 0
    event.commit()

    status = StatusReport(event.to_dict(), StatusCode.OK)
    return status.json(), status.code()

@calendar_bp.route("/decline/<int:id>", methods=["POST"])
def decline_event(id):
    deleted = Event.delete_by_id(id)

    if not deleted:
        status = StatusReport(
            "Event with id does not exist",
            StatusCode.NOT_FOUND
        )
        return status.json(), status.code()

    status = StatusReport("deleted", StatusCode.OK)
    return status.json(), status.code()


@calendar_bp.route("", methods=["POST"])
def create_event():
    data = request.get_json(silent=True)

    required_fields = ("name", "date", "location", "desc", "time", "org")

    if not data or not all(key in data for key in required_fields):
        status = StatusReport(
            f"Missing required fields: {required_fields}",
            StatusCode.BAD_REQUEST
        )
        return status.json(), status.code()
    
    new_event = Event(
        name=data["name"],
        date=data["date"],
        desc=data["desc"],
        time=data["time"],
        org=data["org"],
        status=1,
        location=data["location"]
    )
    new_event.save()

    status = StatusReport(new_event.to_dict(), StatusCode.CREATED)
    return status.json(), status.code()