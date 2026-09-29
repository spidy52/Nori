const { app, BrowserWindow, globalShortcut, ipcMain, screen, session, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

app.commandLine.appendSwitch("disable-gpu-shader-disk-cache");
app.commandLine.appendSwitch("disable-http-cache");

let floatingWindow = null;
let voiceDaemonProcess = null;

function startVoiceDaemon() {
  const rootDir = path.join(__dirname, "..");
  const scriptPath = path.join(rootDir, "backend", "voice_daemon.py");
  const venvPython = path.join(rootDir, "venv", "Scripts", "python.exe");
  const pythonCmd = fs.existsSync(venvPython) ? venvPython : "python";

  console.log("[NORI ELECTRON]: Spawning background voice daemon with", pythonCmd, "from", scriptPath);

  try {
    voiceDaemonProcess = spawn(pythonCmd, ["-u", scriptPath], {
      cwd: rootDir,
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
      stdio: ["pipe", "pipe", "pipe"],
    });

    voiceDaemonProcess.stdout?.on("data", (data) => {
      console.log("[VOICE DAEMON]:", data.toString().trim());
    });

    voiceDaemonProcess.stderr?.on("data", (data) => {
      console.error("[VOICE DAEMON ERR]:", data.toString().trim());
    });

    voiceDaemonProcess.on("exit", (code) => {
      console.log(`[VOICE DAEMON EXITED]: code ${code}`);
      voiceDaemonProcess = null;
    });
  } catch (err) {
    console.warn("[VOICE PROCESS NOTICE]:", err);
  }
}

function createFloatingOrbWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  floatingWindow = new BrowserWindow({
    width: 140,
    height: 140,
    x: width - 160,
    y: height - 180,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    resizable: false,
    show: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  floatingWindow.loadFile(path.join(__dirname, "floating.html"));
  floatingWindow.setAlwaysOnTop(true, "screen-saver");
  floatingWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  floatingWindow.once("ready-to-show", () => {
    floatingWindow.show();
    floatingWindow.setAlwaysOnTop(true, "screen-saver");
  });

  floatingWindow.on("closed", () => {
    floatingWindow = null;
  });
}

app.whenReady().then(() => {
  if (session.defaultSession) {
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === "media" || permission === "audioCapture") {
        return callback(true);
      }
      callback(true);
    });
  }

  createFloatingOrbWindow();
  startVoiceDaemon();

  // IPC Event Handlers
  ipcMain.on("resize-floating", (event, { width, height }) => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      const [currX, currY] = floatingWindow.getPosition();
      const [currW, currH] = floatingWindow.getSize();
      const right = currX + currW;
      const bottom = currY + currH;
      const newX = Math.max(10, right - width);
      const newY = Math.max(10, bottom - height);
      floatingWindow.setBounds({
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(width),
        height: Math.round(height),
      });
    }
  });

  ipcMain.on("move-floating", (event, { deltaX, deltaY }) => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      const [currX, currY] = floatingWindow.getPosition();
      floatingWindow.setPosition(Math.round(currX + deltaX), Math.round(currY + deltaY));
    }
  });

  ipcMain.on("open-main-window", () => {
    shell.openExternal("http://localhost:5173");
  });

  ipcMain.on("close-pet", () => {
    if (floatingWindow) {
      floatingWindow.hide();
    }
  });

  ipcMain.on("companion-changed", (event, style) => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      floatingWindow.webContents.send("companion-changed", style);
    }
  });

  // Global hotkey Alt+N to toggle floating orb
  globalShortcut.register("Alt+N", () => {
    if (floatingWindow) {
      if (floatingWindow.isVisible()) {
        floatingWindow.hide();
      } else {
        floatingWindow.show();
      }
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createFloatingOrbWindow();
    }
  });
});

app.on("will-quit", () => {
  if (voiceDaemonProcess) {
    voiceDaemonProcess.kill();
    voiceDaemonProcess = null;
  }
  globalShortcut.unregisterAll();
});
