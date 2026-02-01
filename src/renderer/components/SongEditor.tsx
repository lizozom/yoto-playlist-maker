import React from 'react';
import type { Song, YotoIcon } from '../types';
import IconPicker from './IconPicker';

interface MoveButtonProps {
  direction: 'up' | 'down';
  enabled: boolean;
  onClick: () => void;
}

function MoveButton({ direction, enabled, onClick }: MoveButtonProps): React.ReactElement {
  const path = direction === 'up' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!enabled}
      className={`p-0.5 rounded transition-colors ${
        enabled
          ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          : 'text-gray-200 cursor-not-allowed'
      }`}
      title={`Move ${direction}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </button>
  );
}

interface SongEditorProps {
  song: Song;
  index: number;
  icons: YotoIcon[];
  onUpdate: (index: number, song: Song) => void;
  onRemove: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

function SongEditor({
  song,
  index,
  icons,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}: SongEditorProps) {
  const updateField = (field: keyof Song, value: string | undefined) => {
    const updated = { ...song, [field]: value };
    // Update searchQuery when name or artist changes
    if (field === 'name' || field === 'artist') {
      updated.searchQuery = updated.artist
        ? `${updated.artist} ${updated.name}`
        : updated.name;
    }
    onUpdate(index, updated);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-colors">
      {/* Track Number & Reorder */}
      <div className="flex flex-col items-center gap-0.5 w-8">
        <MoveButton direction="up" enabled={canMoveUp} onClick={() => onMoveUp?.(index)} />
        <span className="text-sm font-medium text-gray-500">{index + 1}</span>
        <MoveButton direction="down" enabled={canMoveDown} onClick={() => onMoveDown?.(index)} />
      </div>

      {/* Song Name Input */}
      <div className="flex-1 min-w-0">
        <input
          type="text"
          value={song.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Song name (required)"
          className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:border-yoto-orange ${
            !song.name.trim() ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}
        />
      </div>

      {/* Artist Input */}
      <div className="w-40">
        <input
          type="text"
          value={song.artist || ''}
          onChange={(e) => updateField('artist', e.target.value || undefined)}
          placeholder="Artist (optional)"
          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yoto-orange"
        />
      </div>

      {/* Icon Picker */}
      <div className="w-44">
        <IconPicker
          value={song.icon}
          icons={icons}
          onChange={(iconId) => updateField('icon', iconId)}
        />
      </div>

      {/* Local File Indicator */}
      {song.localFilePath && (
        <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded" title={song.localFilePath}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Local</span>
        </div>
      )}

      {/* Remove Button */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        title="Remove song"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default SongEditor;
