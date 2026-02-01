import React, { useMemo, useEffect, useState } from 'react';
import type { Playlist, YotoIcon } from '../types';
import { getIconEmoji } from '../utils/iconEmojis';

interface SongListProps {
  playlist: Playlist;
  onStartDownload: () => void;
  onBack: () => void;
}

function SongList({ playlist, onStartDownload, onBack }: SongListProps) {
  const [icons, setIcons] = useState<YotoIcon[]>([]);

  // Fetch icons for display
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

  // Calculate download statistics
  const stats = useMemo(() => {
    const songsToDownload = playlist.songs.filter((s) => !s.localFilePath);
    const localSongs = playlist.songs.filter((s) => s.localFilePath);
    return {
      toDownload: songsToDownload.length,
      local: localSongs.length,
      total: playlist.songs.length,
    };
  }, [playlist.songs]);

  // Get icon display info
  const getIconDisplay = (iconId: string | undefined) => {
    if (!iconId) return null;
    const icon = icons.find((i) => i.mediaId === iconId);
    if (!icon) return { emoji: '🎵', title: 'Icon' };
    return {
      emoji: getIconEmoji(icon),
      title: icon.title || 'Icon',
    };
  };

  const allLocal = stats.local === stats.total;
  const buttonLabel = allLocal ? 'Continue to Upload' : 'Start Download';

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
            <span>{buttonLabel}</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Download Summary */}
      {stats.total > 0 && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Download Summary</h3>
          <div className="text-sm text-blue-700 space-y-1">
            {stats.toDownload > 0 && (
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-200 rounded text-xs">⬇</span>
                <span>{stats.toDownload} song{stats.toDownload !== 1 ? 's' : ''} will be downloaded from YouTube</span>
              </p>
            )}
            {stats.local > 0 && (
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 flex items-center justify-center bg-green-200 rounded text-xs">✓</span>
                <span>{stats.local} song{stats.local !== 1 ? 's' : ''} from local folder (no download needed)</span>
              </p>
            )}
            {allLocal && (
              <p className="mt-2 text-green-700 font-medium">
                All songs are from your local folder - download will be skipped!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Song Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-12">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Song Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Artist</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-32">Icon</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 w-24">Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {playlist.songs.map((song, idx) => {
              const iconDisplay = getIconDisplay(song.icon);
              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{song.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {song.artist || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {iconDisplay ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        <span>{iconDisplay.emoji}</span>
                        <span className="truncate max-w-[80px]">{iconDisplay.title}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {song.localFilePath ? (
                      <span className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs" title={song.localFilePath}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Local
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        YouTube
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Search Preview (only for songs that need downloading) */}
      {stats.toDownload > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-700 mb-2">YouTube Search Queries</h3>
          <p className="text-sm text-gray-600 mb-3">
            These queries will be used to find songs on YouTube:
          </p>
          <div className="space-y-1">
            {playlist.songs
              .filter((song) => !song.localFilePath)
              .slice(0, 5)
              .map((song, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-gray-400">{idx + 1}.</span>{' '}
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                    {song.searchQuery}
                  </code>
                </div>
              ))}
            {stats.toDownload > 5 && (
              <div className="text-sm text-gray-500">
                ... and {stats.toDownload - 5} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SongList;
