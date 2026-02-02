import { useState } from 'react';
import { usePlaylistStore } from '../../store';
import { SongRow } from './SongRow';
import { SongForm } from './SongForm';
import { Song } from '../../types';
import { Plus, Music, Edit2 } from 'lucide-react';
import { StageNavigation } from '../Layout/StageNavigation';

interface PlaylistDetailProps {
  onBack?: () => void;
  onContinue?: () => void;
}

export function PlaylistDetail({ onBack, onContinue }: PlaylistDetailProps) {
  const {
    songs,
    playlistName,
    setPlaylistName,
    addSong,
    removeSong,
    updateSong,
  } = usePlaylistStore();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);

  const handleSaveNew = (song: Song) => {
    addSong(song);
    setIsAddingNew(false);
  };

  const handleSaveEdit = (song: Song) => {
    if (editingIndex !== null) {
      updateSong(editingIndex, song);
      setEditingIndex(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          {isEditingName ? (
            <input
              type="text"
              value={playlistName}
              onChange={(e) => setPlaylistName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
              className="input text-xl font-semibold"
              autoFocus
            />
          ) : (
            <h2
              className="text-xl font-semibold flex items-center gap-2 cursor-pointer hover:text-[var(--accent)]"
              onClick={() => setIsEditingName(true)}
            >
              {playlistName || 'Untitled Playlist'}
              <Edit2 className="w-4 h-4 opacity-50" />
            </h2>
          )}
        </div>
        <p className="text-gray-400 text-sm">
          {songs.length} {songs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>

      {/* Song list */}
      <div className="space-y-2">
        {songs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No songs yet</p>
            <p className="text-sm">Import a CSV or add songs manually</p>
          </div>
        ) : (
          songs.map((song, index) => (
            <div key={index}>
              {editingIndex === index ? (
                <SongForm
                  song={song}
                  onSave={handleSaveEdit}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
                <SongRow
                  song={song}
                  index={index}
                  onRemove={() => removeSong(index)}
                  onEdit={() => setEditingIndex(index)}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new song form */}
      {isAddingNew ? (
        <SongForm onSave={handleSaveNew} onCancel={() => setIsAddingNew(false)} />
      ) : (
        <button
          onClick={() => setIsAddingNew(true)}
          className="w-full p-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Song
        </button>
      )}

      <StageNavigation
        onBack={onBack}
        onContinue={onContinue}
        backLabel="Import"
        continueLabel="Download"
        continueDisabled={songs.length === 0 || !playlistName}
      />
    </div>
  );
}
