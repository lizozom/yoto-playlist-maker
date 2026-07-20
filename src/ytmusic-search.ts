import YTMusic from 'ytmusic-api';

// A single shared, lazily-initialized client. Initialization fetches a
// visitor token from YouTube Music, so we only want to do it once per run.
let client: YTMusic | null = null;

async function getClient(): Promise<YTMusic> {
  if (!client) {
    client = new YTMusic();
    await client.initialize();
  }
  return client;
}

export interface MusicMatch {
  videoId: string;
  name: string;
  artist?: string;
  album?: string;
  duration?: number;
  // A plain youtube.com watch URL for the Art Track — yt-dlp handles these
  // directly, and they resolve to the official release audio (the same master
  // distributed to Spotify/Apple), not a random fan/video upload.
  url: string;
}

// Loose normalization for comparing titles/artists ("Alugalug Cat!" ~ "alugalug cat").
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // drop parenthetical qualifiers for matching
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Resolve a song to its official YouTube Music "Art Track" (the auto-generated
 * upload that carries the real release/EP master). Returns null when there's no
 * confident match, so callers can fall back to a regular YouTube search.
 */
export async function resolveMusicTrack(
  name: string,
  artist?: string
): Promise<MusicMatch | null> {
  const query = artist ? `${artist} ${name}` : name;

  let songs: any[];
  try {
    const yt = await getClient();
    songs = await yt.searchSongs(query);
  } catch {
    // Network hiccup / API shape change — treat as "no match" and fall back.
    return null;
  }

  if (!songs || songs.length === 0) return null;

  const wantName = normalize(name);
  const wantArtist = artist ? normalize(artist) : '';

  const scored = songs
    .filter((s) => s && s.videoId)
    .map((s) => {
      const sName = normalize(s.name || '');
      const sArtist = normalize(s.artist?.name || '');
      // Title match is required — an artist/album match alone is NOT enough
      // (otherwise "Thai Pile Drivers" happily matches any other track by the
      // same artist). Tracked separately so we can gate on it below.
      let nameScore = 0;
      if (sName === wantName) nameScore = 4;
      else if (sName.includes(wantName) || wantName.includes(sName)) nameScore = 2;

      const artistMatch = !!wantArtist && sArtist.includes(wantArtist);

      let score = nameScore;
      if (artistMatch) score += 3;
      // Songs that belong to a released album are official Art Tracks — exactly
      // the "real" versions we're after.
      if (s.album?.name) score += 1;
      return { s, nameScore, artistMatch, score };
    })
    // Require a title overlap, and — when the caller named an artist — require
    // that artist too. This is what makes unreleased viral collabs (no official
    // Art Track) fall back to the CSV URL instead of matching a same-titled or
    // same-artist track from someone else's catalogue.
    .filter((c) => c.nameScore > 0 && (!wantArtist || c.artistMatch))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (!best) return null;

  const s = best.s;
  return {
    videoId: s.videoId,
    name: s.name,
    artist: s.artist?.name,
    album: s.album?.name,
    duration: s.duration,
    url: `https://www.youtube.com/watch?v=${s.videoId}`,
  };
}
