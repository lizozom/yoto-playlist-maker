# Yoto Playlist Maker

A local Node.js CLI tool for creating custom playlists for Yoto players. Works alongside [yoto-cli](https://github.com/lizozom/yoto-cli) (fork with encoding fixes) to streamline the playlist creation workflow.

## Workflow

1. Create a CSV file with song names (filename becomes playlist name)
2. Run this script to download songs from YouTube
3. (Future) Generate cover images for each song
4. Use yoto-cli to upload the playlist to your Yoto card

## Project Structure

```
yoto-playlist-maker/
├── src/
│   ├── index.ts              # Main entry point
│   ├── csv-parser.ts         # Parse CSV input files
│   ├── youtube-downloader.ts # Download audio from YouTube
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
| bun | Build yoto-cli | Yes |
| yoto-cli | Upload to Yoto | Yes |

### Installation

```bash
# 1. Install yt-dlp
pipx install yt-dlp
# Or: brew install yt-dlp (macOS)
# Or: sudo apt install yt-dlp (Ubuntu/Debian)

# 2. Install deno (required by yt-dlp for YouTube)
curl -fsSL https://deno.land/install.sh | sh
# Add to PATH: export PATH="$HOME/.deno/bin:$PATH"

# 3. Install ffmpeg
sudo apt install ffmpeg  # Ubuntu/Debian
# Or: brew install ffmpeg (macOS)

# 4. Install bun (required to build yoto-cli)
curl -fsSL https://bun.sh/install | bash
# Add to PATH: export PATH="$HOME/.bun/bin:$PATH"

# 5. Install yoto-cli (use the fork with opus/format fixes)
git clone https://github.com/lizozom/yoto-cli.git
cd yoto-cli
git checkout fix-encoding
bun install
bun run build
cp dist/yoto ~/.local/bin/yoto
cd ..

# 6. Install Node.js dependencies
npm install
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
# Download songs only
npm start -- playlists/bedtime-songs.csv

# Download and upload to Yoto
npm start -- playlists/bedtime-songs.csv --upload

# Process all CSVs in playlists folder
npm start -- --all
```

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
- **CSV Parsing**: csv-parse
- **Cover Generation**: (Future) AI image generation API

## Development Commands

```bash
npm install      # Install Node.js dependencies
npm run check    # Verify external dependencies (yt-dlp, deno, ffmpeg)
npm run build    # Compile TypeScript
npm start        # Run the CLI
npm run dev      # Run with ts-node (development)
```

## Integration with yoto-cli

This tool has built-in integration with yoto-cli. Use the `--upload` flag to automatically upload after downloading:

```bash
npm start -- playlists/bedtime-songs.csv --upload
```

The tool will:
1. Download songs from YouTube as MP3
2. Create a playlist on your Yoto account
3. Upload and transcode each track (Yoto server handles opus conversion)
4. Assign icons from the CSV or random music icons

**Note:** You must be logged in to yoto-cli first:
```bash
yoto login
```

## Configuration

Environment variables (optional):

```bash
# Custom output directory
OUTPUT_DIR=./my-playlists

# Audio quality (default: 192)
AUDIO_BITRATE=320

# (Future) Cover generation API key
COVER_API_KEY=
```

## Future Enhancements

- [ ] Cover image generation for each song
- [ ] Playlist cover image
- [ ] Interactive mode for confirming YouTube search results
- [x] Retry failed downloads (3 retries with 2s delay)
- [ ] Progress bar for batch downloads
- [x] Direct integration with yoto-cli (--upload flag)
