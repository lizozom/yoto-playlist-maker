import { contextBridge, ipcRenderer } from 'electron';

// Define the API exposed to the renderer process
const electronAPI = {
  // Invoke pattern (request/response)
  invoke: <T>(channel: string, data?: unknown): Promise<T> => {
    const validChannels = [
      'playlist:import-csv',
      'playlist:list-yoto',
      'playlist:create',
      'playlist:delete',
      'download:start',
      'download:cancel',
      'upload:start',
      'upload:cancel',
      'auth:check',
      'auth:login',
      'system:check-deps',
      'dialog:openFile',
      'dialog:openDirectory',
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // Listen for events from main process (returns unsubscribe function)
  on: (channel: string, callback: (data: unknown) => void): (() => void) => {
    const validChannels = [
      'download:progress',
      'download:complete',
      'download:error',
      'upload:progress',
      'upload:complete',
      'upload:error',
      'auth:browser-opened',
    ];

    if (validChannels.includes(channel)) {
      const subscription = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    }
    throw new Error(`Invalid channel: ${channel}`);
  },

  // One-time listener
  once: (channel: string, callback: (data: unknown) => void): void => {
    const validChannels = [
      'download:progress',
      'download:complete',
      'download:error',
      'upload:progress',
      'upload:complete',
      'upload:error',
    ];

    if (validChannels.includes(channel)) {
      ipcRenderer.once(channel, (_event, data) => callback(data));
    } else {
      throw new Error(`Invalid channel: ${channel}`);
    }
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type declaration for the renderer
export type ElectronAPI = typeof electronAPI;
