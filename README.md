# Yoto Playlist Maker

Create custom playlists for Yoto players from YouTube. Enter song names in a CSV file, and this tool downloads the audio and uploads it to your Yoto account.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Install external tools
npm run check  # Shows what's missing and how to install

# 3. Create a playlist CSV file
# 4. Download songs
npm start -- "playlists/My Playlist.csv"

# 5. Upload to Yoto
npm start -- "playlists/My Playlist.csv" --upload
```

## Setup

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install External Tools

The following tools must be installed on your system:

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| **yt-dlp** | Downloads audio from YouTube | `pipx install yt-dlp` |
| **deno** | Required by yt-dlp | `curl -fsSL https://deno.land/install.sh \| sh` |
| **ffmpeg** | Converts audio to MP3 | `sudo apt install ffmpeg` |
| **yoto-cli** | Uploads to Yoto | `curl -fsSL https://raw.githubusercontent.com/TheBestMoshe/yoto-cli/main/install.sh \| bash` |

Run `npm run check` to verify all tools are installed.

### 3. Add deno to PATH

Add this to your `~/.bashrc` or `~/.zshrc`:

```bash
export PATH="$HOME/.deno/bin:$PATH"
```

### 4. Login to Yoto (one-time)

```bash
~/.local/bin/yoto login
```

Follow the instructions to authenticate with your Yoto account.

## Creating a Playlist

### 1. Create a CSV File

Create a file in the `playlists/` folder. The filename becomes the playlist name.

**Example: `playlists/Kids Party.csv`**

```csv
song_name,artist,icon
Baby Shark,Pinkfong,fish
Let It Go,Frozen,snowflake
Happy,Pharrell Williams,
Can't Stop the Feeling,Justin Timberlake,dance
```

| Column | Required | Description |
|--------|----------|-------------|
| `song_name` | Yes | The song title |
| `artist` | No | Helps find the correct version on YouTube |
| `icon` | No | Icon name from Yoto's library (random music icon if not specified) |

To see available icons, run: `~/.local/bin/yoto icon list`

### 2. Download Songs

```bash
npm start -- "playlists/Kids Party.csv"
```

Songs are saved to `output/Kids Party/` with the format:
```
01. Pinkfong - Baby Shark.mp3
02. Frozen - Let It Go.mp3
03. Pharrell Williams - Happy.mp3
04. Justin Timberlake - Can't Stop the Feeling.mp3
```

### 3. Upload to Yoto

```bash
npm start -- "playlists/Kids Party.csv" --upload
```

Or upload only (if songs already downloaded):

```bash
npm run upload -- "playlists/Kids Party.csv"
```

Each song uses the icon specified in the CSV, or gets a random music icon if none is specified.

**Note:** If a playlist with the same name already exists, it will be deleted and replaced with the new version.

## Commands

| Command | Description |
|---------|-------------|
| `npm start -- <csv>` | Download songs only |
| `npm start -- <csv> --upload` | Download and upload to Yoto |
| `npm run upload -- <csv>` | Upload only (songs must exist) |
| `npm run check` | Verify all dependencies installed |

## Troubleshooting

### "HTTP Error 403: Forbidden" when downloading

YouTube sometimes blocks requests. Just re-run the command - it will skip already downloaded songs and retry the failed ones.

### Songs download but some fail

Run the same command again. The tool skips existing files and only downloads missing ones.

### "Not logged in" error

Run `~/.local/bin/yoto login` to authenticate with your Yoto account.

### deno not found

Make sure deno is in your PATH:
```bash
export PATH="$HOME/.deno/bin:$PATH"
```

## File Structure

```
yoto-playlist-maker/
├── playlists/           # Put your CSV files here
│   └── My Playlist.csv
├── output/              # Downloaded songs go here
│   └── My Playlist/
│       ├── 01. Artist - Song.mp3
│       └── ...
├── src/                 # Source code
└── package.json
```

## Credits

- [yoto-cli](https://github.com/TheBestMoshe/yoto-cli) by TheBestMoshe - Yoto API integration
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - YouTube audio download
