import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { CsvImport } from './components/Import/CsvImport';
import { PlaylistDetail } from './components/Playlist/PlaylistDetail';
import { PlaylistList } from './components/Playlist/PlaylistList';
import { DownloadProgress } from './components/Progress/DownloadProgress';
import { UploadProgress } from './components/Progress/UploadProgress';

const STAGE_ORDER = ['import', 'playlist', 'download', 'upload'];

function App() {
  const [activeTab, setActiveTab] = useState('import');

  const handleImportSuccess = () => {
    setActiveTab('playlist');
  };

  const goToNextStage = () => {
    const currentIndex = STAGE_ORDER.indexOf(activeTab);
    if (currentIndex < STAGE_ORDER.length - 1) {
      setActiveTab(STAGE_ORDER[currentIndex + 1]);
    }
  };

  const goToPrevStage = () => {
    const currentIndex = STAGE_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(STAGE_ORDER[currentIndex - 1]);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'import':
        return <CsvImport onImportSuccess={handleImportSuccess} onContinue={goToNextStage} />;
      case 'playlist':
        return <PlaylistDetail onBack={goToPrevStage} onContinue={goToNextStage} />;
      case 'download':
        return <DownloadProgress onBack={goToPrevStage} onContinue={goToNextStage} />;
      case 'upload':
        return <UploadProgress onBack={goToPrevStage} />;
      case 'yoto':
        return <PlaylistList />;
      default:
        return <CsvImport onImportSuccess={handleImportSuccess} onContinue={goToNextStage} />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
