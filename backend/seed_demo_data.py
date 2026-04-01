"""
Seed script that populates the SQLite database with realistic demo report data.

Usage:
    cd backend && python seed_demo_data.py
"""

import json
import random
from datetime import datetime, timedelta

from app import create_app
from app.extensions import sqlalchemy
from app.components.report import Report
from app.components.user import User

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

YEAR, MONTH = 2026, 4  # April 2026

RESTAURANT_IDS = [str(i) for i in range(1, 44)]  # '1' .. '43'
GYM_IDS = ["gyma", "gymb", "gymc", "weightroom", "pool"]
PARKING_IDS = ["cct_garage"]

REPORTS_PER_HOUR = (3, 5)  # min/max reports per location per hour per weekday

USER_ID = 1

# Restaurant names (cosmetic only -- the id is what matters for queries)
RESTAURANT_NAMES = {
    str(i): f"Restaurant {i}" for i in range(1, 44)
}

# ---------------------------------------------------------------------------
# Operating hours (indexed by weekday: 0=Sun,1=Mon,...,6=Sat)
# Copied from FOOD_HOURS / GYM_HOURS in reports.py
# ---------------------------------------------------------------------------

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

GYM_HOURS = {
    'gyma':       [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
    'gymb':       [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
    'gymc':       [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
    'weightroom': [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
    'pool':       [(10,17),(7,22),(7,22),(7,22),(7,22),(7,22),(10,17)],
}

PARKING_HOURS = {
    'cct_garage': [(0, 23)] * 7,  # always open
}

# ---------------------------------------------------------------------------
# Per-restaurant "popularity" multiplier (some places are busier)
# ---------------------------------------------------------------------------

random.seed(42)
RESTAURANT_POPULARITY = {rid: round(random.uniform(0.6, 1.5), 2) for rid in RESTAURANT_IDS}

# ---------------------------------------------------------------------------
# Value generators
# ---------------------------------------------------------------------------

def food_wait_minutes(hour: int, restaurant_id: str) -> int:
    """Generate a realistic wait time in minutes based on hour and restaurant popularity."""
    pop = RESTAURANT_POPULARITY[restaurant_id]

    if hour < 8:
        base = random.uniform(1, 4)
    elif hour < 11:
        base = random.uniform(2, 6)
    elif hour == 11:
        base = random.uniform(6, 14)
    elif 12 <= hour <= 13:
        base = random.uniform(15, 30)  # lunch peak
    elif 14 <= hour <= 16:
        base = random.uniform(5, 12)
    elif 17 <= hour <= 19:
        base = random.uniform(12, 25)  # dinner peak
    elif 20 <= hour <= 21:
        base = random.uniform(5, 12)
    else:
        base = random.uniform(1, 5)

    value = base * pop
    # Add some noise
    value += random.gauss(0, value * 0.15)
    return max(1, round(value))


def gym_capacity(hour: int, gym_id: str) -> int:
    """Generate a realistic gym capacity % based on hour and gym area."""
    # Multiplier per gym area
    area_mult = {
        'weightroom': 1.2,
        'gyma': 1.0,
        'gymb': 0.95,
        'gymc': 0.85,
        'pool': 0.7,
    }
    mult = area_mult.get(gym_id, 1.0)

    if hour < 7:
        base = random.uniform(5, 15)
    elif 7 <= hour < 10:
        base = random.uniform(20, 40)
    elif 10 <= hour < 12:
        base = random.uniform(35, 55)
    elif 12 <= hour <= 14:
        base = random.uniform(55, 90)  # lunch peak
    elif 15 <= hour < 16:
        base = random.uniform(40, 60)
    elif 16 <= hour <= 19:
        base = random.uniform(60, 95)  # afternoon/evening peak
    elif 20 <= hour <= 21:
        base = random.uniform(35, 55)
    else:
        base = random.uniform(15, 30)

    value = base * mult
    value += random.gauss(0, value * 0.1)
    return max(5, min(100, round(value)))


def parking_occupancy(hour: int) -> int:
    """Generate a realistic parking occupancy % based on hour."""
    if hour < 7:
        base = random.uniform(5, 15)
    elif 7 <= hour < 9:
        base = random.uniform(25, 50)
    elif 9 <= hour < 10:
        base = random.uniform(50, 70)
    elif 10 <= hour <= 14:
        base = random.uniform(70, 95)  # peak campus hours
    elif 15 <= hour <= 16:
        base = random.uniform(55, 75)
    elif 17 <= hour <= 18:
        base = random.uniform(35, 55)
    elif 19 <= hour <= 21:
        base = random.uniform(15, 35)
    else:
        base = random.uniform(5, 15)

    base += random.gauss(0, base * 0.1)
    return max(5, min(100, round(base)))


# ---------------------------------------------------------------------------
# Date helpers
# ---------------------------------------------------------------------------

def get_weekdays_in_month(year: int, month: int):
    """Return all dates in the month that are Mon-Sat (no Sunday)."""
    dates = []
    day = datetime(year, month, 1)
    while day.month == month:
        # day.weekday(): 0=Mon ... 6=Sun
        if day.weekday() != 6:  # skip Sunday
            dates.append(day)
        day += timedelta(days=1)
    return dates


def python_weekday_to_sqlite(dt: datetime) -> int:
    """Convert Python weekday (0=Mon..6=Sun) to SQLite strftime %w (0=Sun..6=Sat)."""
    return (dt.weekday() + 1) % 7


# ---------------------------------------------------------------------------
# Main seed logic
# ---------------------------------------------------------------------------

def seed():
    app = create_app()

    with app.app_context():
        # Ensure demo user exists
        user = User.query.get(USER_ID)
        if user is None:
            user = User(id=USER_ID, email="demo@example.com")
            user.set_password("demo1234")
            sqlalchemy.session.add(user)
            sqlalchemy.session.commit()
            print(f"Created demo user (id={USER_ID}, email=demo@example.com)")
        else:
            print(f"Demo user (id={USER_ID}) already exists")

        # Clear existing demo reports
        deleted = Report.query.filter_by(user_id=USER_ID).delete()
        sqlalchemy.session.commit()
        print(f"Deleted {deleted} existing reports for user_id={USER_ID}")

        dates = get_weekdays_in_month(YEAR, MONTH)
        print(f"Generating reports for {len(dates)} days in {YEAR}-{MONTH:02d} (Mon-Sat)")

        reports = []
        count = 0

        for date in dates:
            sqlite_weekday = python_weekday_to_sqlite(date)

            # --- FOOD REPORTS ---
            for rid in RESTAURANT_IDS:
                hours = FOOD_HOURS[rid]
                open_h, close_h = hours[sqlite_weekday]
                if open_h == 0 and close_h == 0:
                    continue  # closed this day

                for hour in range(open_h, min(close_h, 24)):
                    n_reports = random.randint(*REPORTS_PER_HOUR)
                    for _ in range(n_reports):
                        minute = random.randint(0, 59)
                        second = random.randint(0, 59)
                        ts = date.replace(hour=hour, minute=minute, second=second)

                        wait = food_wait_minutes(hour, rid)
                        content = json.dumps({
                            "wait_minutes": wait,
                            "num_devices": wait,  # bug compat: hourly endpoint reads num_devices
                            "restaurant_name": RESTAURANT_NAMES[rid],
                            "restaurant_id": rid,
                            "reported_at": ts.isoformat(),
                        })
                        reports.append(Report(
                            user_id=USER_ID,
                            title="food",
                            content=content,
                            created_at=ts,
                        ))
                        count += 1

            # --- GYM REPORTS ---
            for gid in GYM_IDS:
                hours = GYM_HOURS[gid]
                open_h, close_h = hours[sqlite_weekday]
                if open_h == 0 and close_h == 0:
                    continue

                for hour in range(open_h, min(close_h, 24)):
                    n_reports = random.randint(*REPORTS_PER_HOUR)
                    for _ in range(n_reports):
                        minute = random.randint(0, 59)
                        second = random.randint(0, 59)
                        ts = date.replace(hour=hour, minute=minute, second=second)

                        cap = gym_capacity(hour, gid)
                        content = json.dumps({
                            "capacity": cap,
                            "num_devices": cap,  # bug compat: hourly endpoint reads num_devices
                            "location": gid,
                        })
                        reports.append(Report(
                            user_id=USER_ID,
                            title="gym",
                            content=content,
                            created_at=ts,
                        ))
                        count += 1

            # --- PARKING REPORTS ---
            for pid in PARKING_IDS:
                hours = PARKING_HOURS[pid]
                open_h, close_h = hours[sqlite_weekday]

                for hour in range(open_h, min(close_h + 1, 24)):
                    n_reports = random.randint(*REPORTS_PER_HOUR)
                    for _ in range(n_reports):
                        minute = random.randint(0, 59)
                        second = random.randint(0, 59)
                        ts = date.replace(hour=hour, minute=minute, second=second)

                        occ = parking_occupancy(hour)
                        content = json.dumps({
                            "num_devices": occ,
                            "capacity": occ,  # bug compat: full_day reads capacity for non-food
                            "location": pid,
                        })
                        reports.append(Report(
                            user_id=USER_ID,
                            title="parking",
                            content=content,
                            created_at=ts,
                        ))
                        count += 1

            # Bulk insert per day to keep memory manageable
            if len(reports) >= 5000:
                sqlalchemy.session.bulk_save_objects(reports)
                sqlalchemy.session.commit()
                print(f"  Inserted batch ({count} total so far) ...")
                reports = []

        # Final batch
        if reports:
            sqlalchemy.session.bulk_save_objects(reports)
            sqlalchemy.session.commit()

        print(f"Done! Inserted {count} reports total.")


if __name__ == "__main__":
    seed()
