# app/routes/reports.py
from flask import Blueprint, request, session
from ..components.report import Report
from ..components.statusreport import StatusCode, StatusReport

reports_bp = Blueprint("reports", __name__)
#so each group of routes lives in its own file

@reports_bp.route("/search", methods=["GET"])
def search_reports():
    """
    example:
    GET /reports/search?month=3&weekday=1&time_start=08:00&time_end=17:00&user_id=1

    All query parameters are optional. the ones provided, are used as filters.

    month      – integer 1-12
    weekday    – integer 0-6  (0 = Sunday … 6 = Saturday)
    time_start – HH:MM inclusive lower bound
    time_end   – HH:MM inclusive upper bound
    user_id    – restrict to a single user's reports
    """
    try:
        month = request.args.get("month", type=int)
        weekday = request.args.get("weekday", type=int)
        time_start = request.args.get("time_start")
        time_end = request.args.get("time_end")
        user_id = request.args.get("user_id", type=int)

        # Basic validation
        if month is not None and not (1 <= month <= 12):
            status = StatusReport("month must be between 1 and 12", StatusCode.BAD_REQUEST)
            return status.json(), status.code()

        if weekday is not None and not (0 <= weekday <= 6):
            status = StatusReport("weekday must be between 0 (Sun) and 6 (Sat)", StatusCode.BAD_REQUEST)
            return status.json(), status.code()

        reports = Report.query_reports(
            month=month,
            weekday=weekday,
            time_start=time_start,
            time_end=time_end,
            user_id=user_id,
        )

        status = StatusReport(
            [r.to_dict() for r in reports],
            StatusCode.OK,
        )
        return status.json(), status.code()

    except Exception as e:
        status = StatusReport(str(e), StatusCode.INTERNAL_SERVER_ERROR)
        return status.json(), status.code()


@reports_bp.route("/", methods=["POST"], strict_slashes=False)
def create_report():
    """
    POST /reports/
    Body: { "title": "...", "content": "..." }
    """
    data = request.json or {}
    user_id = session.get("user_id")
    title = data.get("title")
    content = data.get("content", "")

    if not user_id:
        status = StatusReport("You must be logged in to submit a report", StatusCode.UNAUTHORIZED)
        return status.json(), status.code()

    if not title:
        status = StatusReport("title is required", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    report = Report(user_id=user_id, title=title, content=content)
    report.save()

    status = StatusReport(report.to_dict(), StatusCode.CREATED)
    return status.json(), status.code()
