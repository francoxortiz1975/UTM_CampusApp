# UTM Campus Dashboard — Demo Guide

## Quick Start

### 1. Backend (Flask on port 5001)

```bash
cd backend
./venv/bin/python3 seed_demo_data.py   # populate DB with ~46k reports
./venv/bin/python3 app.py              # starts on http://localhost:5001
```

### 2. Frontend (Next.js on port 3000)

```bash
cd frontend
npm run dev                            # starts on http://localhost:3000
```

### 3. Scanner (optional live demo)

```bash
cd scanner
../backend/venv/bin/python3 scanner.py # sends detections → backend
```

---

## Demo Walkthrough

### Page 1 — Interactive Campus Map (`/map`)
- Click buildings to see real-time crowd levels (colour-coded)
- Hover for building names, click for detail panel
- Dark mode toggle in header

### Page 2 — Day Planner (`/planner`)
1. Upload `demo/sample_schedule.ics` (drag or click the upload area)
2. Set preferences: transport mode, meals (breakfast + lunch + snack), gym, 2h study
3. Click **Plan My Day** — schedule auto-generates with walk times, food venues, study blocks
4. **Pin a time**: click the clock on any event → set an exact time → it becomes an immovable anchor
5. **Drag to reorder**: non-pinned items can be dragged to different time slots
6. **Add custom event**: type a title, set duration, click Add — conflicts show a red popup
7. **Change venue**: use the dropdown on a food event — duration auto-updates with walk time
8. **Persist**: leave and return — the schedule is restored from localStorage

### Page 3 — Events Calendar (`/events`)
- Browse campus events by month
- Click any event card for details

### Page 4 — Event Shuffle (`/eventshuffle`)
- Tinder-style card swiping: Yes/No on random events
- Confirmed events appear in the sidebar, click for detail modal

### Page 5 — Food Wait Times (`/food`)
- Real-time wait estimates for campus food venues
- Powered by scanner crowd-level data

### Page 6 — Gym Status (`/gym`)
- Live crowd level at RAWC / Davis
- Shows operating hours

### Page 7 — Parking (`/parking`)
- Campus parking lot availability

### Page 8 — Lost & Found (`/lostandfound`)
- Report or search for lost items on campus

### Page 9 — Reports (admin) (`/reports`)
- View all scanner reports, filter by building/date

---

## Demo Calendar File

`demo/sample_schedule.ics` contains a typical UTM student schedule for April 2026:

| Course | Days | Time | Building |
|--------|------|------|----------|
| CSC301 Lecture | Wed | 10:00–12:00 | Deerfield Hall |
| CSC301 Tutorial | Fri | 2:00–3:00 | Instructional Building |
| STA256 Lecture | Tue/Thu | 9:00–10:00 | Maanjiwe nendamowinan |
| MAT224 Lecture | Mon/Wed | 1:00–2:00 | Kaneff Centre |
| CSC209 Lecture | Tue/Thu | 11:00–12:00 | CCIT |
| CSC209 Practical | Mon | 3:00–5:00 | Instructional Building |

Today (Wed Apr 1) has three classes with gaps — ideal for showing meal/study/gym scheduling.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port 5000 in use (macOS) | We use 5001 — AirPlay Receiver uses 5000 |
| Flask ModuleNotFoundError | Use `./venv/bin/python3`, not system python |
| Empty crowd data on map | Run `seed_demo_data.py` to populate DB |
| Planner shows no classes | Upload the .ics file from `demo/` folder |
