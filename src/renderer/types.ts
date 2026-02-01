export interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
  localFilePath?: string;  // For imported files from local folder
  needsDownload?: boolean; // Calculated before download step
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

export interface FolderScanResult {
  songs: Song[];
  folderPath: string;
}

export interface AuthStatus {
  authenticated: boolean;
  username?: string;
  error?: string;
}

export interface ElectronAPI {
  // File operations
  openFileDialog: () => Promise<string | null>;
  parseCSV: (filePath: string) => Promise<Playlist>;

  // Folder operations
  selectFolder: () => Promise<string | null>;
  scanFolder: (folderPath: string) => Promise<FolderScanResult>;

  // Dependency checks
  checkDependencies: () => Promise<DependencyStatus>;
  checkAuth: () => Promise<boolean>;

  // Authentication
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  getAuthStatus: () => Promise<AuthStatus>;

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
