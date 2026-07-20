# Yoto Playlist Maker

A local Node.js CLI tool for creating custom playlists for Yoto players. Downloads songs from YouTube and uploads them to your Yoto account using the [@lizozom/yoto](https://www.npmjs.com/package/@lizozom/yoto) package.

## Workflow

1. Create a CSV file with song names (filename becomes playlist name)
2. Run this script to download songs from YouTube
3. (Future) Generate cover images for each song
4. Use the `--upload` flag to upload the playlist to your Yoto account

## Project Structure

```
yoto-playlist-maker/
├── src/
│   ├── index.ts              # Main entry point
│   ├── csv-parser.ts         # Parse CSV input files
│   ├── config.ts             # Run config (selects the audio source)
│   ├── sources/              # Pluggable audio sources (youtube, youtube-music)
│   ├── ytmusic-search.ts     # Resolve official YouTube Music "Art Track" audio
│   ├── icon-picker.ts        # AI icon curation (Claude picks best Yoto icon per song)
│   ├── youtube-downloader.ts # Download audio from YouTube
│   ├── yoto-uploader.ts      # Upload to Yoto account
│   └── cover-generator.ts    # (Future) Generate cover images
├── playlists/                # Input CSV files go here
├── output/                   # Downloaded songs organized by playlist
├── package.json
├── tsconfig.json
└── CLAUDE.md
```

## System Requirements

**Required external tools (must be installed separately):**

| Tool | Purpose | Required |
|------|---------|----------|
| Node.js 18+ | Runtime | Yes |
| yt-dlp | YouTube audio download | Yes |
| deno | JavaScript runtime for yt-dlp | Yes |
| ffmpeg | Audio conversion to MP3 | Yes |

### Installation

```bash
# 1. Install yt-dlp
pipx install yt-dlp
# Or: brew install yt-dlp (macOS)
# Or: sudo apt install yt-dlp (Ubuntu/Debian)

# 2. Install deno to /usr/local/bin (no PATH update needed)
curl -fsSL https://deno.land/install.sh | DENO_INSTALL=/usr/local sudo -E sh

# 3. Install ffmpeg
sudo apt install ffmpeg  # Ubuntu/Debian
# Or: brew install ffmpeg (macOS)

# 4. Install Node.js dependencies
npm install

# 5. Login to Yoto (one-time, for upload feature)
npx @lizozom/yoto login
```

### Verify Installation

```bash
npm run check  # Verifies all external dependencies
```

## CSV Format

Filename: `{playlist-name}.csv`

```csv
song_name,artist,icon
Twinkle Twinkle Little Star,,star
The Wheels on the Bus,Super Simple Songs,
Baby Shark,Pinkfong,fish
```

- `song_name` (required): Name of the song to search on YouTube
- `artist` (optional): Artist name for more accurate search results
- `icon` (optional): Icon name to display on Yoto (matched against Yoto's icon library)

## Usage

```bash
# Download songs (defaults to official YouTube Music audio)
npm start -- playlists/bedtime-songs.csv

# Force plain YouTube (uses the CSV url / a normal search)
npm start -- playlists/bedtime-songs.csv --source youtube

# Download and upload to Yoto
npm start -- playlists/bedtime-songs.csv --upload

# Upload only (songs already downloaded)
npm run upload -- playlists/bedtime-songs.csv

# Curate icons: Claude picks the best Yoto icon per song and writes them
# back into the CSV's `icon` column (needs ANTHROPIC_API_KEY). Review, then upload.
npm run icons -- playlists/bedtime-songs.csv

# Process all CSVs in playlists folder
npm start -- --all
```

### Icon Curation (`npm run icons`)

`src/icon-picker.ts` fetches the full Yoto public-icon catalog (title + tags),
asks Claude (default `claude-haiku-4-5`, override with `ANTHROPIC_MODEL`) to pick
the single best-fitting icon per song, and writes the chosen titles back into the
CSV's `icon` column. It only edits the `icon` column; review the result and then
run a normal `--upload`. Note: the uploader matches the CSV `icon` value against
icon **titles** (exact, then substring), so the curator writes exact titles.

### Audio Source

Where audio is resolved and downloaded from is a configurable **source**:

| Source | Selector | What you get |
|--------|----------|--------------|
| `youtube-music` (default) | `--music` or `--source youtube-music` | The official "Art Track" — the same master distributed to Spotify/Apple, so real album/EP versions instead of fan or live-looping video uploads. **Falls back to the YouTube target when there's no confident match.** |
| `youtube` | `--source youtube` | The CSV `url`, or the top result of a plain YouTube search |

The default is `youtube-music` (try official audio first, fall back to YouTube).
Override the default with the `AUDIO_SOURCE` env var (`youtube-music` or `youtube`).

> Note: in `youtube-music` mode a confident YouTube Music match **overrides** an
> explicit CSV `url`. For playlists where the exact `url` matters (specific
> score cuts, particular live versions), run them with `--source youtube`.

Sources are pluggable — each lives in `src/sources/` and implements a small
`AudioSource` interface (`resolve(song) → { query }`); download mechanics are
shared, so adding a source (Bandcamp, Spotify, local files) is just another module.

## Output Structure

```
output/
└── bedtime-songs/
    ├── 01-twinkle-twinkle-little-star.mp3
    ├── 02-the-wheels-on-the-bus.mp3
    ├── 03-baby-shark.mp3
    └── cover/                # (Future) Generated covers
        ├── 01-cover.png
        ├── 02-cover.png
        └── 03-cover.png
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **YouTube Download**: yt-dlp (with deno runtime)
- **Official audio lookup**: ytmusic-api (YouTube Music "Art Track" resolver)
- **CSV Parsing**: csv-parse
- **Yoto Upload**: @lizozom/yoto package
- **Cover Generation**: (Future) AI image generation API

## Development Commands

```bash
npm install      # Install Node.js dependencies
npm run check    # Verify external dependencies (yt-dlp, deno, ffmpeg)
npm run build    # Compile TypeScript
npm start        # Run the CLI
npm run dev      # Run with ts-node (development)
```

## Authentication

The tool uses the `@lizozom/yoto` npm package (>= 0.3.2) for Yoto API access, via
its PKCE loopback flow.

**One-time setup** — you need your own Yoto OAuth client:

1. Create a **public** client at https://dashboard.yoto.dev/
2. Register the redirect URI `http://127.0.0.1:8787/callback`
3. Enable "Allow Offline Access" (so you get refresh tokens)
4. Put the client id in `.env` as `YOTO_CLIENT_ID` (see `.env.example`)

Then log in:

```bash
npm run yoto:login
```

This opens your browser and stores credentials locally in `~/.yoto-cli/config.json`.
The `checkAuth()` function in `yoto-uploader.ts` verifies authentication before
uploads.

Prefer `npm run yoto:login` over `npx @lizozom/yoto login` — the script loads
`.env`, so it picks up `YOTO_CLIENT_ID` automatically.

## Configuration

Env vars are loaded from `.env` (via `dotenv`). Copy `.env.example` to `.env` to
get started.

```bash
# Your Yoto OAuth public client_id — required for `npm run yoto:login`
# and for the Electron app's login. See Authentication above.
YOTO_CLIENT_ID=

# Custom output directory
OUTPUT_DIR=./my-playlists

# Audio quality (default: 192)
AUDIO_BITRATE=320

# Default audio source: youtube-music (default) or youtube
AUDIO_SOURCE=youtube-music

# For `npm run icons` (AI icon curation)
ANTHROPIC_API_KEY=
# Optional model override (default: claude-haiku-4-5)
ANTHROPIC_MODEL=claude-haiku-4-5

# (Future) Cover generation API key
COVER_API_KEY=
```

## Future Enhancements

- [ ] Cover image generation for each song
- [ ] Playlist cover image
- [ ] Interactive mode for confirming YouTube search results
- [x] Retry failed downloads (3 retries with 2s delay)
- [ ] Progress bar for batch downloads
- [x] Direct integration with Yoto API (--upload flag)
