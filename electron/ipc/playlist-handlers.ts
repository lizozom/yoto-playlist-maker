import { IpcMain } from 'electron';
import * as path from 'path';
import { parsePlaylistCSV, Playlist } from '../../src/csv-parser';

export function registerPlaylistHandlers(ipcMain: IpcMain) {
  // Import CSV file
  ipcMain.handle('playlist:import-csv', async (_, { filePath }: { filePath: string }) => {
    try {
      const playlist = parsePlaylistCSV(filePath);
      return { success: true, playlist };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to parse CSV'
      };
    }
  });

  // List Yoto playlists
  ipcMain.handle('playlist:list-yoto', async () => {
    try {
      const { getPlaylists } = await import('../../src/yoto-uploader');
      const playlists = await getPlaylists();
      return { success: true, playlists };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch playlists'
      };
    }
  });

  // Create a new local playlist (not uploaded yet)
  ipcMain.handle('playlist:create', async (_, { name, songs }: { name: string; songs: any[] }) => {
    const playlist: Playlist = {
      name,
      songs: songs.map(s => ({
        name: s.name,
        artist: s.artist || undefined,
        icon: s.icon || undefined,
        searchQuery: s.artist ? `${s.artist} ${s.name}` : s.name,
      })),
    };
    return { success: true, playlist };
  });

  // Delete a Yoto playlist
  ipcMain.handle('playlist:delete', async (_, { cardId }: { cardId: string }) => {
    try {
      const { removePlaylist } = await import('../../src/yoto-uploader');
      const result = await removePlaylist(cardId);
      return { success: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete playlist'
      };
    }
  });
}
