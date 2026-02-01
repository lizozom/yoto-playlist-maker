import { ipcMain, BrowserWindow, app, dialog } from 'electron';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import {
  checkAuth,
  getIcons,
  findPlaylistByName,
  removePlaylist,
  makePlaylist,
  addTrackToPlaylist,
  getRandomIcon,
  findIconByName,
} from '../src/yoto-uploader.js';
import {
  startLogin,
  performLogout,
  getAuthStatus,
} from './auth-server.js';

// Get path to bundled binaries (works in both dev and production)
function getBinPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'bin');
  }
  const platform = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'win' : 'linux';
  return path.join(app.getAppPath(), 'resources', platform);
}

function getBinaryPath(name: string): string {
  const binDir = getBinPath();
  const ext = process.platform === 'win32' ? '.exe' : '';
  return path.join(binDir, name + ext);
}

interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
  localFilePath?: string;
  needsDownload?: boolean;
}

interface Playlist {
  name: string;
  songs: Song[];
}

function checkCommand(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    // First check for bundled binary
    const bundledPath = getBinaryPath(command);
    if (fs.existsSync(bundledPath)) {
      resolve(true);
      return;
    }

    // Fall back to system PATH (include common user bin directories)
    const userBin = path.join(process.env.HOME || '', '.local', 'bin');
    const extendedPath = `${userBin}:${process.env.PATH || ''}`;

    const proc = spawn('which', [command], {
      env: { ...process.env, PATH: extendedPath }
    });
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

// Get the command to run (bundled or system)
function getCommand(command: string): string {
  const bundledPath = getBinaryPath(command);
  if (fs.existsSync(bundledPath)) {
    return bundledPath;
  }
  return command;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '')
    .trim()
    .substring(0, 80);
}

// Parse audio filename into song metadata
function parseAudioFilename(filename: string): { name: string; artist?: string } {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(mp3|m4a|wav|opus|flac|aac)$/i, '');

  // Try pattern: "01. Artist - Song Name" or "01 - Artist - Song Name"
  const numberedPattern = /^\d+[\.\-\s]+(.*)$/;
  const match = nameWithoutExt.match(numberedPattern);
  const cleanName = match ? match[1].trim() : nameWithoutExt;

  // Try pattern: "Artist - Song Name"
  const artistSongPattern = /^(.+?)\s*[-–—]\s*(.+)$/;
  const artistMatch = cleanName.match(artistSongPattern);

  if (artistMatch) {
    return {
      artist: artistMatch[1].trim(),
      name: artistMatch[2].trim(),
    };
  }

  return { name: cleanName };
}

// Supported audio extensions
const AUDIO_EXTENSIONS = ['.mp3', '.m4a', '.wav', '.opus', '.flac', '.aac'];

function buildSearchQuery(name: string, artist?: string): string {
  return artist ? `${artist} ${name}` : name;
}

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  function sendDownloadProgress(data: {
    current: number;
    total: number;
    songName: string;
    status: 'downloading' | 'success' | 'failed' | 'skipped';
    filename?: string;
    error?: string;
  }): void {
    mainWindow.webContents.send('download:progress', data);
  }

  function sendUploadProgress(data: {
    current: number;
    total: number;
    trackName: string;
    status: 'uploading' | 'success' | 'failed';
    error?: string;
  }): void {
    mainWindow.webContents.send('upload:progress', data);
  }
  // Check dependencies (yt-dlp, ffmpeg)
  ipcMain.handle('deps:check', async () => {
    const [ytDlp, ffmpeg] = await Promise.all([
      checkCommand('yt-dlp'),
      checkCommand('ffmpeg'),
    ]);
    return { ytDlp, ffmpeg };
  });

  // Check Yoto authentication (quick check)
  ipcMain.handle('auth:check', async () => {
    return await checkAuth();
  });

  // Login to Yoto (OAuth device flow)
  ipcMain.handle('auth:login', async () => {
    const result = await startLogin((status) => {
      // Send status updates to renderer
      mainWindow.webContents.send('auth:status-update', status);
    });
    return result.success;
  });

  // Logout from Yoto
  ipcMain.handle('auth:logout', async () => {
    await performLogout();
  });

  // Get detailed auth status
  ipcMain.handle('auth:status', async () => {
    return await getAuthStatus();
  });

  // Parse CSV file
  ipcMain.handle('csv:parse', async (_event, filePath: string) => {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`CSV file not found: ${absolutePath}`);
    }

    const playlistName = path.basename(filePath, '.csv');
    const content = fs.readFileSync(absolutePath, 'utf-8');

    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Record<string, string>[];

    const songs: Song[] = records.map((record) => {
      const name = record.song_name || record.name || record.title || '';
      const artist = record.artist || '';
      const icon = record.icon || '';

      if (!name) {
        throw new Error('Each row must have a song_name, name, or title column');
      }

      return {
        name,
        artist: artist || undefined,
        icon: icon || undefined,
        searchQuery: buildSearchQuery(name, artist),
      };
    });

    return {
      name: playlistName,
      songs,
    };
  });

  // Select folder dialog
  ipcMain.handle('folder:select', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Music Folder',
    });
    return result.filePaths[0] || null;
  });

  // Scan folder for audio files
  ipcMain.handle('folder:scan', async (_event, folderPath: string) => {
    const absolutePath = path.resolve(folderPath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Folder not found: ${absolutePath}`);
    }

    const files = fs.readdirSync(absolutePath)
      .filter((f) => AUDIO_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
      .sort();

    const songs: Song[] = files.map((file) => {
      const { name, artist } = parseAudioFilename(file);
      return {
        name,
        artist,
        searchQuery: buildSearchQuery(name, artist),
        localFilePath: path.join(absolutePath, file),
        needsDownload: false,
      };
    });

    return {
      songs,
      folderPath: absolutePath,
    };
  });

  // Get output directory for a playlist
  ipcMain.handle('util:getOutputDir', async (_event, playlistName: string) => {
    return path.join(process.cwd(), 'output', playlistName);
  });

  // Get Yoto icons
  ipcMain.handle('icons:get', async (_event, tag?: string) => {
    return await getIcons(tag);
  });

  // Start download
  ipcMain.handle('download:start', async (_event, playlist: Playlist, outputDir: string) => {
    const { songs } = playlist;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const trackNumber = i + 1;
      const paddedNumber = String(trackNumber).padStart(2, '0');
      const displayName = song.artist ? `${song.artist} - ${song.name}` : song.name;
      const sanitizedName = sanitizeFilename(displayName);
      const expectedFile = path.join(outputDir, `${paddedNumber}. ${sanitizedName}.mp3`);
      const outputTemplate = path.join(outputDir, `${paddedNumber}. ${sanitizedName}.%(ext)s`);

      sendDownloadProgress({
        current: trackNumber,
        total: songs.length,
        songName: displayName,
        status: 'downloading',
      });

      // Skip if file already exists
      if (fs.existsSync(expectedFile)) {
        sendDownloadProgress({
          current: trackNumber,
          total: songs.length,
          songName: displayName,
          status: 'skipped',
          filename: path.basename(expectedFile),
        });
        continue;
      }

      // Download with yt-dlp
      const result = await new Promise<{ success: boolean; error?: string }>((resolve) => {
        const args = [
          `ytsearch1:${song.searchQuery}`,
          '--extract-audio',
          '--audio-format', 'mp3',
          '--audio-quality', '192K',
          '--output', outputTemplate,
          '--no-playlist',
          '--quiet',
          '--progress',
        ];

        // Use bundled yt-dlp if available, and add bundled ffmpeg to PATH
        const ytdlpCmd = getCommand('yt-dlp');
        const binDir = getBinPath();
        const extendedPath = `${binDir}:${process.env.PATH || ''}`;

        const proc = spawn(ytdlpCmd, args, {
          env: { ...process.env, PATH: extendedPath }
        });
        let stderr = '';

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve({ success: true });
          } else {
            resolve({ success: false, error: stderr || `yt-dlp exited with code ${code}` });
          }
        });

        proc.on('error', (err) => {
          resolve({ success: false, error: `Failed to spawn yt-dlp: ${err.message}` });
        });
      });

      sendDownloadProgress({
        current: trackNumber,
        total: songs.length,
        songName: displayName,
        status: result.success ? 'success' : 'failed',
        filename: result.success ? path.basename(expectedFile) : undefined,
        error: result.error,
      });
    }
  });

  // Start upload
  ipcMain.handle('upload:start', async (_event, playlistName: string, outputDir: string, songs: Song[]) => {
    // Get list of audio files
    const files = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.opus') || f.endsWith('.mp3'))
      .sort();

    if (files.length === 0) {
      throw new Error(`No audio files found in ${outputDir}`);
    }

    // Fetch icons
    const allIcons = await getIcons();
    const musicIcons = await getIcons('music');

    // Check for existing playlist and delete
    const existingPlaylist = await findPlaylistByName(playlistName);
    if (existingPlaylist) {
      await removePlaylist(existingPlaylist.cardId);
    }

    // Create new playlist
    const playlist = await makePlaylist(playlistName);

    // Upload each track
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(outputDir, file);
      const title = file
        .replace(/^\d+[\.\-]\s*/, '')
        .replace(/\.(opus|mp3)$/, '');

      sendUploadProgress({
        current: i + 1,
        total: files.length,
        trackName: title,
        status: 'uploading',
      });

      // Get icon - use song's specified icon or fall back to random music icon
      const songInfo = songs?.[i];
      const icon = songInfo?.icon
        ? findIconByName(allIcons, songInfo.icon) || getRandomIcon(musicIcons)
        : getRandomIcon(musicIcons);

      const result = await addTrackToPlaylist(playlist.cardId, title, filePath, icon?.mediaId);

      sendUploadProgress({
        current: i + 1,
        total: files.length,
        trackName: title,
        status: result.success ? 'success' : 'failed',
        error: result.error,
      });
    }
  });
}
