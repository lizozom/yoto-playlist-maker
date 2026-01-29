import React, { useState, useEffect } from 'react';
import type { Playlist, DownloadProgress as DownloadProgressType } from '../types';

interface DownloadResult {
  songName: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

interface DownloadProgressProps {
  playlist: Playlist;
  outputDir: string;
  onComplete: (results: DownloadResult[]) => void;
}

function DownloadProgress({ playlist, outputDir, onComplete }: DownloadProgressProps) {
  const [currentSong, setCurrentSong] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [total, setTotal] = useState<number>(playlist.songs.length);
  const [results, setResults] = useState<DownloadResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const startDownload = async () => {
      // Subscribe to progress updates
      unsubscribe = window.electronAPI.onDownloadProgress((progressData: DownloadProgressType) => {
        setCurrentSong(progressData.songName);
        setProgress(progressData.current);
        setTotal(progressData.total);

        if (progressData.status !== 'downloading') {
          setResults(prev => {
            // Avoid duplicates (React StrictMode double-mounts in dev)
            if (prev.some(r => r.songName === progressData.songName)) {
              return prev;
            }
            return [
              ...prev,
              {
                songName: progressData.songName,
                status: progressData.status,
                error: progressData.error,
              },
            ];
          });
        }
      });

      // Start the download
      try {
        await window.electronAPI.startDownload(playlist, outputDir);
        setIsComplete(true);
      } catch (err) {
        console.error('Download failed:', err);
        setIsComplete(true);
      }
    };

    startDownload();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [playlist, outputDir]);

  useEffect(() => {
    if (isComplete && results.length >= total) {
      // Small delay to show completion state
      const timer = setTimeout(() => {
        onComplete(results);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, results, total, onComplete]);

  const successCount = results.filter(r => r.status === 'success').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Downloading Songs</h2>
        <p className="text-gray-600">
          Fetching audio from YouTube using yt-dlp
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{progress} / {total} ({percentage}%)</span>
        </div>
        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yoto-orange to-orange-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Current Download */}
      {!isComplete && currentSong && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg mb-6">
          <div className="w-6 h-6 border-2 border-yoto-orange border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-medium text-gray-800">Downloading...</p>
            <p className="text-sm text-gray-600">{currentSong}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{successCount}</div>
          <div className="text-sm text-green-600">Downloaded</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-gray-700">{skippedCount}</div>
          <div className="text-sm text-gray-600">Skipped</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{failedCount}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
      </div>

      {/* Results List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 w-12">#</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Song</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((result, idx) => (
              <tr key={idx} className="text-sm">
                <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-2 text-gray-800">{result.songName}</td>
                <td className="px-4 py-2 text-right">
                  {result.status === 'success' && (
                    <span className="text-green-600">✓ Done</span>
                  )}
                  {result.status === 'skipped' && (
                    <span className="text-gray-500">⏭ Skipped</span>
                  )}
                  {result.status === 'failed' && (
                    <span className="text-red-600" title={result.error}>✗ Failed</span>
                  )}
                </td>
              </tr>
            ))}
            {!isComplete && results.length < total && (
              <tr className="text-sm">
                <td className="px-4 py-2 text-gray-400">{results.length + 1}</td>
                <td className="px-4 py-2 text-gray-400">{currentSong || 'Waiting...'}</td>
                <td className="px-4 py-2 text-right text-gray-400">
                  <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Output Directory */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Output:</strong>{' '}
          <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{outputDir}</code>
        </p>
      </div>
    </div>
  );
}

export default DownloadProgress;
