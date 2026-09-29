"""
Continuous Experiment Runner for Sensor Monitoring
Simulates continuous sampling, computer vision monitoring of hardware setup, and CSV logging.
"""

import csv
import time
from sensor import TemperatureSensor
from calibration import calibrate_readings

def run_experiment(duration_seconds: int = 10, interval: float = 1.0):
    sensor = TemperatureSensor()
    print("Starting experiment run...")
    with open("results.csv", "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["timestamp", "raw_adc", "voltage_v", "raw_temp_c", "calibrated_temp_c"])
        
        # Simulated run
        for i in range(5):
            raw = 232 + (i % 3)
            reading = sensor.read_sample(raw)
            calibrated = calibrate_readings([raw])[0]
            writer.writerow([time.time(), raw, reading["voltage"], reading["temp_celsius"], calibrated])
            print(f"Logged: raw={raw}, raw_temp={reading['temp_celsius']}°C, cal={calibrated}°C")
            time.sleep(0.1)

if __name__ == "__main__":
    run_experiment()
