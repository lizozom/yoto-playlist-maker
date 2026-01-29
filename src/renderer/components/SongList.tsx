import React from 'react';
import type { Playlist } from '../types';

interface SongListProps {
  playlist: Playlist;
  onStartDownload: () => void;
  onBack: () => void;
}

function SongList({ playlist, onStartDownload, onBack }: SongListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{playlist.name}</h2>
          <p className="text-gray-600">{playlist.songs.length} songs</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onStartDownload}
            className="px-6 py-2 bg-yoto-orange text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <span>Start Download</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Song Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-12">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Song Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Artist</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-24">Icon</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {playlist.songs.map((song, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                <td className="px-4 py-3">
                  <span className="font-medium text-gray-800">{song.name}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {song.artist || <span className="text-gray-400">—</span>}
                </td>
                <td className="px-4 py-3">
                  {song.icon ? (
                    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                      {song.icon}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Search Preview */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-700 mb-2">YouTube Search Queries</h3>
        <p className="text-sm text-gray-600 mb-3">
          These queries will be used to find songs on YouTube:
        </p>
        <div className="space-y-1">
          {playlist.songs.slice(0, 5).map((song, idx) => (
            <div key={idx} className="text-sm">
              <span className="text-gray-400">{idx + 1}.</span>{' '}
              <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                {song.searchQuery}
              </code>
            </div>
          ))}
          {playlist.songs.length > 5 && (
            <div className="text-sm text-gray-500">
              ... and {playlist.songs.length - 5} more
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SongList;
