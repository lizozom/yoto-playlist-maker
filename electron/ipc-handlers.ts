import { ipcMain, BrowserWindow } from 'electron';
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
} from '../src/yoto-uploader';

interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
}

interface Playlist {
  name: string;
  songs: Song[];
}

function checkCommand(command: string): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn('which', [command]);
    proc.on('close', (code) => resolve(code === 0));
    proc.on('error', () => resolve(false));
  });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '')
    .trim()
    .substring(0, 80);
}

export function registerIpcHandlers(mainWindow: BrowserWindow) {
  // Check dependencies (yt-dlp, ffmpeg)
  ipcMain.handle('deps:check', async () => {
    const [ytDlp, ffmpeg] = await Promise.all([
      checkCommand('yt-dlp'),
      checkCommand('ffmpeg'),
    ]);
    return { ytDlp, ffmpeg };
  });

  // Check Yoto authentication
  ipcMain.handle('auth:check', async () => {
    return await checkAuth();
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

      const searchQuery = artist ? `${artist} ${name}` : name;

      return {
        name,
        artist: artist || undefined,
        icon: icon || undefined,
        searchQuery,
      };
    });

    return {
      name: playlistName,
      songs,
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

      // Send initial progress
      mainWindow.webContents.send('download:progress', {
        current: trackNumber,
        total: songs.length,
        songName: displayName,
        status: 'downloading',
      });

      // Skip if file already exists
      if (fs.existsSync(expectedFile)) {
        mainWindow.webContents.send('download:progress', {
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

        const proc = spawn('yt-dlp', args);
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

      // Send completion progress
      mainWindow.webContents.send('download:progress', {
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

      // Send initial progress
      mainWindow.webContents.send('upload:progress', {
        current: i + 1,
        total: files.length,
        trackName: title,
        status: 'uploading',
      });

      // Get icon
      const songInfo = songs?.[i];
      let icon = songInfo?.icon ? findIconByName(allIcons, songInfo.icon) : undefined;
      if (!icon) {
        icon = getRandomIcon(musicIcons);
      }

      // Upload track
      const result = await addTrackToPlaylist(playlist.cardId, title, filePath, icon?.mediaId);

      // Send completion progress
      mainWindow.webContents.send('upload:progress', {
        current: i + 1,
        total: files.length,
        trackName: title,
        status: result.success ? 'success' : 'failed',
        error: result.error,
      });
    }
  });
}
