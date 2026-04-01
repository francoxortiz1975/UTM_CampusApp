class Config:
    BACKEND_URL = "http://localhost:5000/reports/scanner/"
    SEND_INTERVAL = 5  # seconds
    CONFIDENCE_THRESHOLD = 0.4
    HIGH_CONFIDENCE_THRESHOLD = 0.7
    DEBUG_MODE = False