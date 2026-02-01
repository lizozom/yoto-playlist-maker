import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { YotoIcon } from '../types';
import { getIconEmoji } from '../utils/iconEmojis';

const MAX_VISIBLE_ICONS = 20;

function truncateTitle(title: string | undefined, maxLength: number): string {
  if (!title) return 'Icon';
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength) + '...';
}

interface IconPickerProps {
  value?: string;
  icons: YotoIcon[];
  onChange: (iconId: string | undefined) => void;
}

function IconPicker({ value, icons, onChange }: IconPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter icons by search query
  const filteredIcons = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return icons.slice(0, MAX_VISIBLE_ICONS);
    }
    return icons
      .filter((icon) => {
        const titleMatch = icon.title?.toLowerCase().includes(query);
        const tagMatch = icon.publicTags?.some((tag) => tag.toLowerCase().includes(query));
        return titleMatch || tagMatch;
      })
      .slice(0, MAX_VISIBLE_ICONS);
  }, [searchQuery, icons]);

  // Find current icon
  const currentIcon = useMemo(() => {
    if (!value) return null;
    return icons.find((icon) => icon.mediaId === value);
  }, [value, icons]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (icon: YotoIcon | null) => {
    onChange(icon?.mediaId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const currentEmoji = currentIcon ? getIconEmoji(currentIcon) : null;
  const displayTitle = truncateTitle(currentIcon?.title, 10);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-colors
          ${isOpen ? 'border-yoto-orange bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-white'}
        `}
      >
        {currentIcon ? (
          <>
            <span className="text-lg">{currentEmoji}</span>
            <span className="text-gray-700 truncate max-w-[80px]">{displayTitle}</span>
          </>
        ) : (
          <>
            <span className="text-gray-400">🎵</span>
            <span className="text-gray-500">Select icon</span>
          </>
        )}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-100">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search icons..."
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-yoto-orange"
            />
          </div>

          {/* Clear Selection */}
          {value && (
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b border-gray-100 flex items-center gap-2"
            >
              <span className="text-gray-400">✕</span>
              <span>Clear selection</span>
            </button>
          )}

          {/* Icon Grid */}
          <div className="p-2 max-h-60 overflow-y-auto">
            {filteredIcons.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">
                No icons found
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1">
                {filteredIcons.map((icon) => {
                  const emoji = getIconEmoji(icon);
                  return (
                    <button
                      key={icon.mediaId}
                      type="button"
                      onClick={() => handleSelect(icon)}
                      className={`
                        p-2 rounded-md text-center hover:bg-orange-50 transition-colors
                        ${value === icon.mediaId ? 'bg-orange-100 ring-2 ring-yoto-orange' : ''}
                      `}
                      title={icon.title || icon.mediaId}
                    >
                      <div className="text-xl mb-1">{emoji}</div>
                      <div className="text-xs text-gray-600 truncate">
                        {truncateTitle(icon.title, 10)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              {icons.length} icons available
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IconPicker;
