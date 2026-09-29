const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openMainWindow: () => ipcRenderer.send('open-main-window'),
  togglePet: () => ipcRenderer.send('toggle-pet'),
  notifyCompanionChanged: (style) => ipcRenderer.send('companion-changed', style),
  onCompanionChanged: (callback) => {
    const handler = (_event, style) => callback(style);
    ipcRenderer.on('companion-changed', handler);
    return () => ipcRenderer.removeListener('companion-changed', handler);
  }
});
