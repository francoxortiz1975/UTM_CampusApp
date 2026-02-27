# app/__init__.py
from flask import Flask
from .config import Config
from .extensions import bcrypt, sqlalchemy
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    sqlalchemy.init_app(app)
    bcrypt.init_app(app)
    # Dev-friendly CORS so frontend works from localhost, 127.0.0.1, or LAN IP during team testing.
    CORS(app, supports_credentials=True)

    # Init the routes
    from .routes.authentication import auth_bp
    from .routes.reports import reports_bp
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(reports_bp, url_prefix="/reports")

    # Init the sql tables
    with app.app_context():
        sqlalchemy.create_all()

    return app
