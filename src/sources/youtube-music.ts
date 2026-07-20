import { Song } from '../csv-parser';
import { AudioSource, ResolvedTarget } from './index';
import { resolveMusicTrack } from '../ytmusic-search';

// Prefer the official YouTube Music "Art Track" — the auto-generated upload that
// carries the real release/EP master (same audio distributed to Spotify/Apple),
// rather than a random fan or live-looping video. Falls back to the default
// YouTube target when there's no confident match.
export const youtubeMusicSource: AudioSource = {
  name: 'youtube-music',
  label: 'YouTube Music',
  async resolve(song: Song): Promise<ResolvedTarget> {
    const match = await resolveMusicTrack(song.name, song.artist);
    if (!match) {
      return { query: song.searchQuery, fallback: true };
    }
    const album = match.album ? ` — ${match.album}` : '';
    return {
      query: match.url,
      note: `${match.name}${album} [${match.videoId}]`,
    };
  },
};
