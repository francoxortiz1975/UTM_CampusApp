# app/__init__.py
from flask import Flask
from .config import Config
from .extensions import bcrypt
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    bcrypt.init_app(app)
    CORS(app, origins="http://localhost:5000")  # simple, inline

    return app
