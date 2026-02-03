from flask import session
from .statusreport import StatusCode, StatusReport
from .user import User

class Authenticator():
    
    def signup(email, password):
        if not email or not password:
            return StatusReport("Email and password required", StatusCode.BAD_REQUEST)

        user = User.create_user(email, password)
        if not user:
            return StatusReport("User already exists", StatusCode.BAD_REQUEST)

        return StatusReport("User created", StatusCode.CREATED)

    def login(email, password):
        if not email or not password:
            return StatusReport("Email and password required", StatusCode.BAD_REQUEST)
        
        user = User.get_user(email, password)
        if not user:
            return StatusReport("Invalid credentials", StatusCode.UNAUTHORIZED)
        
        session["user_id"] = user.id
        return StatusReport("Login Success", StatusCode.OK)

    def logout():
        session.pop("user_id", None)
        return StatusReport("Logged out", StatusCode.OK)