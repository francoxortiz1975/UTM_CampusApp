from enum import IntEnum
from flask import jsonify

class StatusCode(IntEnum):
    OK = 200
    CREATED = 201
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    CONFLICT = 409
    INTERNAL_SERVER_ERROR = 500

    def is_error(self):
        return self.value >= 400
    
class StatusReport:
    def __init__(self, status: StatusCode, message: str):

        self.status = status
        if not isinstance(message, str):
            self.message = message
        elif self.status.is_error():
            self.message = {"error": message}
        else:
            self.message = {"message": message}

    def is_error(self):
        return self.status.is_error()

    def json(self):
        return jsonify(self.message)

    def code(self):
        return self.status.value

