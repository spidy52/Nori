"""
Nori Windows Desktop Floating Companion Pet
A lightweight, transparent, always-on-top floating pet widget for the Windows OS desktop.
Floats over all windows and communicates with the Nori backend via WebSockets.
"""

import sys
import json
import time
import math
import threading
import tkinter as tk
from tkinter import ttk
import urllib.request

class FloatingPetApp:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Nori Desktop Companion")
        self.root.overrideredirect(True)      # Borderless window
        self.root.wm_attributes("-topmost", True)  # Always on top of all windows
        
        # Transparent background setup on Windows
        self.bg_color = "#07090e"
        self.transparent_key = "#000001"
        try:
            self.root.wm_attributes("-transparentcolor", self.transparent_key)
        except Exception:
            pass

        # Position at bottom-right corner above taskbar
        screen_w = self.root.winfo_screenwidth()
        screen_h = self.root.winfo_screenheight()
        win_w, win_h = 240, 260
        pos_x = screen_w - win_w - 40
        pos_y = screen_h - win_h - 60
        self.root.geometry(f"{win_w}x{win_h}+{pos_x}+{pos_y}")

        # State
        self.mood = "friendly"
        self.thought_text = "Nori is active and observing."
        self.battery_pct = 100
        self.anim_tick = 0.0
        self.is_dragging = False
        self.drag_x = 0
        self.drag_y = 0

        # Canvas for custom rendering
        self.canvas = tk.Canvas(
            self.root,
            width=win_w,
            height=win_h,
            bg=self.transparent_key,
            highlightthickness=0
        )
        self.canvas.pack(fill="both", expand=True)

        # Mouse Dragging Events
        self.canvas.bind("<Button-1>", self.start_drag)
        self.canvas.bind("<B1-Motion>", self.do_drag)
        self.canvas.bind("<Button-3>", self.show_context_menu)
        self.canvas.bind("<Double-Button-1>", self.on_double_click)

        # Context Menu
        self.menu = tk.Menu(self.root, tearoff=0, bg="#121522", fg="#f1f5f9", activebackground="#fa5438")
        self.menu.add_command(label="⚡ Ask Nori (Open App)", command=self.open_app)
        self.menu.add_command(label="🔄 Refresh Status", command=self.fetch_telemetry)
        self.menu.add_separator()
        self.menu.add_command(label="❌ Hide Floating Pet", command=self.root.destroy)

        # Start animation loop and background worker
        self.animate()
        self.start_backend_polling()

    def start_drag(self, event):
        self.is_dragging = True
        self.drag_x = event.x
        self.drag_y = event.y

    def do_drag(self, event):
        if self.is_dragging:
            x = self.root.winfo_x() + (event.x - self.drag_x)
            y = self.root.winfo_y() + (event.y - self.drag_y)
            self.root.geometry(f"+{x}+{y}")

    def show_context_menu(self, event):
        self.menu.post(event.x_root, event.y_root)

    def on_double_click(self, event):
        self.open_app()

    def open_app(self):
        import webbrowser
        webbrowser.open("http://localhost:5173")

    def fetch_telemetry(self):
        try:
            req = urllib.request.Request("http://127.0.0.1:8000/api/telemetry")
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                data = json.loads(resp.read().decode())
                self.battery_pct = data.get("battery_percent", 100) or 100
        except Exception:
            pass

    def start_backend_polling(self):
        def worker():
            while True:
                self.fetch_telemetry()
                time.sleep(4)
        t = threading.Thread(target=worker, daemon=True)
        t.start()

    def animate(self):
        self.anim_tick += 0.08
        self.canvas.delete("all")

        cx, cy = 120, 160
        r = 38 + math.sin(self.anim_tick) * 3

        # Draw Glow Rings
        for i in range(3, 0, -1):
            gr = r + i * 8 + math.sin(self.anim_tick * 1.5 + i) * 4
            self.canvas.create_oval(
                cx - gr, cy - gr, cx + gr, cy + gr,
                outline="#fa5438",
                width=1
            )

        # Draw Glowing Core Orb
        self.canvas.create_oval(
            cx - r, cy - r, cx + r, cy + r,
            fill="#fa5438",
            outline="#fb923c",
            width=2
        )

        # Draw Cyber Eyes / Expression
        eye_y = cy - 4
        eye_offset = 12
        blink = math.sin(self.anim_tick * 0.7) > 0.95
        eye_h = 2 if blink else 6

        self.canvas.create_oval(
            cx - eye_offset - 4, eye_y - eye_h, cx - eye_offset + 4, eye_y + eye_h,
            fill="#ffffff", outline=""
        )
        self.canvas.create_oval(
            cx + eye_offset - 4, eye_y - eye_h, cx + eye_offset + 4, eye_y + eye_h,
            fill="#ffffff", outline=""
        )

        # Status Tag Pill Above Orb
        self.canvas.create_rectangle(
            cx - 50, cy - r - 24, cx + 50, cy - r - 6,
            fill="#121522",
            outline="#fa5438",
            width=1
        )
        self.canvas.create_text(
            cx, cy - r - 15,
            text="NORI AI • LIVE",
            fill="#fb923c",
            font=("Segoe UI", 7, "bold")
        )

        # Next Frame (~30 FPS)
        self.root.after(33, self.animate)

    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = FloatingPetApp()
    app.run()
