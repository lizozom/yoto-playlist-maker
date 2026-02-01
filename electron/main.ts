import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { registerPlaylistHandlers } from './ipc/playlist-handlers';
import { registerDownloadHandlers } from './ipc/download-handlers';
import { registerUploadHandlers } from './ipc/upload-handlers';
import { registerAuthHandlers } from './ipc/auth-handlers';

let mainWindow: BrowserWindow | null = null;

// Check if running in development
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
    show: false,
  });

  mainWindow = win;

  // Show window when ready to prevent visual flash
  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    // In development, load from Vite dev server
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // In production, load the built files
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  win.on('closed', () => {
    mainWindow = null;
  });
}

// Register all IPC handlers
function registerIpcHandlers() {
  registerPlaylistHandlers(ipcMain);
  registerDownloadHandlers(ipcMain, () => mainWindow);
  registerUploadHandlers(ipcMain, () => mainWindow);
  registerAuthHandlers(ipcMain, () => mainWindow);

  // File dialog handler
  ipcMain.handle('dialog:openFile', async (_event: unknown, options: Record<string, unknown>) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result.canceled ? null : result.filePaths[0];
  });

  // Select directory handler
  ipcMain.handle('dialog:openDirectory', async (_event: unknown, options: Record<string, unknown>) => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      ...options,
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
