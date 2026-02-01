import React, { useState, useEffect } from 'react';
import type { Song, UploadProgress as UploadProgressType } from '../types';

interface UploadResult {
  trackName: string;
  status: 'success' | 'failed';
  error?: string;
}

interface UploadProgressProps {
  playlistName: string;
  outputDir: string;
  songs: Song[];
  onComplete: (results: UploadResult[]) => void;
  onSkip: () => void;
}

function getStatusDisplay(status: UploadResult['status'], error?: string): React.ReactNode {
  if (status === 'success') {
    return <span className="text-green-600">Done</span>;
  }
  return <span className="text-red-600" title={error}>Failed</span>;
}

const INITIAL_STATE = {
  started: false,
  currentTrack: '',
  progress: 0,
  total: 0,
  results: [] as UploadResult[],
  isComplete: false,
  error: null as string | null,
};

function UploadProgress({ playlistName, outputDir, songs, onComplete, onSkip }: UploadProgressProps) {
  const [state, setState] = useState(INITIAL_STATE);
  const { started, currentTrack, progress, total, results, isComplete, error } = state;

  function resetState(): void {
    setState(INITIAL_STATE);
  }

  async function startUpload(): Promise<void> {
    setState(prev => ({ ...prev, started: true }));

    const unsubscribe = window.electronAPI.onUploadProgress((progressData: UploadProgressType) => {
      setState(prev => {
        const newState = {
          ...prev,
          currentTrack: progressData.trackName,
          progress: progressData.current,
          total: progressData.total,
        };

        if (progressData.status !== 'uploading') {
          newState.results = [...prev.results, {
            trackName: progressData.trackName,
            status: progressData.status,
            error: progressData.error,
          }];
        }

        return newState;
      });
    });

    try {
      await window.electronAPI.startUpload(playlistName, outputDir, songs);
      setState(prev => ({ ...prev, isComplete: true }));
    } catch (err) {
      console.error('Upload failed:', err);
      setState(prev => ({
        ...prev,
        isComplete: true,
        error: err instanceof Error ? err.message : 'Upload failed',
      }));
    }

    unsubscribe?.();
  }

  useEffect(() => {
    // Only auto-advance if upload completed without fatal error and has some successes
    const hasSuccesses = results.some(r => r.status === 'success');
    if (isComplete && !error && results.length >= total && total > 0 && hasSuccesses) {
      const timer = setTimeout(() => {
        onComplete(results);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isComplete, results, total, onComplete, error]);

  const successCount = results.filter(r => r.status === 'success').length;
  const failedCount = results.filter(r => r.status === 'failed').length;
  const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

  if (!started) {
    return (
      <div className="py-8 text-center">
        <div className="text-5xl mb-4">☁️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Upload to Yoto</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Ready to upload your playlist to your Yoto account. This will create a new playlist
          called "{playlistName}" with all downloaded songs.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onSkip}
            className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Skip Upload
          </button>
          <button
            onClick={startUpload}
            className="px-6 py-2 bg-yoto-orange text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            <span>Start Upload</span>
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Uploading to Yoto</h2>
        <p className="text-gray-600">
          Creating playlist and uploading tracks to your account
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
            className="h-full bg-gradient-to-r from-yoto-blue to-teal-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Current Upload */}
      {!isComplete && currentTrack && (
        <div className="flex items-center gap-3 p-4 bg-teal-50 border border-teal-200 rounded-lg mb-6">
          <div className="w-6 h-6 border-2 border-yoto-blue border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="font-medium text-gray-800">Uploading...</p>
            <p className="text-sm text-gray-600">{currentTrack}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{successCount}</div>
          <div className="text-sm text-green-600">Uploaded</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-700">{failedCount}</div>
          <div className="text-sm text-red-600">Failed</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-500 text-xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-medium text-red-800">Upload Failed</h3>
              <p className="text-sm text-red-600 mt-1">{error}</p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={resetState}
                  className="px-4 py-1.5 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={onSkip}
                  className="px-4 py-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
                >
                  Skip Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results List */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600 w-12">#</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Track</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-600 w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((result, idx) => (
              <tr key={idx} className="text-sm">
                <td className="px-4 py-2 text-gray-500">{idx + 1}</td>
                <td className="px-4 py-2 text-gray-800">{result.trackName}</td>
                <td className="px-4 py-2 text-right">
                  {getStatusDisplay(result.status, result.error)}
                </td>
              </tr>
            ))}
            {!isComplete && results.length < total && (
              <tr className="text-sm">
                <td className="px-4 py-2 text-gray-400">{results.length + 1}</td>
                <td className="px-4 py-2 text-gray-400">{currentTrack || 'Waiting...'}</td>
                <td className="px-4 py-2 text-right text-gray-400">
                  <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Manual completion button when there are failures but also successes */}
      {isComplete && !error && successCount > 0 && failedCount > 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-3">
            {successCount} tracks uploaded, {failedCount} failed.
          </p>
          <button
            onClick={() => onComplete(results)}
            className="px-6 py-2 bg-yoto-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Continue to Done
          </button>
        </div>
      )}
    </div>
  );
}

export default UploadProgress;
