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
  openFileDialog: () => Promise<string | null>;
  parseCSV: (filePath: string) => Promise<Playlist>;
  checkDependencies: () => Promise<DependencyStatus>;
  checkAuth: () => Promise<boolean>;
  startDownload: (playlist: Playlist, outputDir: string) => Promise<void>;
  onDownloadProgress: (callback: (progress: DownloadProgress) => void) => () => void;
  startUpload: (playlistName: string, outputDir: string, songs: Song[]) => Promise<void>;
  onUploadProgress: (callback: (progress: UploadProgress) => void) => () => void;
  getIcons: (tag?: string) => Promise<YotoIcon[]>;
  getOutputDir: (playlistName: string) => Promise<string>;
}
