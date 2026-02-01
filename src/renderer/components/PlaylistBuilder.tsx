import React, { useState, useEffect, useCallback } from 'react';
import type { Song, Playlist, YotoIcon } from '../types';
import SongEditor from './SongEditor';

type InputMode = 'manual' | 'csv' | 'folder';

interface PlaylistBuilderProps {
  onPlaylistReady: (playlist: Playlist) => void;
  disabled?: boolean;
  initialPlaylist?: Playlist | null;
}

interface TabButtonProps {
  mode: InputMode;
  currentMode: InputMode;
  onClick: (mode: InputMode) => void;
  children: React.ReactNode;
}

function TabButton({ mode, currentMode, onClick, children }: TabButtonProps): React.ReactElement {
  const isActive = mode === currentMode;
  return (
    <button
      type="button"
      onClick={() => onClick(mode)}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        isActive
          ? 'border-yoto-orange text-yoto-orange'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

interface SongListProps {
  songs: Song[];
  icons: YotoIcon[];
  onUpdate: (index: number, song: Song) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  title?: string;
}

function SongList({ songs, icons, onUpdate, onRemove, onMoveUp, onMoveDown, title }: SongListProps): React.ReactElement | null {
  if (songs.length === 0) return null;

  return (
    <div className={title ? 'mt-6' : ''}>
      {title && (
        <h3 className="font-medium text-gray-700 mb-3">
          {title} ({songs.length})
        </h3>
      )}
      <div className="space-y-2">
        {songs.map((song, index) => (
          <SongEditor
            key={index}
            song={song}
            index={index}
            icons={icons}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            canMoveUp={index > 0}
            canMoveDown={index < songs.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function PlaylistBuilder({ onPlaylistReady, disabled, initialPlaylist }: PlaylistBuilderProps) {
  const [playlistName, setPlaylistName] = useState(initialPlaylist?.name || '');
  const [songs, setSongs] = useState<Song[]>(initialPlaylist?.songs || []);
  const [inputMode, setInputMode] = useState<InputMode>('manual');
  const [icons, setIcons] = useState<YotoIcon[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Sync state when initialPlaylist changes (e.g., navigating back from review)
  useEffect(() => {
    if (initialPlaylist) {
      setPlaylistName(initialPlaylist.name);
      setSongs(initialPlaylist.songs);
    }
  }, [initialPlaylist]);

  // Fetch icons on mount
  useEffect(() => {
    const fetchIcons = async () => {
      try {
        const allIcons = await window.electronAPI.getIcons();
        setIcons(allIcons);
      } catch (err) {
        console.error('Failed to fetch icons:', err);
      }
    };
    fetchIcons();
  }, []);

  // Create a new empty song
  const createEmptySong = (): Song => ({
    name: '',
    artist: undefined,
    icon: undefined,
    searchQuery: '',
  });

  // Add a new song
  const handleAddSong = () => {
    setSongs([...songs, createEmptySong()]);
  };

  // Update a song
  const handleUpdateSong = (index: number, song: Song) => {
    const updated = [...songs];
    updated[index] = song;
    setSongs(updated);
  };

  // Remove a song
  const handleRemoveSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  // Move song up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...songs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setSongs(updated);
  };

  // Move song down
  const handleMoveDown = (index: number) => {
    if (index === songs.length - 1) return;
    const updated = [...songs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setSongs(updated);
  };

  // Handle CSV file selection
  const handleSelectCSV = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        const playlist = await window.electronAPI.parseCSV(filePath);
        setPlaylistName(playlist.name);
        setSongs(playlist.songs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv')) {
      setError('Please drop a CSV file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const filePath = (file as any).path;
      const playlist = await window.electronAPI.parseCSV(filePath);
      setPlaylistName(playlist.name);
      setSongs(playlist.songs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

  // Handle folder selection
  const handleSelectFolder = async () => {
    if (disabled) return;
    setLoading(true);
    setError(null);

    try {
      const folderPath = await window.electronAPI.selectFolder?.();
      if (folderPath) {
        const result = await window.electronAPI.scanFolder?.(folderPath);
        if (result && result.songs.length > 0) {
          // Use folder name as playlist name if not already set
          if (!playlistName) {
            const folderName = folderPath.split('/').pop() || 'My Playlist';
            setPlaylistName(folderName);
          }
          setSongs(result.songs);
        } else {
          setError('No audio files found in the selected folder');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan folder');
    } finally {
      setLoading(false);
    }
  };

  // Check if playlist is valid
  const isValid = useCallback(() => {
    if (!playlistName.trim()) return false;
    if (songs.length === 0) return false;
    if (songs.some((s) => !s.name.trim())) return false;
    return true;
  }, [playlistName, songs]);

  // Handle continue
  const handleContinue = () => {
    if (!isValid()) return;

    // Update search queries for all songs
    const finalSongs = songs.map((song) => ({
      ...song,
      searchQuery: song.artist ? `${song.artist} ${song.name}` : song.name,
    }));

    onPlaylistReady({
      name: playlistName.trim(),
      songs: finalSongs,
    });
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Playlist</h2>
        <p className="text-gray-600">
          Add songs manually, import from CSV, or select a music folder
        </p>
      </div>

      {/* Playlist Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Playlist Name
        </label>
        <input
          type="text"
          value={playlistName}
          onChange={(e) => setPlaylistName(e.target.value)}
          placeholder="Enter playlist name..."
          className={`w-full px-4 py-3 border rounded-lg text-lg focus:outline-none focus:border-yoto-orange ${
            !playlistName.trim() && songs.length > 0 ? 'border-red-300' : 'border-gray-200'
          }`}
        />
      </div>

      {/* Input Mode Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <TabButton mode="manual" currentMode={inputMode} onClick={setInputMode}>
          Manual Entry
        </TabButton>
        <TabButton mode="csv" currentMode={inputMode} onClick={setInputMode}>
          Import CSV
        </TabButton>
        <TabButton mode="folder" currentMode={inputMode} onClick={setInputMode}>
          Import Folder
        </TabButton>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Input Mode Content */}
      {inputMode === 'manual' && (
        <div className="mb-6">
          {songs.length > 0 && (
            <div className="mb-4">
              <SongList
                songs={songs}
                icons={icons}
                onUpdate={handleUpdateSong}
                onRemove={handleRemoveSong}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleAddSong}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-yoto-orange hover:text-yoto-orange transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Song</span>
          </button>
        </div>
      )}

      {inputMode === 'csv' && (
        <div className="mb-6">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-yoto-orange'}
              ${dragOver ? 'border-yoto-orange bg-orange-50' : 'border-gray-300'}
              ${loading ? 'pointer-events-none' : ''}
            `}
            onClick={handleSelectCSV}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-yoto-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Loading playlist...</span>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📄</div>
                <p className="text-gray-700 font-medium mb-1">Drop your CSV file here</p>
                <p className="text-gray-500 text-sm">or click to browse</p>
              </>
            )}
          </div>

          {/* CSV Format Help */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-700 mb-2">CSV Format</h3>
            <code className="block bg-gray-100 p-2 rounded text-sm text-gray-700 overflow-x-auto">
              song_name,artist,icon<br />
              Twinkle Twinkle Little Star,,star<br />
              Baby Shark,Pinkfong,fish
            </code>
          </div>

          <SongList
            songs={songs}
            icons={icons}
            onUpdate={handleUpdateSong}
            onRemove={handleRemoveSong}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            title="Imported Songs"
          />
        </div>
      )}

      {inputMode === 'folder' && (
        <div className="mb-6">
          {/* Folder Selection */}
          <div
            onClick={handleSelectFolder}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-yoto-orange'}
              ${loading ? 'pointer-events-none' : ''}
              border-gray-300
            `}
          >
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-yoto-orange border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-600">Scanning folder...</span>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">📁</div>
                <p className="text-gray-700 font-medium mb-1">Select a music folder</p>
                <p className="text-gray-500 text-sm">MP3, M4A, and WAV files will be imported</p>
              </>
            )}
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
            <strong>Note:</strong> Songs imported from a folder won't need downloading - they'll be uploaded directly to Yoto.
          </div>

          <SongList
            songs={songs}
            icons={icons}
            onUpdate={handleUpdateSong}
            onRemove={handleRemoveSong}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            title="Imported Songs"
          />
        </div>
      )}

      {/* Dependency Warning */}
      {disabled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <strong>Missing dependencies:</strong> Please install yt-dlp and ffmpeg to download songs.
          <code className="block mt-2 bg-yellow-100 p-2 rounded text-sm">
            # Ubuntu/Debian<br />
            sudo apt install yt-dlp ffmpeg
          </code>
        </div>
      )}

      {/* Continue Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!isValid()}
          className={`
            px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors
            ${isValid()
              ? 'bg-yoto-orange text-white hover:bg-orange-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
        >
          <span>Continue</span>
          <span>→</span>
        </button>
      </div>

      {/* Validation Hints */}
      {!isValid() && songs.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          {!playlistName.trim() && (
            <p className="flex items-center gap-1">
              <span className="text-yellow-500">⚠</span>
              Please enter a playlist name
            </p>
          )}
          {songs.some((s) => !s.name.trim()) && (
            <p className="flex items-center gap-1">
              <span className="text-yellow-500">⚠</span>
              All songs must have a name
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaylistBuilder;
