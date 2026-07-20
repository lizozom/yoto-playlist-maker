import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

export interface Song {
  name: string;
  artist?: string;
  icon?: string;
  // Either a YouTube search query, or a direct video URL when the CSV
  // provides a `url` column (used to pull an exact video, not a search hit).
  searchQuery: string;
}

export interface Playlist {
  name: string;
  songs: Song[];
}

export function parsePlaylistCSV(csvPath: string): Playlist {
  const absolutePath = path.resolve(csvPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const playlistName = path.basename(csvPath, '.csv');
  const content = fs.readFileSync(absolutePath, 'utf-8');

  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const songs: Song[] = records.map((record) => {
    const name = record.song_name || record.name || record.title || '';
    const artist = record.artist || '';
    const icon = record.icon || '';
    const url = record.url || '';

    if (!name) {
      throw new Error('Each row must have a song_name, name, or title column');
    }

    // A direct URL takes priority over a name-based search, so we grab the
    // exact video instead of whatever the search happens to surface.
    const searchQuery = url || (artist ? `${artist} ${name}` : name);

    return {
      name,
      artist: artist || undefined,
      icon: icon || undefined,
      searchQuery,
    };
  });

  return {
    name: playlistName,
    songs,
  };
}
