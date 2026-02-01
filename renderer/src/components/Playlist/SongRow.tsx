import { Song } from '../../types';
import { Trash2, GripVertical, Music } from 'lucide-react';

interface SongRowProps {
  song: Song;
  index: number;
  onRemove: () => void;
  onEdit: () => void;
}

export function SongRow({ song, index, onRemove, onEdit }: SongRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[var(--bg-tertiary)]/30 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors group">
      <div className="text-gray-500 cursor-move">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="w-8 h-8 bg-[var(--bg-tertiary)] rounded flex items-center justify-center text-gray-400">
        <span className="text-sm font-medium">{index + 1}</span>
      </div>

      <div className="flex-1 min-w-0" onClick={onEdit}>
        <div className="flex items-center gap-2 cursor-pointer">
          <Music className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium truncate">{song.name}</p>
            {song.artist && (
              <p className="text-sm text-gray-400 truncate">{song.artist}</p>
            )}
          </div>
        </div>
      </div>

      {song.icon && (
        <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs text-gray-400">
          {song.icon}
        </span>
      )}

      <button
        onClick={onRemove}
        className="p-2 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
        title="Remove song"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
