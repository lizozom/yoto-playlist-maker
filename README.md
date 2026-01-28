```
██╗   ██╗ ██████╗ ████████╗ ██████╗
╚██╗ ██╔╝██╔═══██╗╚══██╔══╝██╔═══██╗
 ╚████╔╝ ██║   ██║   ██║   ██║   ██║
  ╚██╔╝  ██║   ██║   ██║   ██║   ██║
	██║   ╚██████╔╝   ██║   ╚██████╔╝
	╚═╝    ╚═════╝    ╚═╝    ╚═════╝
```

# Yoto Playlist Maker

Create custom playlists for Yoto players from YouTube. Drop a CSV in `playlists/`, run one command, and your tracks download and upload to your Yoto account.

---

## ✨ Quick Start

```bash
# 1) Install dependencies
npm install

# 2) Verify external tools
npm run check

# 3) Login to Yoto (one-time)
npx @lizozom/yoto login

# 4) Download songs (using included example)
npm start -- "playlists/Example Playlist.csv"

# 5) Download and upload to Yoto
npm start -- "playlists/Example Playlist.csv" --upload
```

---

## 📦 Requirements

You'll need these installed on your system:

| Tool | Why you need it | Install command |
|------|------------------|-----------------|
| **yt-dlp** | Downloads audio from YouTube | `pipx install yt-dlp` |
| **deno** | Required by `yt-dlp` | `curl -fsSL https://deno.land/install.sh \| DENO_INSTALL=/usr/local sudo -E sh` |
| **ffmpeg** | Converts audio to MP3 | `sudo apt install ffmpeg` |

Then run:

```bash
npm run check
```

---

## 🔐 One-Time Setup

### Login to Yoto

```bash
npx @lizozom/yoto login
```

This stores your credentials locally for uploading playlists.

---

## 🧾 Create a Playlist CSV

Create a file in `playlists/`. The filename becomes your playlist name.

**Example: `playlists/Kids Party.csv`**

```csv
song_name,artist,icon
Baby Shark,Pinkfong,fish
Let It Go,Frozen,snowflake
Happy,Pharrell Williams,
Can't Stop the Feeling,Justin Timberlake,dance
```

| Column | Required | What it does |
|--------|----------|--------------|
| `song_name` | ✅ | Song title |
| `artist` | Optional | Helps pick the right version on YouTube |
| `icon` | Optional | Yoto icon name (random music icon if blank) |

---

## 🎶 Download Songs

```bash
npm start -- "playlists/Kids Party.csv"
```

Files land in `output/Kids Party/` as:

```
01. Pinkfong - Baby Shark.mp3
02. Frozen - Let It Go.mp3
03. Pharrell Williams - Happy.mp3
04. Justin Timberlake - Can't Stop the Feeling.mp3
```

---

## ☁️ Upload to Yoto

```bash
npm start -- "playlists/Kids Party.csv" --upload
```

Already downloaded? Upload only:

```bash
npm run upload -- "playlists/Kids Party.csv"
```

**Note:** If a playlist with the same name already exists, it's deleted and replaced.

---

## 🧰 Commands

| Command | Description |
|---------|-------------|
| `npm start -- <csv>` | Download songs only |
| `npm start -- <csv> --upload` | Download + upload |
| `npm run upload -- <csv>` | Upload only (songs already downloaded) |
| `npm run check` | Verify dependencies |

---

## 🛠️ Troubleshooting

**403 Forbidden from YouTube**
- Re-run the command. Existing files are skipped, failed ones retry.

**Some songs failed**
- Run the same command again to retry missing tracks.

**"Not logged in"**
- Run `npx @lizozom/yoto login`.

---

## 🗂️ Project Layout

```
yoto-playlist-maker/
├── playlists/           # Your CSVs
│   └── My Playlist.csv
├── output/              # Downloaded audio
│   └── My Playlist/
│       ├── 01. Artist - Song.mp3
│       └── ...
├── src/                 # Source code
└── package.json
```

---

## 🙌 Credits

- [@lizozom/yoto](https://www.npmjs.com/package/@lizozom/yoto) - Yoto API client
- [@TheBestMoshe/yoto-cli](https://github.com/TheBestMoshe/yoto-cli) - Yoto cli
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)
