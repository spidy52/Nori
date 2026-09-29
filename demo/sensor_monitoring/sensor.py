"""
Sensor Monitoring - TMP36 Precision Temperature Sensor Interface
Reads analog voltage from pin A0 on connected Arduino Uno.
"""

import time
import math

class TemperatureSensor:
    def __init__(self, pin: str = "A0", vref: float = 3.3, offset: float = 0.5):
        self.pin = pin
        self.vref = vref
        self.offset = offset  # 500mV offset at 0°C for TMP36
        self.scale_mv_per_c = 10.0  # 10mV / °C

    def raw_to_voltage(self, raw_adc: int) -> float:
        # 10-bit ADC: 0 to 1023
        return (raw_adc / 1023.0) * self.vref

    def voltage_to_celsius(self, voltage: float) -> float:
        # Temperature in °C = (Vout in mV - 500) / 10
        voltage_mv = voltage * 1000.0
        return (voltage_mv - (self.offset * 1000.0)) / self.scale_mv_per_c

    def read_sample(self, raw_adc: int) -> dict:
        voltage = self.raw_to_voltage(raw_adc)
        temp_c = self.voltage_to_celsius(voltage)
        return {
            "timestamp": time.time(),
            "raw_adc": raw_adc,
            "voltage": round(voltage, 4),
            "temp_celsius": round(temp_c, 2),
            "valid": -40.0 <= temp_c <= 125.0
        }

if __name__ == "__main__":
    sensor = TemperatureSensor()
    # Simulated reading of 750mV (~25°C)
    print("Initializing Sensor Reading...")
    sample = sensor.read_sample(232)
    print(f"Sample: {sample}")
