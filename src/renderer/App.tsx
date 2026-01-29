import React, { useState, useEffect } from 'react';
import AuthStatus from './components/AuthStatus';
import PlaylistImport from './components/PlaylistImport';
import SongList from './components/SongList';
import DownloadProgress from './components/DownloadProgress';
import UploadProgress from './components/UploadProgress';

type Step = 'import' | 'review' | 'download' | 'upload' | 'complete';

interface Song {
  name: string;
  artist?: string;
  icon?: string;
  searchQuery: string;
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

function App() {
  const [step, setStep] = useState<Step>('import');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [depsOk, setDepsOk] = useState<boolean | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [outputDir, setOutputDir] = useState<string>('');
  const [downloadResults, setDownloadResults] = useState<DownloadResult[]>([]);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  useEffect(() => {
    // Check dependencies and auth on mount
    const checkStatus = async () => {
      const deps = await window.electronAPI.checkDependencies();
      setDepsOk(deps.ytDlp && deps.ffmpeg);

      const auth = await window.electronAPI.checkAuth();
      setIsAuthenticated(auth);
    };
    checkStatus();
  }, []);

  const handlePlaylistImported = async (importedPlaylist: Playlist) => {
    setPlaylist(importedPlaylist);
    const dir = await window.electronAPI.getOutputDir(importedPlaylist.name);
    setOutputDir(dir);
    setStep('review');
  };

  const handleStartDownload = () => {
    setStep('download');
  };

  const handleDownloadComplete = (results: DownloadResult[]) => {
    setDownloadResults(results);
    setStep('upload');
  };

  const handleStartUpload = () => {
    // Already in upload step, component handles this
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
    setStep('import');
  };

  const renderStep = () => {
    switch (step) {
      case 'import':
        return (
          <PlaylistImport
            onPlaylistImported={handlePlaylistImported}
            disabled={!depsOk}
          />
        );

      case 'review':
        return playlist ? (
          <SongList
            playlist={playlist}
            onStartDownload={handleStartDownload}
            onBack={() => setStep('import')}
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
              Your playlist "{playlist?.name}" is ready on your Yoto account.
            </p>
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
                <h3 className="font-medium text-gray-700 mb-2">Summary</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Downloads: {downloadResults.filter(r => r.status === 'success').length} successful, {downloadResults.filter(r => r.status === 'skipped').length} skipped, {downloadResults.filter(r => r.status === 'failed').length} failed</p>
                  <p>Uploads: {uploadResults.filter(r => r.status === 'success').length} successful, {uploadResults.filter(r => r.status === 'failed').length} failed</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header / Drag Region */}
      <header className="drag-region bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎵</span>
            <h1 className="text-xl font-bold text-gray-800">Yoto Playlist Maker</h1>
          </div>
          <AuthStatus
            isAuthenticated={isAuthenticated}
            depsOk={depsOk}
          />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          {['Import', 'Review', 'Download', 'Upload', 'Done'].map((label, idx) => {
            const stepOrder: Step[] = ['import', 'review', 'download', 'upload', 'complete'];
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
                    className={`w-8 h-0.5 ${
                      idx < currentIdx ? 'bg-green-300' : 'bg-gray-200'
                    }`}
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
    </div>
  );
}

export default App;

// Type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: import('../renderer/types').ElectronAPI;
  }
}
