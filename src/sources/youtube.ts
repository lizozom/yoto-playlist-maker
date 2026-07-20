import { Song } from '../csv-parser';
import { AudioSource, ResolvedTarget } from './index';

// Default source: use whatever the CSV produced — a direct video URL when the
// row has a `url` column, otherwise an "<artist> <name>" search query. No
// remote lookup needed, so this is a pass-through.
export const youtubeSource: AudioSource = {
  name: 'youtube',
  label: 'YouTube',
  async resolve(song: Song): Promise<ResolvedTarget> {
    return { query: song.searchQuery };
  },
};
