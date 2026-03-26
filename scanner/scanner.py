import asyncio
import requests
import math
import argparse
import time
from collections import defaultdict, deque
from bleak import BleakScanner
from datetime import datetime
from config import Config

BACKEND_URL = 'http://127.0.0.1:5000/reports/bluetoothscanner/'

def rssi_from_range(range_m):
    """Estimate RSSI threshold from range in meters"""
    return Config.TX_POWER - (10 * Config.PATH_LOSS_EXPONENT * math.log10(range_m))

def send_data(args, num_devices):
    payload = {
        "id": args.id,
        "title": args.category,
        "num_devices": num_devices,
        "timestamp": datetime.utcnow().isoformat()
    }
    print("SENDING PAYLOAD: ", payload)
    try:
        requests.post(BACKEND_URL, json=payload, timeout=5)
    except Exception as e:
        print("Backend error:", e)

async def scan_loop(args):
    rssi_thresh = rssi_from_range(args.range)
    device_timeout = max(10, args.interval * 2)

    cached_devices = {}                    # address -> last_seen
    device_first_seen = {}                 # address -> first_seen
    device_rssi = defaultdict(lambda: deque(maxlen=3))
    occupancy_history = deque(maxlen=Config.DEVICE_SMOOTHING)

    print("Scanner initializing...")

    # --- Callback to capture devices with RSSI ---
    def detection_callback(device, advertisement_data):
        now = time.time()
        rssi = getattr(advertisement_data, "rssi", None)
        if rssi is None:
            return  # skip if no RSSI

        # Smooth RSSI readings
        device_rssi[device.address].append(rssi)
        avg_rssi = sum(device_rssi[device.address]) / len(device_rssi[device.address])

        print("FOUND DEVICE: ", device.name, device.address, rssi, avg_rssi, rssi_thresh)

        # Only consider devices close enough
        if avg_rssi >= rssi_thresh:
            cached_devices[device.address] = now
            if device.address not in device_first_seen:
                device_first_seen[device.address] = now

    scanner = BleakScanner(detection_callback)
    await scanner.start()
    print("Scanner started...")

    while True:
        now = time.time()

        # Remove devices that timed out
        for addr in list(cached_devices.keys()):
            if now - cached_devices[addr] > device_timeout:
                cached_devices.pop(addr)
                device_rssi.pop(addr, None)
                device_first_seen.pop(addr, None)

        # Count “active” devices (ignore long-static devices)
        num_devices = sum(
            1 for addr in cached_devices
            if now - device_first_seen.get(addr, now) < Config.STATIC_DEVICE_THRESHOLD
        )

        # Smooth occupancy
        occupancy_history.append(num_devices)
        num_devices_smoothed = int(sum(occupancy_history) / len(occupancy_history))

        # Send to backend
        send_data(args, num_devices_smoothed)

        await asyncio.sleep(args.interval)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bluetooth proximity scanner")
    parser.add_argument("--category", type=str, required=True,
                        help="What to categorize the data as")
    parser.add_argument("--range", type=float, default=8,
                        help="Detection range in meters (default: 8)")
    parser.add_argument("--interval", type=int, default=5,
                        help="Scan interval in seconds (default: 5)")
    parser.add_argument("--id", type=int, default=0,
                        help="The id to cache the data under (default: 0)")

    asyncio.run(scan_loop(parser.parse_args()))