import { useState } from 'react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { CsvImport } from './components/Import/CsvImport';
import { PlaylistDetail } from './components/Playlist/PlaylistDetail';
import { PlaylistList } from './components/Playlist/PlaylistList';
import { DownloadProgress } from './components/Progress/DownloadProgress';
import { UploadProgress } from './components/Progress/UploadProgress';

function App() {
  const [activeTab, setActiveTab] = useState('import');

  const handleImportSuccess = () => {
    setActiveTab('playlist');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'import':
        return <CsvImport onImportSuccess={handleImportSuccess} />;
      case 'playlist':
        return <PlaylistDetail />;
      case 'download':
        return <DownloadProgress />;
      case 'upload':
        return <UploadProgress />;
      case 'yoto':
        return <PlaylistList />;
      default:
        return <CsvImport onImportSuccess={handleImportSuccess} />;
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
