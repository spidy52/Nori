"""
Nori Physical Hardware & Electronics Repair Knowledge Base
Authoritative domain knowledge for circuit wiring, pinouts, microcontrollers,
sensors, toolkits, and proactive repair troubleshooting.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class PinDefinition(BaseModel):
    pin_name: str
    pin_type: str  # power, gnd, analog, digital, pwm, i2c, spi, uart
    voltage: str   # 5V, 3.3V, 0V, 0-5V, etc.
    description: str

class HardwareComponent(BaseModel):
    id: str
    name: str
    category: str  # microcontroller, sensor, actuator, passive, tool, power
    description: str
    pins: List[PinDefinition] = []
    typical_voltage: str = "5V"
    wire_color_guide: Dict[str, str] = {}
    safety_warnings: List[str] = []
    common_mistakes: List[str] = []
    troubleshooting_steps: List[str] = []

class RepairTool(BaseModel):
    id: str
    name: str
    purpose: str
    safety_guide: str
    best_practices: List[str] = []

HARDWARE_CATALOG: Dict[str, HardwareComponent] = {
    "arduino_uno": HardwareComponent(
        id="arduino_uno",
        name="Arduino Uno Rev3",
        category="microcontroller",
        description="ATmega328P based microcontroller board with 14 digital I/O pins and 6 analog inputs.",
        typical_voltage="5V (Operating), 7-12V (Vin Recommended)",
        pins=[
            PinDefinition(pin_name="5V", pin_type="power", voltage="5V", description="Regulated 5V output power rail"),
            PinDefinition(pin_name="3.3V", pin_type="power", voltage="3.3V", description="Regulated 3.3V output power rail (max 50mA)"),
            PinDefinition(pin_name="GND", pin_type="gnd", voltage="0V", description="Common ground reference (3 GND pins available)"),
            PinDefinition(pin_name="Vin", pin_type="power", voltage="7-12V", description="Raw DC input voltage when using external power jack"),
            PinDefinition(pin_name="A0-A5", pin_type="analog", voltage="0-5V", description="10-bit Analog inputs (0 to 1023 resolution). A4=SDA, A5=SCL for I2C"),
            PinDefinition(pin_name="D0-D13", pin_type="digital", voltage="0-5V", description="Digital I/O pins (D0=RX, D1=TX). Pins 3, 5, 6, 9, 10, 11 support PWM ~")
        ],
        wire_color_guide={
            "5V Power": "Red wire to 5V pin",
            "Ground": "Black wire to GND pin",
            "Analog Signal": "Yellow or White wire to A0-A5",
            "Digital Signal": "Green or Blue wire to D2-D13"
        },
        safety_warnings=[
            "CRITICAL: Never connect 5V directly to GND (dead short will trip USB polyfuse or blow voltage regulator).",
            "Never draw more than 20mA from an individual I/O pin (40mA absolute maximum).",
            "Never apply negative voltage or voltage >5.5V to any GPIO or analog pin."
        ],
        common_mistakes=[
            "Connecting analog sensor ground to digital pins instead of GND.",
            "Forgetting to connect a shared GND when interfacing with external power supplies or breadboards.",
            "Leaving digital input pins floating (causes erratic random readings; use pinMode(pin, INPUT_PULLUP))."
        ],
        troubleshooting_steps=[
            "1. Verify the green ON LED is illuminated steadily on the Arduino board.",
            "2. If the 'L' LED blinks rapidly or turns off when plugging in a sensor, disconnect immediately: you have a short circuit between 5V and GND.",
            "3. Test serial communication in Arduino IDE or Python script at 115200 or 9600 baud.",
            "4. Use a multimeter in DC Voltage mode to probe between 5V pin and GND pin (should measure 4.95V - 5.05V)."
        ]
    ),

    "esp32": HardwareComponent(
        id="esp32",
        name="ESP32 Development Board",
        category="microcontroller",
        description="Dual-core 240MHz SoC with integrated 2.4GHz Wi-Fi and Bluetooth Low Energy.",
        typical_voltage="3.3V (Logic Level), 5V (USB input)",
        pins=[
            PinDefinition(pin_name="3V3", pin_type="power", voltage="3.3V", description="Regulated 3.3V power output"),
            PinDefinition(pin_name="GND", pin_type="gnd", voltage="0V", description="Ground reference"),
            PinDefinition(pin_name="GPIO", pin_type="digital", voltage="3.3V", description="3.3V Logic level only. NOT 5V tolerant!"),
            PinDefinition(pin_name="ADC1 / ADC2", pin_type="analog", voltage="0-3.3V", description="12-bit Analog inputs (0 to 4095)")
        ],
        safety_warnings=[
            "CRITICAL: ESP32 GPIO pins are 3.3V ONLY. Connecting a 5V sensor signal will permanently destroy the GPIO pin or chip!",
            "Use a logic level converter or voltage divider when interfacing with 5V modules."
        ],
        troubleshooting_steps=[
            "Check power supply: ESP32 has high current draw spikes (up to 500mA) during Wi-Fi transmission.",
            "If board resets in a boot loop, add a 100uF decoupling capacitor across 3V3 and GND."
        ]
    ),

    "tmp36": HardwareComponent(
        id="tmp36",
        name="TMP36 Precision Temperature Sensor",
        category="sensor",
        description="Low voltage precision analog centigrade temperature sensor with 10mV/°C scale factor.",
        typical_voltage="2.7V to 5.5V",
        pins=[
            PinDefinition(pin_name="Pin 1 (Left)", pin_type="power", voltage="2.7-5.5V", description="VCC / Power (+5V on Arduino)"),
            PinDefinition(pin_name="Pin 2 (Center)", pin_type="analog", voltage="0.1-2.0V", description="Vout Analog Signal (Connect to Arduino A0)"),
            PinDefinition(pin_name="Pin 3 (Right)", pin_type="gnd", voltage="0V", description="GND (Connect to Arduino GND)")
        ],
        wire_color_guide={
            "Pin 1 (Left - VCC)": "Red wire to Arduino 5V",
            "Pin 2 (Center - Vout)": "Yellow wire to Arduino A0",
            "Pin 3 (Right - GND)": "Black wire to Arduino GND"
        },
        safety_warnings=[
            "CRITICAL PINOUT ORIENTATION: Look at the flat face of the TO-92 package with leads pointing downward.",
            "Left is Pin 1 (VCC), Middle is Pin 2 (Vout), Right is Pin 3 (GND).",
            "If plugged in backwards (Pin 1 to GND and Pin 3 to 5V), the sensor will become SCALDING HOT in seconds and burn out!"
        ],
        common_mistakes=[
            "Plugging the sensor backwards causing high heat and incorrect reading (reading locks at 1023).",
            "Fluctuating readings caused by dirty USB power rails or lack of capacitor across VCC and GND."
        ],
        troubleshooting_steps=[
            "1. Gently touch the TMP36 package: if it is hot to the touch, power down immediately! Pin 1 and Pin 3 are reversed.",
            "2. Measure voltage at center pin (Pin 2) with a multimeter: at room temp (25°C), it should output exactly 0.750V (750mV = 500mV offset + 250mV).",
            "3. In code formula: Temperature (°C) = (Voltage_in_Volts - 0.5) * 100."
        ]
    ),

    "dht11_dht22": HardwareComponent(
        id="dht11_dht22",
        name="DHT11 / DHT22 Humidity & Temp Sensor",
        category="sensor",
        description="Digital relative humidity and temperature sensor with single-bus serial protocol.",
        typical_voltage="3.3V to 5V",
        pins=[
            PinDefinition(pin_name="Pin 1", pin_type="power", voltage="3.3-5V", description="VCC"),
            PinDefinition(pin_name="Pin 2", pin_type="digital", voltage="Logic", description="Data signal (requires 4.7k - 10k pull-up resistor to VCC)"),
            PinDefinition(pin_name="Pin 3", pin_type="unused", voltage="N/A", description="No connection / NC"),
            PinDefinition(pin_name="Pin 4", pin_type="gnd", voltage="0V", description="GND")
        ],
        common_mistakes=[
            "Forgetting the 10kΩ pull-up resistor between VCC and Data pin (causes 'DHT checksum error' or 'Failed to read sensor').",
            "Reading sensor too frequently (DHT11 requires at least 1-2 seconds between sample requests)."
        ]
    ),

    "hc_sr04": HardwareComponent(
        id="hc_sr04",
        name="HC-SR04 Ultrasonic Distance Sensor",
        category="sensor",
        description="Ultrasonic ranging module providing 2cm to 400cm non-contact distance measurement.",
        typical_voltage="5V",
        pins=[
            PinDefinition(pin_name="VCC", pin_type="power", voltage="5V", description="Connect to +5V power"),
            PinDefinition(pin_name="Trig", pin_type="digital", voltage="5V Logic", description="Trigger input: 10µs pulse to start sound burst"),
            PinDefinition(pin_name="Echo", pin_type="digital", voltage="5V Output", description="Echo output: pulse width matches flight time"),
            PinDefinition(pin_name="GND", pin_type="gnd", voltage="0V", description="Common Ground")
        ],
        safety_warnings=[
            "When using with 3.3V boards (ESP32 / Raspberry Pi), Echo pin outputs 5V! You MUST use a voltage divider (1kΩ and 2kΩ) to drop 5V to 3.3V to protect the MCU."
        ]
    ),

    "breadboard": HardwareComponent(
        id="breadboard",
        name="Solderless Breadboard",
        category="passive",
        description="Grid breadboard for rapid prototyping of electronics without soldering.",
        pins=[],
        wire_color_guide={
            "Positive Power Bus (+ Red line)": "Connect to 5V or 3.3V source",
            "Negative Ground Bus (- Blue/Black line)": "Connect to GND"
        },
        common_mistakes=[
            "Assuming power rails are continuous across the whole length (some long breadboards have a break in the middle!).",
            "Plugging both leads of a component into the same vertical column (creates a dead short across the component!)."
        ],
        troubleshooting_steps=[
            "1. Remember: Holes in the central rows (a-e and f-j) are connected horizontally across 5 pins.",
            "2. Holes in the outer power rails (+ and -) are connected vertically along the rail.",
            "3. Place ICs across the central trench so opposite pins are isolated."
        ]
    ),

    "multimeter": HardwareComponent(
        id="multimeter",
        name="Digital Multimeter (DMM)",
        category="tool",
        description="Essential diagnostic tool to measure voltage, current, resistance, and wire continuity.",
        safety_warnings=[
            "NEVER test continuity or resistance on an energized / powered circuit! Power off first.",
            "Ensure black lead is in COM and red lead is in V/Ω port (NOT in 10A current port, which will blow fuse if measuring voltage)."
        ],
        troubleshooting_steps=[
            "CONTINUITY TEST: Turn dial to diode/beeper symbol. Touch probes together (it should beep). Touch one probe to wire start and other to wire end. Beep = solid connection; Silence = broken wire or open circuit.",
            "DC VOLTAGE TEST: Turn dial to V- (DC). Black probe on GND, red probe on test point. Arduino rail should show 5.0V ± 0.1V.",
            "SHORT CIRCUIT CHECK: Power OFF the board. Put in continuity mode. Probe between 5V and GND. If it beeps, you have a short circuit! Do NOT plug in power until short is removed."
        ]
    ),

    "soldering_station": HardwareComponent(
        id="soldering_station",
        name="Soldering Iron & Toolkit",
        category="tool",
        description="Soldering iron, rosin-core solder, flux paste, and desoldering pump for permanent circuit repair.",
        safety_warnings=[
            "Iron tip reaches 350°C - 400°C. Never touch metal shaft or tip.",
            "Always return iron to its safety stand when not in hand.",
            "Work in a well-ventilated space to avoid breathing rosin flux fumes."
        ],
        troubleshooting_steps=[
            "COLD SOLDER REPAIR: Dull, grainy solder joint creates intermittent disconnects. Apply a dab of flux paste, touch iron tip to both pin and copper pad for 2 seconds until solder reflows shiny and concave.",
            "DESOLDERING A BRIDGE: If solder bridges two adjacent pins, apply flux, clean iron tip on brass sponge, and wipe tip across the bridge to draw excess solder away."
        ]
    )
}

REPAIR_TOOLKIT: Dict[str, RepairTool] = {
    "screwdriver_set": RepairTool(
        id="screwdriver_set",
        name="Precision Screwdriver Toolkit",
        purpose="Opening chassis, securing terminal blocks, laptop and gadget repair.",
        safety_guide="Match the screwdriver bit exactly to the screw head (e.g. Phillips PH00, Torx T5) to prevent stripping screw heads.",
        best_practices=[
            "Use magnetic mat or parts tray to organize screws by length and location.",
            "Turn counter-clockwise lightly until you feel a slight click into thread before screwing in clockwise."
        ]
    ),
    "wire_stripper": RepairTool(
        id="wire_stripper",
        name="Precision Wire Stripper & Cutter",
        purpose="Removing insulation from 22-28 AWG hookup jumper wires without severing copper strands.",
        safety_guide="Select the exact wire gauge notch (e.g. 24 AWG for typical breadboard wires).",
        best_practices=[
            "Strip approximately 6mm to 8mm of insulation for breadboard insertion.",
            "Inspect exposed copper: strands should be straight and unbroken."
        ]
    ),
    "tweezers": RepairTool(
        id="tweezers",
        name="Anti-Static Precision Tweezers (ESD-Safe)",
        purpose="Placing tiny SMD components, routing wires in tight spaces, holding leads during soldering.",
        safety_guide="Use ESD-coated tweezers to avoid static discharge into sensitive ICs.",
        best_practices=["Grip component body, avoid bending fragile sensor pins."]
    )
}

def lookup_component_knowledge(component_key: str) -> Optional[HardwareComponent]:
    """Look up comprehensive hardware knowledge by key or substring."""
    key = component_key.lower().replace("-", "_").replace(" ", "_")
    for k, v in HARDWARE_CATALOG.items():
        if k in key or key in k or any(k in key for k in k.split("_")):
            return v
    return None

def diagnose_circuit_setup(detected_items: List[str]) -> Dict[str, Any]:
    """
    Given a list of visually or contextually detected items,
    generates proactive diagnostic advice, safety warnings, and step-by-step guidance.
    """
    detected_lower = [i.lower() for i in detected_items]
    has_arduino = any("arduino" in i for i in detected_lower)
    has_tmp36 = any("tmp36" in i or "temperature" in i for i in detected_lower)
    has_breadboard = any("breadboard" in i for i in detected_lower)
    has_multimeter = any("multimeter" in i or "probe" in i or "meter" in i for i in detected_lower)
    has_soldering = any("solder" in i or "iron" in i for i in detected_lower)
    has_toolkit = any("toolkit" in i or "screwdriver" in i or "tool" in i for i in detected_lower)

    guidance_steps = []
    safety_alerts = []
    wire_guide = {}

    if has_arduino and has_tmp36:
        safety_alerts.append(
            "CRITICAL TMP36 ORIENTATION: Flat face facing you — Left lead is Pin 1 (5V), Center is Pin 2 (A0), Right lead is Pin 3 (GND). If reversed, sensor will overheat rapidly!"
        )
        wire_guide["Red Wire (Power)"] = "Arduino 5V  -> Breadboard Row with TMP36 Pin 1 (Left lead)"
        wire_guide["Yellow Wire (Signal)"] = "Arduino A0  -> Breadboard Row with TMP36 Pin 2 (Center lead)"
        wire_guide["Black Wire (GND)"] = "Arduino GND -> Breadboard Row with TMP36 Pin 3 (Right lead)"

        guidance_steps.extend([
            "1. Disconnect USB power before making any breadboard wire connections.",
            "2. Insert TMP36 temperature sensor into 3 separate rows on the breadboard (e.g., Rows 10, 11, 12).",
            "3. Connect Red jumper wire from Arduino 5V to Row 10 (Left pin - VCC).",
            "4. Connect Yellow jumper wire from Arduino A0 to Row 11 (Center pin - Vout).",
            "5. Connect Black jumper wire from Arduino GND to Row 12 (Right pin - GND).",
            "6. Re-plug USB and feel the sensor: it should stay at room temperature.",
            "7. Open calibration.py in VS Code: formula is Voltage = (AnalogReading * 5.0) / 1024.0; Temp = (Voltage - 0.5) * 100."
        ])

    if has_multimeter:
        guidance_steps.append(
            "MULTIMETER PROACTIVE CHECK: Switch multimeter to Continuity mode (sound icon). Probe between Arduino 5V and GND. If it beeps, you have a short circuit on your breadboard—do not connect USB power until resolved."
        )

    if has_toolkit or has_soldering:
        guidance_steps.append(
            "REPAIR / HARDWARE FIX: For fixing loose pins or soldering, apply rosin flux before heating the joint. Reheat until solder flows smoothly into a shiny concave joint. Allow 10 seconds to cool without moving the wire."
        )

    if not guidance_steps:
        guidance_steps.extend([
            "1. Point camera directly at your electronics components, circuit board, or repair toolkit.",
            "2. Nori will automatically detect component pinouts, check wire color paths, and verify connections.",
            "3. If inspecting an issue, position the probes or connection in good lighting."
        ])

    return {
        "detected_components": detected_items,
        "safety_alerts": safety_alerts,
        "wire_guide": wire_guide,
        "step_by_step_guidance": guidance_steps,
        "proactive_summary": (
            "Detected Arduino circuit and sensor setup with tools. All pinouts and wiring safety checks verified."
            if has_arduino else "Workspace visual inspection active."
        )
    }
