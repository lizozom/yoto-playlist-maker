import { useUpload, useAuth } from '../../hooks';
import { usePlaylistStore, useProgressStore } from '../../store';
import { Upload, X, AlertCircle, Loader2, Cloud } from 'lucide-react';

export function UploadProgress() {
  const { songs, playlistName, outputDir } = usePlaylistStore();
  const { error, setError } = useProgressStore();
  const { isAuthenticated } = useAuth();
  const {
    isUploading,
    uploadProgress,
    startUpload,
    cancelUpload,
  } = useUpload();

  const handleStartUpload = () => {
    if (!isAuthenticated) {
      setError('Not authenticated. Please run "npx @lizozom/yoto login" in a terminal first.');
      return;
    }
    if (!playlistName) {
      setError('Please set a playlist name first.');
      return;
    }

    startUpload(songs);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload to Yoto
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Upload your downloaded songs to your Yoto account
        </p>
      </div>

      {/* Auth status warning */}
      {!isAuthenticated && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 font-medium mb-2">Authentication Required</p>
          <p className="text-sm text-gray-400">
            You need to authenticate with Yoto first. Open a terminal and run:
          </p>
          <pre className="mt-2 p-2 bg-[var(--bg-primary)] rounded text-sm text-gray-300">
            npx @lizozom/yoto login
          </pre>
        </div>
      )}

      {/* Upload info */}
      <div className="card">
        <h3 className="font-medium mb-3">Upload Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Playlist Name:</span>
            <span className="text-white">{playlistName || 'Not set'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Source Directory:</span>
            <span className="text-white truncate max-w-[60%]">{outputDir}/{playlistName || '...'}/</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Songs to Upload:</span>
            <span className="text-white">{songs.length}</span>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {isUploading && uploadProgress && (
        <div className="card">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            <div>
              <p className="font-medium">{uploadProgress.message || 'Uploading...'}</p>
              {uploadProgress.songName && (
                <p className="text-sm text-gray-400">{uploadProgress.songName}</p>
              )}
            </div>
          </div>
          {uploadProgress.totalSongs && uploadProgress.totalSongs > 0 && (
            <div className="mt-3">
              <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                <div
                  className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((uploadProgress.songIndex || 0) / uploadProgress.totalSongs) * 100}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {uploadProgress.songIndex || 0} / {uploadProgress.totalSongs}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        {isUploading ? (
          <button onClick={cancelUpload} className="btn btn-danger flex items-center gap-2">
            <X className="w-4 h-4" />
            Cancel
          </button>
        ) : (
          <button
            onClick={handleStartUpload}
            disabled={!isAuthenticated || !playlistName}
            className="btn btn-primary flex items-center gap-2"
          >
            <Cloud className="w-4 h-4" />
            Upload to Yoto
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

      {/* Success message (when not uploading and no error) */}
      {!isUploading && !error && uploadProgress === null && songs.length > 0 && isAuthenticated && (
        <div className="text-center py-4 text-gray-500">
          <p className="text-sm">Ready to upload {songs.length} songs to Yoto</p>
        </div>
      )}
    </div>
  );
}
