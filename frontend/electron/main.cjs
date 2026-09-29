const { app, BrowserWindow, Tray, Menu, ipcMain, screen } = require('electron');
const path = require('path');

let petWindow = null;
let mainWindow = null;
let tray = null;

function createPetWindow() {
  if (petWindow) {
    petWindow.show();
    return;
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  petWindow = new BrowserWindow({
    width: 340,
    height: 380,
    x: width - 360,
    y: height - 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    hasShadow: false,
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  // Load floating pet view with transparent background
  petWindow.loadURL('http://localhost:5173/?mode=pet');

  petWindow.on('closed', () => {
    petWindow = null;
  });
}

function createMainWindow() {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    return;
  }

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    backgroundColor: '#000000',
    title: 'Nori — AI Work Companion',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  mainWindow.loadURL('http://localhost:5173/');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.on('open-main-window', () => {
  createMainWindow();
});

ipcMain.on('toggle-pet', () => {
  if (!petWindow) {
    createPetWindow();
  } else if (petWindow.isVisible()) {
    petWindow.hide();
  } else {
    petWindow.show();
  }
});

ipcMain.on('companion-changed', (event, style) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    try {
      win.webContents.send('companion-changed', style);
    } catch (e) {}
  });
});

app.whenReady().then(() => {
  createPetWindow();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createPetWindow();
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
