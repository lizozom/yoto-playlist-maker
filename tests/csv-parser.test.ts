import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { parsePlaylistCSV } from '../src/csv-parser';

const fixturesDir = path.join(__dirname, 'fixtures');

describe('parsePlaylistCSV', () => {
  it('parses a valid playlist with all columns', () => {
    const result = parsePlaylistCSV(path.join(fixturesDir, 'valid-playlist.csv'));

    expect(result.name).toBe('valid-playlist');
    expect(result.songs).toHaveLength(3);

    expect(result.songs[0]).toEqual({
      name: 'Twinkle Twinkle Little Star',
      artist: undefined,
      icon: 'star',
      searchQuery: 'Twinkle Twinkle Little Star',
    });

    expect(result.songs[1]).toEqual({
      name: 'The Wheels on the Bus',
      artist: 'Super Simple Songs',
      icon: 'bus',
      searchQuery: 'Super Simple Songs The Wheels on the Bus',
    });

    expect(result.songs[2]).toEqual({
      name: 'Baby Shark',
      artist: 'Pinkfong',
      icon: 'fish',
      searchQuery: 'Pinkfong Baby Shark',
    });
  });

  it('parses a minimal playlist with only song_name column', () => {
    const result = parsePlaylistCSV(path.join(fixturesDir, 'minimal-playlist.csv'));

    expect(result.name).toBe('minimal-playlist');
    expect(result.songs).toHaveLength(2);

    expect(result.songs[0]).toEqual({
      name: 'Song One',
      artist: undefined,
      icon: undefined,
      searchQuery: 'Song One',
    });
  });

  it('supports alternative column names (title instead of song_name)', () => {
    const result = parsePlaylistCSV(path.join(fixturesDir, 'alt-columns.csv'));

    expect(result.songs).toHaveLength(2);
    expect(result.songs[0].name).toBe('My Song');
    expect(result.songs[0].artist).toBe('Artist Name');
  });

  it('throws error when CSV file does not exist', () => {
    expect(() => {
      parsePlaylistCSV(path.join(fixturesDir, 'nonexistent.csv'));
    }).toThrow('CSV file not found');
  });

  it('throws error when song name is empty', () => {
    expect(() => {
      parsePlaylistCSV(path.join(fixturesDir, 'empty-name.csv'));
    }).toThrow('Each row must have a song_name, name, or title column');
  });

  it('derives playlist name from filename', () => {
    const result = parsePlaylistCSV(path.join(fixturesDir, 'valid-playlist.csv'));
    expect(result.name).toBe('valid-playlist');
  });
});
