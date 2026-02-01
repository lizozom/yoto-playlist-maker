import { useDownload } from '../../hooks';
import { usePlaylistStore, useProgressStore } from '../../store';
import { Download, X, CheckCircle, AlertCircle, Clock, FolderOpen } from 'lucide-react';
import { useIpcInvoke } from '../../hooks';

export function DownloadProgress() {
  const invoke = useIpcInvoke();
  const { songs, playlistName, outputDir, setOutputDir } = usePlaylistStore();
  const { error, setError } = useProgressStore();
  const {
    isDownloading,
    downloadProgress,
    downloadResults,
    startDownload,
    cancelDownload,
  } = useDownload();

  const handleSelectDir = async () => {
    try {
      const dir = await invoke<string | null>('dialog:openDirectory', {});
      if (dir) {
        setOutputDir(dir);
      }
    } catch (err) {
      // Ignore
    }
  };

  const handleStartDownload = () => {
    if (songs.length === 0) {
      setError('No songs to download. Import a CSV or add songs first.');
      return;
    }
    if (!playlistName) {
      setError('Please set a playlist name first.');
      return;
    }

    startDownload({
      name: playlistName,
      songs,
    });
  };

  const completedCount = downloadResults.filter((r) => r.status === 'complete').length;
  const skippedCount = downloadResults.filter((r) => r.status === 'skipped').length;
  const errorCount = downloadResults.filter((r) => r.status === 'error').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Download className="w-5 h-5" />
          Download Songs
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Download songs from YouTube to your computer
        </p>
      </div>

      {/* Output directory selection */}
      <div className="card">
        <label className="block text-sm text-gray-400 mb-2">Output Directory</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={outputDir}
            onChange={(e) => setOutputDir(e.target.value)}
            className="input flex-1"
            placeholder="./output"
          />
          <button onClick={handleSelectDir} className="btn btn-secondary">
            <FolderOpen className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Songs will be saved to: {outputDir}/{playlistName || 'playlist-name'}/
        </p>
      </div>

      {/* Status summary */}
      {songs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-400">Playlist: {playlistName || 'Untitled'}</span>
            <span className="text-gray-400">{songs.length} songs</span>
          </div>

          {isDownloading && downloadProgress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">{downloadProgress.songName}</span>
                <span className="text-gray-500">
                  {downloadProgress.songIndex} / {downloadProgress.totalSongs}
                </span>
              </div>
              <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                <div
                  className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((downloadProgress.songIndex - 1) / downloadProgress.totalSongs) * 100 + (downloadProgress.percent || 0) / downloadProgress.totalSongs}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">{downloadProgress.message}</p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isDownloading ? (
          <button onClick={cancelDownload} className="btn btn-danger flex items-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleStartDownload}
            disabled={songs.length === 0 || !playlistName}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Start Download
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto p-1 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results */}
      {downloadResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              {completedCount} downloaded
            </span>
            <span className="text-yellow-400">
              <Clock className="w-4 h-4 inline mr-1" />
              {skippedCount} skipped
            </span>
            <span className="text-red-400">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {errorCount} failed
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1">
            {downloadResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 p-2 rounded text-sm ${
                  result.status === 'complete'
                    ? 'bg-green-500/10 text-green-400'
                    : result.status === 'skipped'
                    ? 'bg-yellow-500/10 text-yellow-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              >
                {result.status === 'complete' ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : result.status === 'skipped' ? (
                  <Clock className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                )}
                <span className="truncate">{result.songName}</span>
                {result.error && (
                  <span className="text-xs text-red-500 ml-auto">{result.error}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
