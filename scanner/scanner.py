import asyncio
import requests
import time
import math
import argparse
from bleak import BleakScanner
from datetime import datetime
from collections import defaultdict, deque
from config import Config

def rssi_from_range(range):
    return Config.TX_POWER - (10 * Config.PATH_LOSS_EXPONENT * math.log10(range))

def send_data(args, num_devices):
    payload = {
        "id": args.id,
        "timestamp": datetime.utcnow().isoformat(),
        "category": args.category,
        "num_devices": num_devices,
    }

    print(payload)

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

    scanner = BleakScanner()
    await scanner.start()

    print("Scanner started...")

    while True:
        # Get current time
        now = time.time()

        # Get current devices
        devices = scanner.discovered_devices

        for d in devices:
            if d.rssi is not None:

                # Get the average rssi for this device since it is inconsistent
                device_rssi[d.address].append(d.rssi)
                avg_rssi = sum(device_rssi[d.address]) / len(device_rssi[d.address])

                # Check if the device is close enough using the rssi as an approx
                if avg_rssi >= rssi_thresh:
                    # Cache the devices latest view time and first veiw time
                    cached_devices[d.address] = now
                    if d.address not in device_first_seen:
                        device_first_seen[d.address] = now

        # Clean up old cached devices
        for addr, last_seen in cached_devices.items():
            if now - last_seen > device_timeout:
                cached_devices.pop(addr)
                device_rssi.pop(addr, None)
                device_first_seen.pop(addr, None)

        # Count num devices
        num_devices = 0
        for addr in cached_devices:
            # Ignore devices that have been seen for a long time to filter out non phone devices
            if now - device_first_seen.get(addr, now) < Config.STATIC_DEVICE_THRESHOLD:
                num_devices += 1

        # Smooth number of devices
        occupancy_history.append(num_devices)
        num_devices_smoothed = int(sum(occupancy_history) / len(occupancy_history))

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