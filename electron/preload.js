const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  openMainWindow: () => ipcRenderer.send("open-main-window"),
  moveFloating: (deltaX, deltaY) => ipcRenderer.send("move-floating", { deltaX, deltaY }),
  resizeFloating: (width, height) => ipcRenderer.send("resize-floating", { width, height }),
  setPos: (x, y) => ipcRenderer.send("set-floating-pos", { x, y }),
  closePet: () => ipcRenderer.send("close-pet"),
  notifyCompanionChanged: (style) => ipcRenderer.send("companion-changed", style),
  onCompanionChanged: (callback) => {
    const handler = (_event, style) => callback(style);
    ipcRenderer.on("companion-changed", handler);
    return () => ipcRenderer.removeListener("companion-changed", handler);
  }
});
