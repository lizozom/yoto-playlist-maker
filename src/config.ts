// Central place for run configuration. The audio *source* — where track audio
// is resolved and downloaded from — lives here so it isn't a one-off CLI flag
// scattered through the code. Selection order: explicit override (CLI) >
// AUDIO_SOURCE env var > default ('youtube-music'). The default prefers the
// official Art Track master and automatically falls back to a plain YouTube
// download when there's no confident YouTube Music match.

export type AudioSourceName = 'youtube' | 'youtube-music';

// Accepts a few friendly aliases so `--source music`, `ytmusic`, etc. all work.
export function parseSource(value: string | undefined): AudioSourceName | undefined {
  if (!value) return undefined;
  switch (value.toLowerCase()) {
    case 'youtube-music':
    case 'ytmusic':
    case 'music':
      return 'youtube-music';
    case 'youtube':
    case 'yt':
      return 'youtube';
    default:
      return undefined;
  }
}

export function resolveSource(override?: string): AudioSourceName {
  return parseSource(override) ?? parseSource(process.env.AUDIO_SOURCE) ?? 'youtube-music';
}
