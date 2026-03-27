# app/routes/auth.py
from flask import Blueprint, request
from ..components.authenticator import Authenticator
from ..components.statusreport import StatusCode, StatusReport

## NOTE (HALF): Blueprint is just used to modularize the routes (eg it becomes /auth/signup)
auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    status = Authenticator.signup(email, password)
    return status.json(), status.code()

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    status = Authenticator.login(email, password)
    return status.json(), status.code()

@auth_bp.route("/logout", methods=["POST"])
def logout():
    status = Authenticator.logout()
    return status.json(), status.code()

@auth_bp.route("/profile", methods=["GET"])
def me():
    status = Authenticator.profile()
    return status.json(), status.code()

