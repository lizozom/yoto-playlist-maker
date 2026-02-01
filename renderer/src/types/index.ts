// Song and Playlist types
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

// Yoto types
export interface YotoPlaylist {
  cardId: string;
  title: string;
}

// Download progress
export interface DownloadProgress {
  songIndex: number;
  totalSongs: number;
  songName: string;
  artist?: string;
  status: 'pending' | 'downloading' | 'converting' | 'complete' | 'error' | 'skipped';
  percent?: number;
  message?: string;
  error?: string;
}

// Upload progress
export interface UploadProgress {
  stage: 'init' | 'auth' | 'icons' | 'playlist' | 'uploading' | 'complete' | 'error';
  songIndex?: number;
  totalSongs?: number;
  songName?: string;
  percent?: number;
  message?: string;
  error?: string;
}

// Dependency status
export interface DependencyStatus {
  name: string;
  found: boolean;
  version?: string;
}

// Electron API type declaration
declare global {
  interface Window {
    electronAPI: {
      invoke: <T>(channel: string, data?: unknown) => Promise<T>;
      on: (channel: string, callback: (data: unknown) => void) => () => void;
      once: (channel: string, callback: (data: unknown) => void) => void;
    };
  }
}

export {};
