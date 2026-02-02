import { useState } from 'react';
import { FileDropZone } from './FileDropZone';
import { useIpcInvoke } from '../../hooks';
import { usePlaylistStore } from '../../store';
import { Playlist } from '../../types';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { StageNavigation } from '../Layout/StageNavigation';

interface CsvImportProps {
  onImportSuccess?: () => void;
  onContinue?: () => void;
}

export function CsvImport({ onImportSuccess, onContinue }: CsvImportProps) {
  const invoke = useIpcInvoke();
  const { setCurrentPlaylist, songs } = usePlaylistStore();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedFile, setImportedFile] = useState<string | null>(null);

  const handleFileSelect = async (filePath: string) => {
    setImporting(true);
    setError(null);

    try {
      const result = await invoke<{ success: boolean; playlist?: Playlist; error?: string }>(
        'playlist:import-csv',
        { filePath }
      );

      if (result.success && result.playlist) {
        setCurrentPlaylist(result.playlist);
        setImportedFile(filePath);
        onImportSuccess?.();
      } else {
        setError(result.error || 'Failed to import CSV');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const handleBrowse = async () => {
    try {
      const filePath = await invoke<string | null>('dialog:openFile', {
        filters: [{ name: 'CSV Files', extensions: ['csv'] }],
        properties: ['openFile'],
      });

      if (filePath) {
        handleFileSelect(filePath);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file dialog');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Import Playlist from CSV</h2>
        <p className="text-gray-400 text-sm">
          Upload a CSV file with columns: song_name, artist (optional), icon (optional)
        </p>
      </div>

      <FileDropZone onFileSelect={handleFileSelect} label="Drop CSV file here" />

      <div className="flex justify-center">
        <button onClick={handleBrowse} className="btn btn-secondary" disabled={importing}>
          {importing ? 'Importing...' : 'Browse Files'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {importedFile && !error && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">Successfully imported!</p>
            <p className="text-xs text-green-500/70">{importedFile}</p>
          </div>
        </div>
      )}

      <div className="card">
        <h3 className="font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          CSV Format Example
        </h3>
        <pre className="text-sm text-gray-400 bg-[var(--bg-primary)] p-3 rounded-lg overflow-x-auto">
{`song_name,artist,icon
Twinkle Twinkle Little Star,,star
Baby Shark,Pinkfong,fish
The Wheels on the Bus,Super Simple Songs,`}
        </pre>
      </div>

      <StageNavigation
        onContinue={onContinue}
        continueLabel="Edit Playlist"
        continueDisabled={songs.length === 0}
      />
    </div>
  );
}
