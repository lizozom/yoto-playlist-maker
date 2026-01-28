import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

export interface Song {
  name: string;
  artist?: string;
  icon?: string;
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

    if (!name) {
      throw new Error('Each row must have a song_name, name, or title column');
    }

    const searchQuery = artist ? `${artist} ${name}` : name;

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
