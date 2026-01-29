import { contextBridge, ipcRenderer } from 'electron';

export interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
}

export interface Playlist {
  name: string;
  songs: Song[];
}

export interface DownloadProgress {
  current: number;
  total: number;
  songName: string;
  status: 'downloading' | 'success' | 'failed' | 'skipped';
  filename?: string;
  error?: string;
}

export interface UploadProgress {
  current: number;
  total: number;
  trackName: string;
  status: 'uploading' | 'success' | 'failed';
  error?: string;
}

export interface DependencyStatus {
  ytDlp: boolean;
  ffmpeg: boolean;
}

export interface YotoIcon {
  mediaId: string;
  title?: string;
  publicTags?: string[];
}

export interface ElectronAPI {
  // File operations
  openFileDialog: () => Promise<string | null>;
  parseCSV: (filePath: string) => Promise<Playlist>;

  // Dependency checks
  checkDependencies: () => Promise<DependencyStatus>;
  checkAuth: () => Promise<boolean>;

  // Download operations
  startDownload: (playlist: Playlist, outputDir: string) => Promise<void>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;

  // Upload operations
  startUpload: (playlistName: string, outputDir: string, songs: Song[]) => Promise<void>;
  onUploadProgress: (callback: (progress: UploadProgress) => void) => () => void;

  // Icons
  getIcons: (tag?: string) => Promise<YotoIcon[]>;

  // Utility
  getOutputDir: (playlistName: string) => Promise<string>;
}

const api: ElectronAPI = {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  parseCSV: (filePath: string) => ipcRenderer.invoke('csv:parse', filePath),

  // Dependency checks
  checkDependencies: () => ipcRenderer.invoke('deps:check'),
  checkAuth: () => ipcRenderer.invoke('auth:check'),

  // Download operations
  startDownload: (playlist: Playlist, outputDir: string) =>
    ipcRenderer.invoke('download:start', playlist, outputDir),
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: DownloadProgress) => callback(progress);
    ipcRenderer.on('download:progress', handler);
    return () => ipcRenderer.removeListener('download:progress', handler);
  },

  // Upload operations
  startUpload: (playlistName: string, outputDir: string, songs: Song[]) =>
    ipcRenderer.invoke('upload:start', playlistName, outputDir, songs),
  onUploadProgress: (callback: (progress: UploadProgress) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: UploadProgress) => callback(progress);
    ipcRenderer.on('upload:progress', handler);
    return () => ipcRenderer.removeListener('upload:progress', handler);
  },

  // Icons
  getIcons: (tag?: string) => ipcRenderer.invoke('icons:get', tag),

  // Utility
  getOutputDir: (playlistName: string) => ipcRenderer.invoke('util:getOutputDir', playlistName),
};

contextBridge.exposeInMainWorld('electronAPI', api);
