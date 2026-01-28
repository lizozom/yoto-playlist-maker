# Yoto Playlist Maker

A local Node.js CLI tool for creating custom playlists for Yoto players. Works alongside [yoto-cli](https://github.com/TheBestMoshe/yoto-cli) to streamline the playlist creation workflow.

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

# 4. Install Node.js dependencies
npm install
```

### Verify Installation

```bash
npm run check  # Verifies all external dependencies
```

## CSV Format

Filename: `{playlist-name}.csv`

```csv
song_name,artist
Twinkle Twinkle Little Star,
The Wheels on the Bus,Super Simple Songs
Baby Shark,Pinkfong
```

- `song_name` (required): Name of the song to search on YouTube
- `artist` (optional): Artist name for more accurate search results

## Usage

```bash
# Process a single playlist
npm start -- playlists/bedtime-songs.csv

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

After downloading songs with this tool, use yoto-cli to upload:

```bash
# Install yoto-cli
npm install -g yoto-cli

# Upload playlist to Yoto card
yoto-cli upload ./output/bedtime-songs/
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
- [ ] Retry failed downloads
- [ ] Progress bar for batch downloads
- [ ] Direct integration with yoto-cli
