# SETUP
1. `cd scanner`
2. (optional) Setup a virtual enviroment so installations are only for this project and not global
-> `python3 -m venv venv`
-> linux: `source venv/bin/activate` windows: `venv\Scripts\activate`
3. `pip install -r requirements.txt`
4. linux: `sudo apt install bluetooth bluez` windows: Not needed

# RUNNING
1. linux: `sudo systemctl start bluetooth` windows : Not needed
2. `python3 scanner.py`

# UPDATING DEPENDENCYS
1. Install any required dependencies
2. `pip freeze > requirements.txt`
