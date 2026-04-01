# app/routes/reports.py
from flask import Blueprint, request, session, jsonify
from ..components.report import Report
from ..components.statusreport import StatusCode, StatusReport
from datetime import datetime

reports_bp = Blueprint("reports", __name__)
#so each group of routes lives in its own file

WEEKDAYS = {'monday': 1,
            'tuesday': 2,
            'wednesday': 3,
            'thursday': 4,
            'friday': 5,
            'saturday': 6,
            'sunday': 0}

PARKING_BASELINE = [5, 5, 5, 5, 5, 10, 10, 20, 25, 40, 45, 70, 80, 95, 95, 
                    80, 70, 60, 55, 50, 35, 20, 15, 10]
GYM_BASELINE =     [5, 5, 5, 5, 5, 10, 10, 20, 25, 40, 45, 70, 80, 95, 95, 
                    80, 70, 60, 55, 50, 35, 20, 15, 10]
FOOD_BASELINE =    [5, 5, 5, 5, 5, 5, 5, 5, 10, 20, 10, 10, 20, 30,
                     30, 10, 10, 20, 30, 15, 10, 5, 5, 5]

GYM_HOURS = {'gyma': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
             'gymb': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
             'gymc': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
             'weightroom': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
             'pool': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
             'tennis': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
            }

FOOD_HOURS = {
'1': [(0,0),(10,22),(10,22),(10,22),(10,22),(10,18),(0,0)],
'2': [(0,0),(10,21),(10,21),(10,21),(10,21),(10,16),(0,0)],
'3': [(0,0),(8,19),(8,19),(8,19),(8,19),(8,16),(0,0)],
'4': [(0,0),(8,17),(8,17),(8,17),(8,17),(8,15),(0,0)],
'5': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'6': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'7': [(0,0),(10,21),(10,21),(10,21),(10,21),(10,16),(0,0)],
'8': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'9': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,16),(0,0)],
'10': [(0,0),(10,19),(10,19),(10,19),(10,19),(10,16),(0,0)],
'11': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'12': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'13': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'14': [(0,0),(11,19),(11,19),(11,19),(11,19),(11,16),(0,0)],
'15': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,16),(0,0)],
'16': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,16),(0,0)],
'17': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,16),(0,0)],
'18': [(0,0),(11,21),(11,21),(11,21),(11,21),(11,15),(0,0)],
'19': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,16),(0,0)],
'20': [(0,0),(11,16),(11,16),(11,16),(11,16),(11,15),(0,0)],
'21': [(0,0),(11,16),(11,16),(11,16),(11,16),(11,15),(0,0)],
'22': [(0,0),(10,18),(10,18),(10,18),(10,18),(10,14),(0,0)],
'23': [(0,0),(8,18),(8,18),(8,18),(8,18),(8,15),(0,0)],
'24': [(0,0),(10,17),(10,17),(10,17),(10,17),(10,14),(0,0)],
'25': [(0,0),(10,22),(10,22),(10,22),(10,22),(10,18),(0,0)],
'26': [(0,0),(10,18),(10,18),(10,18),(10,18),(10,18),(0,0)],
'27': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'28': [(0,0),(11,21),(11,21),(11,21),(11,21),(11,20),(0,0)],
'29': [(0,0),(10,22),(10,22),(10,22),(10,22),(12,19),(0,0)],
'30': [(0,0),(10,21),(10,21),(10,21),(10,21),(12,18),(0,0)],
'31': [(0,0),(10,22),(10,22),(10,22),(10,22),(12,19),(0,0)],
'32': [(0,0),(10,19),(10,19),(10,19),(10,19),(12,18),(0,0)],
'33': [(0,0),(13,20),(13,20),(13,20),(13,20),(13,20),(0,0)],
'34': [(0,0),(11,21),(11,21),(11,21),(11,21),(0,0),(0,0)],
'35': [(0,0),(7,21),(7,21),(7,21),(7,21),(7,18),(0,0)],
'36': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'37': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'38': [(0,0),(20,24),(20,24),(20,24),(20,24),(0,0),(0,0)],
'39': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'40': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'41': [(0,0),(7,24),(7,24),(7,24),(7,24),(7,21),(0,0)],
'42': [(0,0),(9,16),(9,16),(9,16),(9,16),(9,15),(0,0)],
'43': [(0,0),(8,16),(8,16),(8,16),(8,16),(8,14),(0,0)],
}

current_people_count = {} #Valid Locations are: oph_foodcourt, dh_starbucks, dh_foodcourt, 
current_people_count_locations = {"oph_foodcourt": ['27','28','29','30','31','32','33','34','35','36','37','38','39','40','41'], "dh_starbucks": ['3'], "dh_foodcourt": ['20','21','22','23','24'],
                                  "cct_foodcourt": ['43'], "second_cup": ['4'], 
                                  "dv_foodcourt": ['2','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19'], "ib_foodcourt": ['1','25','26']}

import json

@reports_bp.route("/<int:month>/<string:day>/<int:time>/<string:page>/<string:name>", methods=["GET"])
def get_average(month, day, time, page, name):
    try:
        if not (1 <= month <= 12):
            status = StatusReport("month must be between 1 and 12", StatusCode.BAD_REQUEST)
            return status.json(), status.code()

        if day not in WEEKDAYS.keys():
            status = StatusReport("weekday is invalid", StatusCode.BAD_REQUEST)
            return status.json(), status.code()

        start = f"{time:02d}:00"
        end = f"{time:02d}:59"
        reports = Report.query_reports(
            month=month,
            weekday=WEEKDAYS[day],
            time_start=start,
            time_end=end,
            title=page,
            location=name
        )

        total = 0

        for report in reports:
            data = json.loads(report.content)
            if page == 'food':
                total += data["wait_minutes"]
            else:
                total += data["capacity"]

        current_people = 0
        if page == 'food':
            for location in current_people_count_locations.keys():
                if name in current_people_count_locations[location]:
                    if location in current_people_count.keys():
                        current_people = current_people_count[location]
                        break
    
        if len(reports) == 0:
            if page == 'parking':
                avg = PARKING_BASELINE[time]
            elif page == 'food':
                avg = FOOD_BASELINE[time]
                if current_people != 0:
                    avg = 0.75 * avg + 0.25 * (current_people * 2)
                    print("Original avg: ", FOOD_BASELINE[time], "New avg: ", avg)
            elif page == 'gym':
                avg = GYM_BASELINE[time]
        else: 
            if current_people != 0:
                avg = 0.75 * (total / len(reports)) + 0.25 * (current_people * 2)
                print("Original avg: ", total / len(reports), "New avg: ", avg)
            else:
                avg = total / len(reports)

        status = StatusReport(
            {"estimate": round(avg)},
            StatusCode.OK,
        )

        return status.json(), status.code()

    except Exception as e:
        print(e)
        status = StatusReport(str(e), StatusCode.INTERNAL_SERVER_ERROR)
        return status.json(), status.code()

@reports_bp.route("/<int:month>/<string:day>/<string:page>/<string:name>", methods=["GET"])
def full_day_report(month, day, page, name):
    current_hour = datetime.now().hour
    if not (1 <= month <= 12):
        status = StatusReport("month must be between 1 and 12", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    if day not in WEEKDAYS.keys():
        status = StatusReport("weekday is invalid", StatusCode.BAD_REQUEST)
        return status.json(), status.code()

    report_data = []
    try:

        open, close = 0, 23

        if page == 'gym':
            open, close = GYM_HOURS[name][WEEKDAYS[day]]
        elif page == 'food':
            open, close = FOOD_HOURS[name][WEEKDAYS[day]]

        for time in range(open, close):
            start = f"{time:02d}:00"
            end = f"{time:02d}:59"
            reports = Report.query_reports(
                month=month,
                weekday=WEEKDAYS[day],
                time_start=start,
                time_end=end,
                title=page,
                location=name
            )
            total = 0

            for report in reports:
                data = json.loads(report.content)
                if page == 'food':
                    total += data["wait_minutes"]
                else:
                    total += data["capacity"]

            current_people = 0
            if time == current_hour:
                if page == 'food':
                    for location in current_people_count_locations.keys():
                        if name in current_people_count_locations[location]:
                            if location in current_people_count.keys():
                                current_people = current_people_count[location]
                                break

            if len(reports) == 0:
                if page == 'parking':
                    avg = PARKING_BASELINE[time]
                elif page == 'food':
                    print("o")
                    avg = FOOD_BASELINE[time]
                    if current_people != 0:
                        avg = 0.75 * avg + 0.25 * (current_people * 2)
                        print("Original avg: ", FOOD_BASELINE[time], "New avg: ", avg)
                elif page == 'gym':
                    avg = GYM_BASELINE[time]
            else:
                if current_people != 0:
                    avg = 0.75 * (total / len(reports)) + 0.25 * (current_people * 2)
                    print("Original avg: ", total / len(reports), "New avg: ", avg)
                else:
                    avg = total / len(reports)
            
            r_time = time
            if (time > 12):
                r_time -= 12
                r_time = str(r_time) + 'pm'
            elif (time == 12):
                r_time = str(r_time) + 'pm'
            elif (time == 0):
                r_time = 12
                r_time = str(r_time) + 'am'
            else:
                r_time = str(r_time) + 'am'
            
            report_data.append({
                "time": r_time,
                "capacity": round(avg),
            })
        print(report_data)
        return jsonify(report_data)

    except Exception as e:
        print(e)
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


@reports_bp.route("/scanner", methods=["POST"], strict_slashes=False)
def accept_scanner():
    data = request.json or {}
    people_count = data.get("people_count")
    location = data.get("title")

    current_people_count[location] = people_count

    status = StatusReport("", StatusCode.OK)
    return status.json(), status.code()