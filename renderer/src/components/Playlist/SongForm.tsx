import { useState, useEffect } from 'react';
import { Song } from '../../types';
import { X } from 'lucide-react';

interface SongFormProps {
  song?: Song;
  onSave: (song: Song) => void;
  onCancel: () => void;
}

export function SongForm({ song, onSave, onCancel }: SongFormProps) {
  const [name, setName] = useState(song?.name || '');
  const [artist, setArtist] = useState(song?.artist || '');
  const [icon, setIcon] = useState(song?.icon || '');

  useEffect(() => {
    if (song) {
      setName(song.name);
      setArtist(song.artist || '');
      setIcon(song.icon || '');
    }
  }, [song]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      artist: artist.trim() || undefined,
      icon: icon.trim() || undefined,
      searchQuery: artist.trim() ? `${artist.trim()} ${name.trim()}` : name.trim(),
    });

    if (!song) {
      // Clear form for new entries
      setName('');
      setArtist('');
      setIcon('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{song ? 'Edit Song' : 'Add New Song'}</h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Song Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Twinkle Twinkle Little Star"
            className="input"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Artist (optional)</label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g., Super Simple Songs"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Icon (optional)</label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="e.g., star, fish, music"
            className="input"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          {song ? 'Save Changes' : 'Add Song'}
        </button>
      </div>
    </form>
  );
}
