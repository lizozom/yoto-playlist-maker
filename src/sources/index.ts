import { Song } from '../csv-parser';
import { AudioSourceName } from '../config';
import { youtubeSource } from './youtube';
import { youtubeMusicSource } from './youtube-music';

// What a source hands back to the downloader for a given song.
export interface ResolvedTarget {
  // A direct video URL or a search query — either is fed straight to yt-dlp.
  query: string;
  // Human-readable note about what was resolved (e.g. album/version), for logs.
  note?: string;
  // True when the source had no confident match and reused the CSV fallback.
  fallback?: boolean;
}

// A source knows how to turn a song into a concrete download target. Download
// mechanics (yt-dlp, retries, skip-existing) are shared and live elsewhere —
// sources only decide *what* to fetch.
export interface AudioSource {
  name: AudioSourceName;
  label: string;
  resolve(song: Song): Promise<ResolvedTarget>;
}

const SOURCES: Record<AudioSourceName, AudioSource> = {
  'youtube': youtubeSource,
  'youtube-music': youtubeMusicSource,
};

export function getSource(name: AudioSourceName): AudioSource {
  return SOURCES[name];
}
