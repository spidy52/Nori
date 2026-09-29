"""
Sensor Calibration Script
Applies two-point linear regression calibration to correct for ADC reference drift.
Issue: Sensor readings currently fluctuate by 4-6°C due to uncalibrated analog ground plane.
"""

from sensor import TemperatureSensor

def calibrate_readings(raw_samples: list[int], gain: float = 1.024, bias: float = -1.85) -> list[float]:
    sensor = TemperatureSensor()
    calibrated_temps = []
    for raw in raw_samples:
        reading = sensor.read_sample(raw)
        raw_temp = reading["temp_celsius"]
        # Linear correction: y = gain * x + bias
        corrected_temp = (raw_temp * gain) + bias
        calibrated_temps.append(round(corrected_temp, 2))
    return calibrated_temps

if __name__ == "__main__":
    # Test sample batch from recent experiment run
    test_batch = [230, 235, 231, 240, 232, 228, 238]
    print(f"Raw calibration test: {test_batch}")
    results = calibrate_readings(test_batch)
    print(f"Calibrated temperatures (°C): {results}")
