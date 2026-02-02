import { IpcMain, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { Playlist } from '../../src/csv-parser';
import { downloadSong, DownloadProgress, ProgressCallback } from '../../src/youtube-downloader';

let isDownloading = false;
let shouldCancel = false;

export function registerDownloadHandlers(
  ipcMain: IpcMain,
  getMainWindow: () => BrowserWindow | null
) {
  // Start downloading playlist
  ipcMain.handle('download:start', async (_, { playlist, outputDir }: { playlist: Playlist; outputDir: string }) => {
    if (isDownloading) {
      return { success: false, error: 'Download already in progress' };
    }

    isDownloading = true;
    shouldCancel = false;

    const mainWindow = getMainWindow();
    const playlistDir = path.join(outputDir, playlist.name.toLowerCase().replace(/\s+/g, '-'));

    // Create output directory if it doesn't exist
    if (!fs.existsSync(playlistDir)) {
      fs.mkdirSync(playlistDir, { recursive: true });
    }

    try {
      let completedCount = 0;
      let skippedCount = 0;
      let failedCount = 0;

      for (let i = 0; i < playlist.songs.length; i++) {
        if (shouldCancel) {
          mainWindow?.webContents.send('download:complete', {
            success: false,
            cancelled: true,
            completed: completedCount,
            skipped: skippedCount,
            failed: failedCount,
            total: playlist.songs.length,
          });
          break;
        }

        const song = playlist.songs[i];

        // Progress callback that forwards to renderer
        const onProgress: ProgressCallback = (progress: DownloadProgress) => {
          mainWindow?.webContents.send('download:progress', progress);
        };

        try {
          const result = await downloadSong(song.searchQuery, song.name, {
            outputDir: playlistDir,
            trackNumber: i + 1,
            artist: song.artist,
            totalTracks: playlist.songs.length,
          }, onProgress);

          if (result.skipped) {
            skippedCount++;
          } else if (result.success) {
            completedCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
          mainWindow?.webContents.send('download:progress', {
            songIndex: i + 1,
            totalSongs: playlist.songs.length,
            songName: song.name,
            artist: song.artist,
            status: 'error',
            error: error instanceof Error ? error.message : 'Download failed',
          });
        }
      }

      if (!shouldCancel) {
        mainWindow?.webContents.send('download:complete', {
          success: true,
          outputDir: playlistDir,
          completed: completedCount,
          skipped: skippedCount,
          failed: failedCount,
          total: playlist.songs.length,
        });
      }

      return { success: true, outputDir: playlistDir };
    } catch (error) {
      mainWindow?.webContents.send('download:error', {
        error: error instanceof Error ? error.message : 'Download failed',
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed',
      };
    } finally {
      isDownloading = false;
      shouldCancel = false;
    }
  });

  // Cancel download
  ipcMain.handle('download:cancel', async () => {
    if (isDownloading) {
      shouldCancel = true;
      return { success: true };
    }
    return { success: false, error: 'No download in progress' };
  });
}
