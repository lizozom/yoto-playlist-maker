import React, { useState } from 'react';
import type { Playlist } from '../types';

interface PlaylistImportProps {
  onPlaylistImported: (playlist: Playlist) => void;
  disabled?: boolean;
}

function PlaylistImport({ onPlaylistImported, disabled }: PlaylistImportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleSelectFile = async () => {
    if (disabled) return;

    setLoading(true);
    setError(null);

    try {
      const filePath = await window.electronAPI.openFileDialog();
      if (filePath) {
        const playlist = await window.electronAPI.parseCSV(filePath);
        onPlaylistImported(playlist);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

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
      // Note: In Electron, we can access the file path directly
      const filePath = (file as any).path;
      const playlist = await window.electronAPI.parseCSV(filePath);
      onPlaylistImported(playlist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Import Playlist</h2>
        <p className="text-gray-600">
          Select a CSV file with your song list to get started
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-12 text-center transition-all
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-yoto-orange'}
          ${dragOver ? 'border-yoto-orange bg-orange-50' : 'border-gray-300'}
          ${loading ? 'pointer-events-none' : ''}
        `}
        onClick={handleSelectFile}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-yoto-orange border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-600">Loading playlist...</span>
          </div>
        ) : (
          <>
            <div className="text-5xl mb-4">📄</div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop your CSV file here
            </p>
            <p className="text-gray-500 mb-4">or click to browse</p>
            <button
              type="button"
              disabled={disabled}
              className="px-6 py-2 bg-yoto-orange text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select CSV File
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* CSV Format Help */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">CSV Format</h3>
        <p className="text-sm text-gray-600 mb-3">
          Your CSV file should have these columns:
        </p>
        <code className="block bg-gray-100 p-3 rounded text-sm text-gray-700 overflow-x-auto">
          song_name,artist,icon<br />
          Twinkle Twinkle Little Star,,star<br />
          The Wheels on the Bus,Super Simple Songs,<br />
          Baby Shark,Pinkfong,fish
        </code>
        <p className="text-xs text-gray-500 mt-2">
          <strong>song_name</strong> is required. <strong>artist</strong> and <strong>icon</strong> are optional.
        </p>
      </div>

      {disabled && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
          <strong>Missing dependencies:</strong> Please install yt-dlp and ffmpeg to use this app.
          <code className="block mt-2 bg-yellow-100 p-2 rounded text-sm">
            # Ubuntu/Debian<br />
            sudo apt install yt-dlp ffmpeg<br /><br />
            # macOS<br />
            brew install yt-dlp ffmpeg
          </code>
        </div>
      )}
    </div>
  );
}

export default PlaylistImport;
