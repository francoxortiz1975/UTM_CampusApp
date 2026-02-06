from flask import session
from .statusreport import StatusCode, StatusReport
from .user import User
from email.utils import parseaddr

class Authenticator():
    
    def signup(email, password):
        if not email or not password or not "@" in parseaddr(email)[1]:
            return StatusReport("Email and password required", StatusCode.BAD_REQUEST)

        if User.query.filter_by(email=email).first():
            return StatusReport("User already exists", StatusCode.BAD_REQUEST)
        
        user = User(email=email)
        user.set_password(password)
        user.save()

        return StatusReport({"id": user.id, "email": user.email}, StatusCode.OK)

    def login(email, password):
        if not email or not password:
            return StatusReport("Email and password required", StatusCode.BAD_REQUEST)
        
        user = User.query.filter_by(email=email).first()
        if not user or not user.check_password(password):
            return StatusReport("Invalid credentials", StatusCode.UNAUTHORIZED)
        
        session["user_id"] = user.id

        return StatusReport({"id": user.id, "email": user.email}, StatusCode.OK)
    
    def profile():
        user_id = session.get("user_id")
        user = User.query.get(user_id)

        if not user:
            return StatusReport("Not logged in", StatusCode.UNAUTHORIZED)

        return StatusReport({"id": user.id, "email": user.email}, StatusCode.OK)

    def logout():
        session.pop("user_id", None)
        return StatusReport("Logged out", StatusCode.OK)