# Yoto Playlist Maker

A desktop application and CLI tool for creating custom playlists for Yoto players. Downloads songs from YouTube and uploads them to your Yoto account using the [@lizozom/yoto](https://www.npmjs.com/package/@lizozom/yoto) package.

## Features

- **Desktop App (Electron)**: User-friendly GUI for creating playlists
- **CLI Tool**: Command-line interface for automation
- **Multiple Input Methods**: Manual entry, CSV import, or local music folder
- **YouTube Downloads**: Automatically downloads audio from YouTube using yt-dlp
- **Icon Selection**: Browse and select from Yoto's icon library
- **Smart Downloads**: Skips songs that are already downloaded
- **Yoto Integration**: Direct upload to your Yoto account

## Project Structure

```
yoto-playlist-maker/
├── electron/                 # Electron main process
│   ├── main.ts              # Main entry point
│   ├── preload.ts           # Preload script (IPC bridge)
│   ├── ipc-handlers.ts      # IPC handlers for all operations
│   └── auth-server.ts       # OAuth authentication
├── src/
│   ├── renderer/            # React frontend (Electron)
│   │   ├── App.tsx          # Main app component
│   │   ├── components/      # UI components
│   │   ├── contexts/        # React contexts (auth)
│   │   ├── types.ts         # TypeScript types
│   │   └── utils/           # Utility functions
│   ├── index.ts             # CLI entry point
│   ├── csv-parser.ts        # Parse CSV input files
│   ├── youtube-downloader.ts # Download audio from YouTube
│   └── yoto-uploader.ts     # Upload to Yoto account
├── resources/               # Bundled binaries per platform
│   ├── linux/               # Linux binaries (yt-dlp, ffmpeg)
│   ├── mac/                 # macOS binaries
│   └── win/                 # Windows binaries
├── playlists/               # Input CSV files (CLI)
├── output/                  # Downloaded songs
└── release/                 # Built distributables
```

## System Requirements

**For development:**

| Tool | Purpose | Required |
|------|---------|----------|
| Node.js 18+ | Runtime | Yes |
| yt-dlp | YouTube audio download | Yes |
| ffmpeg | Audio conversion to MP3 | Yes |

**For distribution:** Binaries are bundled in `resources/{platform}/`

### Installation (Development)

```bash
# 1. Install yt-dlp
pipx install yt-dlp
# Or: brew install yt-dlp (macOS)
# Or: sudo apt install yt-dlp (Ubuntu/Debian)

# 2. Install ffmpeg
sudo apt install ffmpeg  # Ubuntu/Debian
# Or: brew install ffmpeg (macOS)

# 3. Install Node.js dependencies
npm install
```

## Electron Desktop App

### Running in Development

```bash
npm run electron:dev
```

This starts:
- Vite dev server for hot-reloading
- TypeScript watch for Electron main process
- Electron app connected to dev server

### Building for Distribution

```bash
# Build and package (unpacked, for testing)
npm run electron:pack

# Build distributable packages
npm run electron:dist
```

Output packages (in `release/`):
- **Linux**: AppImage, .deb
- **macOS**: DMG, zip
- **Windows**: NSIS installer, portable exe

### App Workflow

1. **Build Playlist**: Add songs manually, import CSV, or scan a music folder
2. **Review**: Preview songs with icons, see download status
3. **Download**: Fetch audio from YouTube (skips existing files)
4. **Upload**: Create playlist on your Yoto account

## CLI Usage

```bash
# Download songs only
npm start -- playlists/bedtime-songs.csv

# Download and upload to Yoto
npm start -- playlists/bedtime-songs.csv --upload

# Upload only (songs already downloaded)
npm run upload -- playlists/bedtime-songs.csv
```

### CSV Format

Filename: `{playlist-name}.csv`

```csv
song_name,artist,icon
Twinkle Twinkle Little Star,,star
The Wheels on the Bus,Super Simple Songs,
Baby Shark,Pinkfong,fish
```

- `song_name` (required): Name of the song to search on YouTube
- `artist` (optional): Artist name for more accurate search results
- `icon` (optional): Icon name to display on Yoto

## Output Structure

```
output/
└── bedtime-songs/
    ├── 01. Twinkle Twinkle Little Star.mp3
    ├── 02. The Wheels on the Bus.mp3
    └── 03. Baby Shark.mp3
```

## Tech Stack

- **Desktop**: Electron 28 + React 18 + Vite
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **YouTube Download**: yt-dlp + ffmpeg
- **CSV Parsing**: csv-parse
- **Yoto API**: @lizozom/yoto package

## Development Commands

```bash
# CLI
npm start              # Run CLI
npm run check          # Verify external dependencies

# Electron
npm run electron:dev   # Development with hot reload
npm run electron:build # Build without packaging
npm run electron:start # Build and run
npm run electron:pack  # Package (unpacked)
npm run electron:dist  # Create distributables
```

## Authentication

Authentication is handled via OAuth device flow in the Electron app. The CLI uses:

```bash
npx @lizozom/yoto login
```

Credentials are stored in `~/.yoto/config.json`.

## Bundling Binaries for Distribution

To distribute the app with bundled yt-dlp and ffmpeg:

1. Download platform-specific binaries
2. Place them in `resources/{platform}/`:
   ```
   resources/
   ├── linux/
   │   ├── yt-dlp
   │   └── ffmpeg
   ├── mac/
   │   ├── yt-dlp
   │   └── ffmpeg
   └── win/
       ├── yt-dlp.exe
       └── ffmpeg.exe
   ```
3. Run `npm run electron:dist`

The app will use bundled binaries in production, falling back to system PATH in development.
