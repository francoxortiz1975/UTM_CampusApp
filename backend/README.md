# SETUP
1. `cd backend`
2. (optional) Setup a virtual enviroment so installations are only for this project and not global
-> `python3 -m venv venv`
-> linux: `source venv/bin/activate` windows: `venv\Scripts\activate`
3. `pip install -r requirements.txt`

# RUNNING
1. `python3 app.py`
2. Backend is now visible via `http://localhost:5000`

# UPDATING DEPENDENCYS
1. Install any required dependencies
2. `pip freeze > requirements.txt`
