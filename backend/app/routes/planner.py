from flask import Blueprint, request, session

from ..components.plannercalendar import PlannerCalendar
from ..components.statusreport import StatusCode, StatusReport

planner_bp = Blueprint("planner", __name__)


def require_user_id():
    user_id = session.get("user_id")
    if not user_id:
        return None

    try:
        return int(user_id)
    except (TypeError, ValueError):
        return None


@planner_bp.route("/calendar", methods=["GET"])
def get_saved_calendar():
    user_id = require_user_id()
    if user_id is None:
        status = StatusReport("Not logged in", StatusCode.UNAUTHORIZED)
        return status.json(), status.code()

    record = PlannerCalendar.get_by_user_id(user_id)

    status = StatusReport(record.to_dict() if record else {"calendar_text": None, "updated_at": None}, StatusCode.OK)
    return status.json(), status.code()


@planner_bp.route("/calendar", methods=["POST"])
def save_calendar():
    user_id = require_user_id()
    if user_id is None:
        status = StatusReport("Not logged in", StatusCode.UNAUTHORIZED)
        return status.json(), status.code()

    data = request.get_json(silent=True) or {}
    calendar_text = data.get("calendar_text")

    if not isinstance(calendar_text, str) or not calendar_text.strip():
        status = StatusReport("A non-empty calendar_text value is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    record = PlannerCalendar.save_for_user(user_id, calendar_text)

    status = StatusReport(record.to_dict(), StatusCode.OK)
    return status.json(), status.code()
