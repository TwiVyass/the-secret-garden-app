const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Enable hot reload for development
if (process.env.NODE_ENV === 'development') {
    require('electron-reload')(__dirname);
}

class SecretGardenApp {
    constructor() {
        this.mainWindow = null;
        this.init();
    }

    init() {
        // Wait for Electron to be ready
        app.whenReady().then(() => {
            this.createWindow();
            this.createMenu();
            this.setupIPC();
        });

        // Handle app activation (macOS)
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                this.createWindow();
            }
        });

        // Quit when all windows are closed (except macOS)
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                app.quit();
            }
        });
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            minWidth: 800,
            minHeight: 600,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, 'assets', 'icon.png'), // Add your app icon
            titleBarStyle: 'hiddenInset', // macOS style
            show: false // Don't show until ready
        });

        // Load the HTML file
        this.mainWindow.loadFile('index.html');

        // Show window when ready to prevent visual flash
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Open DevTools in development
            if (process.env.NODE_ENV === 'development') {
                this.mainWindow.webContents.openDevTools();
            }
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Prevent external navigation
        this.mainWindow.webContents.on('will-navigate', (e, navigationUrl) => {
            const parsedUrl = new URL(navigationUrl);
            if (parsedUrl.origin !== 'file://') {
                e.preventDefault();
            }
        });
    }

    createMenu() {
        const template = [
            {
                label: 'File',
                submenu: [
                    {
                        label: 'New Entry',
                        accelerator: 'CmdOrCtrl+N',
                        click: () => {
                            this.mainWindow.webContents.send('menu-new-entry');
                        }
                    },
                    {
                        label: 'Save Entry',
                        accelerator: 'CmdOrCtrl+S',
                        click: () => {
                            this.mainWindow.webContents.send('menu-save-entry');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Export Garden',
                        accelerator: 'CmdOrCtrl+E',
                        click: () => {
                            this.exportGarden();
                        }
                    },
                    {
                        label: 'Import Garden',
                        click: () => {
                            this.importGarden();
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Quit',
                        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                        click: () => {
                            app.quit();
                        }
                    }
                ]
            },
            {
                label: 'Edit',
                submenu: [
                    { role: 'undo' },
                    { role: 'redo' },
                    { type: 'separator' },
                    { role: 'cut' },
                    { role: 'copy' },
                    { role: 'paste' },
                    { role: 'selectall' }
                ]
            },
            {
                label: 'View',
                submenu: [
                    { role: 'reload' },
                    { role: 'forcereload' },
                    { role: 'toggledevtools' },
                    { type: 'separator' },
                    { role: 'resetzoom' },
                    { role: 'zoomin' },
                    { role: 'zoomout' },
                    { type: 'separator' },
                    { role: 'togglefullscreen' }
                ]
            },
            {
                label: 'Garden',
                submenu: [
                    {
                        label: 'Return to Garden',
                        accelerator: 'Escape',
                        click: () => {
                            this.mainWindow.webContents.send('menu-return-garden');
                        }
                    },
                    { type: 'separator' },
                    {
                        label: 'Guided Journey',
                        accelerator: 'CmdOrCtrl+1',
                        click: () => {
                            this.mainWindow.webContents.send('menu-select-mode', 'guided');
                        }
                    },
                    {
                        label: 'Free Writing',
                        accelerator: 'CmdOrCtrl+2',
                        click: () => {
                            this.mainWindow.webContents.send('menu-select-mode', 'free');
                        }
                    },
                    {
                        label: 'Penny for Thoughts',
                        accelerator: 'CmdOrCtrl+3',
                        click: () => {
                            this.mainWindow.webContents.send('menu-select-mode', 'penny');
                        }
                    }
                ]
            },
            {
                label: 'Help',
                submenu: [
                    {
                        label: 'About Secret Garden',
                        click: () => {
                            this.showAbout();
                        }
                    },
                    {
                        label: 'How to Use',
                        click: () => {
                            this.showHelp();
                        }
                    }
                ]
            }
        ];

        // macOS specific menu adjustments
        if (process.platform === 'darwin') {
            template.unshift({
                label: app.getName(),
                submenu: [
                    { role: 'about' },
                    { type: 'separator' },
                    { role: 'services' },
                    { type: 'separator' },
                    { role: 'hide' },
                    { role: 'hideothers' },
                    { role: 'unhide' },
                    { type: 'separator' },
                    { role: 'quit' }
                ]
            });
        }

        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    setupIPC() {
        // Handle export request from renderer
        ipcMain.handle('export-garden', async (event, data) => {
            try {
                const { filePath } = await dialog.showSaveDialog(this.mainWindow, {
                    title: 'Export Your Secret Garden',
                    defaultPath: `secret-garden-backup-${new Date().toISOString().split('T')[0]}.json`,
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (filePath) {
                    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
                    return { success: true, path: filePath };
                }
                return { success: false, cancelled: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Handle import request from renderer
        ipcMain.handle('import-garden', async () => {
            try {
                const { filePaths } = await dialog.showOpenDialog(this.mainWindow, {
                    title: 'Import Your Secret Garden',
                    properties: ['openFile'],
                    filters: [
                        { name: 'JSON Files', extensions: ['json'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });

                if (filePaths && filePaths.length > 0) {
                    const data = fs.readFileSync(filePaths[0], 'utf8');
                    const parsed = JSON.parse(data);
                    return { success: true, data: parsed };
                }
                return { success: false, cancelled: true };
            } catch (error) {
                return { success: false, error: error.message };
            }
        });

        // Handle window state requests
        ipcMain.handle('get-window-state', () => {
            if (this.mainWindow) {
                return {
                    isMaximized: this.mainWindow.isMaximized(),
                    isMinimized: this.mainWindow.isMinimized(),
                    isFullScreen: this.mainWindow.isFullScreen()
                };
            }
            return null;
        });
    }

    async exportGarden() {
        this.mainWindow.webContents.send('menu-export-garden');
    }

    async importGarden() {
        this.mainWindow.webContents.send('menu-import-garden');
    }

    showAbout() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'About Secret Garden Journal',
            message: 'Secret Garden Journal',
            detail: `A beautiful, private journaling app that grows with your thoughts.

Version: 1.0.0
Made with ❤️ for mindful writing

🌸 Your thoughts are safe in your secret garden 🌸`,
            buttons: ['Close']
        });
    }

    showHelp() {
        dialog.showMessageBox(this.mainWindow, {
            type: 'info',
            title: 'How to Use Secret Garden',
            message: 'Welcome to Your Secret Garden! 🌿',
            detail: `Getting Started:
• Enter any password (3+ characters) to unlock your garden
• Choose a writing path from your garden hub
• Write your thoughts and save them to grow your garden

Writing Modes:
🌱 Guided Journey - Answer thoughtful prompts
🌿 Free Writing - Express yourself without limits  
💭 Penny for Thoughts - Flip coins for creative inspiration

Tips:
• Your garden grows flowers as you write more entries
• Use Ctrl/Cmd+S to save entries quickly
• Press Escape to return to the garden anytime
• Export your garden to backup your entries

All your entries are stored locally and privately on your device.`,
            buttons: ['Got it!']
        });
    }
}

// Create app instance
new SecretGardenApp();

// Security: Prevent new window creationn
app.on('web-contents-created', (event, contents) => {
    contents.on('new-window', (event, navigationUrl) => {
        event.preventDefault();
    });
});