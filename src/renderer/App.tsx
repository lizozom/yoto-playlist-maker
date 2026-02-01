import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthStatus from './components/AuthStatus';
import PlaylistBuilder from './components/PlaylistBuilder';
import SongList from './components/SongList';
import DownloadProgress from './components/DownloadProgress';
import UploadProgress from './components/UploadProgress';
import LoginPrompt from './components/LoginPrompt';

type Step = 'build' | 'review' | 'download' | 'upload' | 'complete';

interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
  localFilePath?: string;
  needsDownload?: boolean;
}

interface Playlist {
  name: string;
  songs: Song[];
}

interface DownloadResult {
  songName: string;
  status: 'success' | 'failed' | 'skipped';
  error?: string;
}

interface UploadResult {
  trackName: string;
  status: 'success' | 'failed';
  error?: string;
}

function AppContent() {
  const { auth } = useAuth();
  const [step, setStep] = useState<Step>('build');
  const [depsOk, setDepsOk] = useState<boolean | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [downloadResults, setDownloadResults] = useState<DownloadResult[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    // Check dependencies on mount
    const checkStatus = async () => {
      const deps = await window.electronAPI.checkDependencies();
      setDepsOk(deps.ytDlp && deps.ffmpeg);
    };
    checkStatus();
  }, []);

  const handlePlaylistReady = async (readyPlaylist: Playlist) => {
    setPlaylist(readyPlaylist);
    const dir = await window.electronAPI.getOutputDir(readyPlaylist.name);
    setOutputDir(dir);
    setStep('review');
  };

  const handleStartDownload = () => {
    // Check if all songs are from local folder (no download needed)
    if (playlist?.songs.every((s) => s.localFilePath)) {
      // Skip download step entirely
      setStep('upload');
    } else {
      setStep('download');
    }
  };

  const handleDownloadComplete = (results: DownloadResult[]) => {
    setDownloadResults(results);
    setStep('upload');
  };

  const handleUploadComplete = (results: UploadResult[]) => {
    setUploadResults(results);
    setStep('complete');
  };

  const handleStartOver = () => {
    setPlaylist(null);
    setOutputDir('');
    setDownloadResults([]);
    setUploadResults([]);
    setStep('build');
  };

  // Determine if we should show login prompt before upload
  const needsLogin = auth.status === 'unauthenticated' && step === 'upload';

  const renderStep = () => {
    switch (step) {
      case 'build':
        return (
          <PlaylistBuilder
            onPlaylistReady={handlePlaylistReady}
            disabled={!depsOk}
            initialPlaylist={playlist}
          />
        );

      case 'review':
        return playlist ? (
          <SongList
            playlist={playlist}
            onStartDownload={handleStartDownload}
            onBack={() => setStep('build')}
          />
        ) : null;

      case 'download':
        return playlist ? (
          <DownloadProgress
            playlist={playlist}
            outputDir={outputDir}
            onComplete={handleDownloadComplete}
          />
        ) : null;

      case 'upload':
        if (needsLogin) {
          return (
            <div className="py-12 text-center">
              <div className="text-5xl mb-4">🔐</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Required</h2>
              <p className="text-gray-600 mb-6">
                Please log in to your Yoto account to upload playlists.
              </p>
              <button
                onClick={() => setShowLoginPrompt(true)}
                className="px-6 py-3 bg-yoto-orange text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
              >
                Log in to Yoto
              </button>
              <div className="mt-4">
                <button
                  onClick={() => setStep('complete')}
                  className="text-gray-500 hover:text-gray-700 text-sm"
                >
                  Skip upload
                </button>
              </div>
            </div>
          );
        }
        return playlist ? (
          <UploadProgress
            playlistName={playlist.name}
            outputDir={outputDir}
            songs={playlist.songs}
            onComplete={handleUploadComplete}
            onSkip={() => setStep('complete')}
          />
        ) : null;

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">All Done!</h2>
            <p className="text-gray-600 mb-6">
              Your playlist "{playlist?.name}" is ready
              {uploadResults.length > 0 ? ' on your Yoto account.' : '.'}
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
                <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  {downloadResults.length > 0 && (
                    <p>
                      Downloads: {downloadResults.filter((r) => r.status === 'success').length} successful,{' '}
                      {downloadResults.filter((r) => r.status === 'skipped').length} skipped,{' '}
                      {downloadResults.filter((r) => r.status === 'failed').length} failed
                    </p>
                  )}
                  {uploadResults.length > 0 && (
                    <p>
                      Uploads: {uploadResults.filter((r) => r.status === 'success').length} successful,{' '}
                      {uploadResults.filter((r) => r.status === 'failed').length} failed
                    </p>
                  )}
                  {downloadResults.length === 0 && uploadResults.length === 0 && (
                    <p>Playlist created with {playlist?.songs.length} songs</p>
                  )}
                </div>
              </div>
              <button
                onClick={handleStartOver}
                className="px-6 py-2 bg-yoto-orange text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create Another Playlist
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Get step labels - use 'Build' instead of 'Import' for the new flow
  const stepLabels = ['Build', 'Review', 'Download', 'Upload', 'Done'];
  const stepOrder: Step[] = ['build', 'review', 'download', 'upload', 'complete'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header / Drag Region */}
      <header className="drag-region bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎵</span>
            <h1 className="text-xl font-bold text-gray-800">Yoto Playlist Maker</h1>
          </div>
          <AuthStatus depsOk={depsOk} />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          {stepLabels.map((label, idx) => {
            const currentIdx = stepOrder.indexOf(step);
            const isActive = idx === currentIdx;
            const isComplete = idx < currentIdx;
            const canNavigate = isComplete && idx < currentIdx;

            return (
              <React.Fragment key={label}>
                <button
                  onClick={() => canNavigate && setStep(stepOrder[idx])}
                  disabled={!canNavigate}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors ${
                    isActive
                      ? 'bg-yoto-orange text-white'
                      : isComplete
                      ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-default'
                  }`}
                >
                  {isComplete && <span>✓</span>}
                  <span>{label}</span>
                </button>
                {idx < 4 && (
                  <div
                    className={`w-8 h-0.5 ${idx < currentIdx ? 'bg-green-300' : 'bg-gray-200'}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderStep()}
        </div>
      </main>

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <LoginPrompt onClose={() => setShowLoginPrompt(false)} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: import('../renderer/types').ElectronAPI;
  }
}
