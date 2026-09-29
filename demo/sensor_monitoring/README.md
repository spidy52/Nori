# Sensor Monitoring Project

## Overview
A thermal telemetry testbed reading analog signals from an Analog Devices TMP36 temperature sensor via an Arduino Uno connected over USB serial.

## Current State
- **Active Task**: Sensor calibration & analog noise suppression.
- **Unresolved Issue**: Sensor readings fluctuate by 4–6°C during high CPU workload due to USB ground loop noise.
- **Hardware**: Arduino Uno Rev3 + TMP36 Analog Temperature Sensor + Breadboard setup.
- **Files**:
  - `sensor.py`: Core ADC-to-Celsius conversion.
  - `calibration.py`: Two-point regression gain/bias correction.
  - `experiment.py`: Background telemetry logging loop.
  - `TMP36_Datasheet.pdf`: Analog Devices TMP36 voltage scale specification (10mV/°C, 500mV offset at 0°C).
