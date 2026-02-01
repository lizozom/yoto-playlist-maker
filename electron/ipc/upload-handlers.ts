import { IpcMain, BrowserWindow } from 'electron';
import { uploadPlaylist, checkAuth, UploadProgress, UploadProgressCallback } from '../../src/yoto-uploader';

let isUploading = false;
let shouldCancel = false;

export interface UploadOptions {
  playlistName: string;
  outputDir: string;
  songs?: Array<{
    name: string;
    artist?: string;
    icon?: string;
  }>;
  description?: string;
}

export function registerUploadHandlers(
  ipcMain: IpcMain,
  getMainWindow: () => BrowserWindow | null
) {
  // Start uploading playlist to Yoto
  ipcMain.handle('upload:start', async (_, options: UploadOptions) => {
    if (isUploading) {
      return { success: false, error: 'Upload already in progress' };
    }

    isUploading = true;
    shouldCancel = false;

    const mainWindow = getMainWindow();

    try {
      // Check authentication first
      const isAuthenticated = await checkAuth();
      if (!isAuthenticated) {
        return {
          success: false,
          error: 'Not authenticated. Please run "npx @lizozom/yoto login" first.',
        };
      }

      // Progress callback that forwards to renderer
      const onProgress: UploadProgressCallback = (progress: UploadProgress) => {
        mainWindow?.webContents.send('upload:progress', progress);
      };

      await uploadPlaylist({
        ...options,
        onProgress,
        shouldCancel: () => shouldCancel,
      });

      try {
        mainWindow?.webContents.send('upload:complete', {
          success: true,
          playlistName: options.playlistName,
        });
      } catch (sendError) {
        console.error('Error sending upload:complete event:', sendError);
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      try {
        mainWindow?.webContents.send('upload:error', { error: errorMessage });
      } catch (sendError) {
        console.error('Error sending upload:error event:', sendError);
      }
      return { success: false, error: errorMessage };
    } finally {
      isUploading = false;
      shouldCancel = false;
    }
  });

  // Cancel upload
  ipcMain.handle('upload:cancel', async () => {
    if (isUploading) {
      shouldCancel = true;
      return { success: true };
    }
    return { success: false, error: 'No upload in progress' };
  });
}
