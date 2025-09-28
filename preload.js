const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Export/Import functionality
    exportGarden: (data) => ipcRenderer.invoke('export-garden', data),
    importGarden: () => ipcRenderer.invoke('import-garden'),
    
    // Window state
    getWindowState: () => ipcRenderer.invoke('get-window-state'),
    
    // Menu event listeners
    onMenuNewEntry: (callback) => ipcRenderer.on('menu-new-entry', callback),
    onMenuSaveEntry: (callback) => ipcRenderer.on('menu-save-entry', callback),
    onMenuReturnGarden: (callback) => ipcRenderer.on('menu-return-garden', callback),
    onMenuSelectMode: (callback) => ipcRenderer.on('menu-select-mode', callback),
    onMenuExportGarden: (callback) => ipcRenderer.on('menu-export-garden', callback),
    onMenuImportGarden: (callback) => ipcRenderer.on('menu-import-garden', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
    
    // App info
    platform: process.platform,
    version: process.versions.electron
});