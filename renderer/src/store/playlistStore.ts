import { create } from 'zustand';
import { Song, Playlist, YotoPlaylist } from '../types';

interface PlaylistState {
  // Current working playlist
  currentPlaylist: Playlist | null;
  setCurrentPlaylist: (playlist: Playlist | null) => void;

  // Songs in current playlist (editable)
  songs: Song[];
  setSongs: (songs: Song[]) => void;
  addSong: (song: Song) => void;
  removeSong: (index: number) => void;
  updateSong: (index: number, song: Song) => void;

  // Yoto playlists from cloud
  yotoPlaylists: YotoPlaylist[];
  setYotoPlaylists: (playlists: YotoPlaylist[]) => void;

  // Output directory
  outputDir: string;
  setOutputDir: (dir: string) => void;

  // Playlist name
  playlistName: string;
  setPlaylistName: (name: string) => void;
}

export const usePlaylistStore = create<PlaylistState>((set) => ({
  currentPlaylist: null,
  setCurrentPlaylist: (playlist) => set({
    currentPlaylist: playlist,
    songs: playlist?.songs || [],
    playlistName: playlist?.name || '',
  }),

  songs: [],
  setSongs: (songs) => set({ songs }),
  addSong: (song) => set((state) => ({ songs: [...state.songs, song] })),
  removeSong: (index) => set((state) => ({
    songs: state.songs.filter((_, i) => i !== index),
  })),
  updateSong: (index, song) => set((state) => ({
    songs: state.songs.map((s, i) => (i === index ? song : s)),
  })),

  yotoPlaylists: [],
  setYotoPlaylists: (playlists) => set({ yotoPlaylists: playlists }),

  outputDir: './output',
  setOutputDir: (dir) => set({ outputDir: dir }),

  playlistName: '',
  setPlaylistName: (name) => set({ playlistName: name }),
}));
