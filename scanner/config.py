class Config:
    BACKEND_URL = "http://localhost:5000/scan"
    TX_POWER = -59                 # Typical BLE Tx power at 1 meter
    PATH_LOSS_EXPONENT = 3.0       # Indoor environment
    STATIC_DEVICE_THRESHOLD = 600  # 10 minutes
    DEVICE_SMOOTHING = 5           # rolling average samples