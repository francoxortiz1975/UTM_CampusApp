class Config:
    SECRET_KEY = "super-secret-key"
    SESSION_COOKIE_HTTPONLY=True
    SESSION_COOKIE_SAMESITE="Lax"
    SESSION_COOKIE_SECURE=False  # Set this to True then deploying
    SQLALCHEMY_TRACK_MODIFICATIONS = False # NOTE (HALF): For now don't save database changes
    SQLALCHEMY_DATABASE_URI = "sqlite:///database.db"