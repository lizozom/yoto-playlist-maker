import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadOptions {
  outputDir: string;
  trackNumber: number;
  artist?: string;
  bitrate?: number;
  totalTracks?: number;
}

export interface DownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  skipped?: boolean;
}

export interface DownloadProgress {
  songIndex: number;
  totalSongs: number;
  songName: string;
  artist?: string;
  status: 'pending' | 'downloading' | 'converting' | 'complete' | 'error' | 'skipped';
  percent?: number;
  message?: string;
  error?: string;
}

export type ProgressCallback = (progress: DownloadProgress) => void;

function sanitizeFilename(name: string): string {
  return name
    .replace(/[\/\\:*?"<>|]/g, '') // Remove filesystem-unsafe chars
    .trim()
    .substring(0, 80);
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function downloadSong(
  searchQuery: string,
  songName: string,
  options: DownloadOptions,
  onProgress?: ProgressCallback
): Promise<DownloadResult> {
  const { outputDir, trackNumber, artist, totalTracks } = options;

  const emitProgress = (status: DownloadProgress['status'], extra?: Partial<DownloadProgress>) => {
    if (onProgress) {
      onProgress({
        songIndex: trackNumber,
        totalSongs: totalTracks || 1,
        songName,
        artist,
        status,
        ...extra,
      });
    }
  };

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const paddedNumber = String(trackNumber).padStart(2, '0');
  // Format: "01. Artist - Song Name.mp3" or "01. Song Name.mp3" if no artist
  const displayName = artist ? `${artist} - ${songName}` : songName;
  const sanitizedName = sanitizeFilename(displayName);
  const expectedFile = path.join(outputDir, `${paddedNumber}. ${sanitizedName}.mp3`);
  const outputTemplate = path.join(outputDir, `${paddedNumber}. ${sanitizedName}.%(ext)s`);

  // Skip if file already exists (exact match)
  if (fs.existsSync(expectedFile)) {
    emitProgress('skipped', { message: 'Already exists', percent: 100 });
    return {
      success: true,
      filename: path.basename(expectedFile),
      skipped: true,
    };
  }

  // Also check if any file in output folder contains this song name (fuzzy match)
  const sanitizedSongName = sanitizeFilename(songName).toLowerCase();
  const existingFiles = fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : [];
  const matchingFile = existingFiles.find(f =>
    f.endsWith('.mp3') && f.toLowerCase().includes(sanitizedSongName)
  );

  if (matchingFile) {
    emitProgress('skipped', { message: 'Already exists', percent: 100 });
    return {
      success: true,
      filename: matchingFile,
      skipped: true,
    };
  }

  emitProgress('downloading', { percent: 0, message: 'Starting download...' });

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      console.log(`  ⟳ Retry ${attempt}/${MAX_RETRIES}...`);
      await sleep(RETRY_DELAY_MS);
    }

    const result = await new Promise<DownloadResult>((resolve) => {
      // MP3 download with robust YouTube extraction.
      // A direct video URL is used as-is; otherwise search several candidates
      // and skip unavailable ones (blocked/region-locked videos), stopping
      // after the first that downloads successfully.
      const isDirectUrl = /^https?:\/\//i.test(searchQuery);
      const target = isDirectUrl ? searchQuery : `ytsearch10:${searchQuery}`;
      const args = [
        target,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--output', outputTemplate,
        '--max-downloads', '1',
        '--ignore-errors',
        '--quiet',
        '--progress',
        '--extractor-args', 'youtube:player_client=default,-android_sdkless',
        '--remote-components', 'ejs:github',
      ];

      console.log(`  Downloading: ${searchQuery}`);

      const proc = spawn('yt-dlp', args);

      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.stdout.on('data', (data) => {
        const line = data.toString().trim();
        if (line) {
          console.log(`    ${line}`);
          // Parse progress percentage from yt-dlp output
          const percentMatch = line.match(/(\d+\.?\d*)%/);
          if (percentMatch) {
            const percent = parseFloat(percentMatch[1]);
            const isConverting = line.toLowerCase().includes('convert') ||
                                 line.toLowerCase().includes('ffmpeg') ||
                                 line.toLowerCase().includes('post');
            emitProgress(isConverting ? 'converting' : 'downloading', {
              percent,
              message: line
            });
          }
        }
      });

      proc.on('close', (code) => {
        // --max-downloads exits with code 101 on success, so rely on the file
        // actually existing rather than the exit code.
        const finalFile = outputTemplate.replace('.%(ext)s', '.mp3');
        if (fs.existsSync(finalFile)) {
          emitProgress('complete', { percent: 100, message: path.basename(finalFile) });
          resolve({
            success: true,
            filename: path.basename(finalFile),
          });
        } else {
          const errorMsg = stderr || `yt-dlp exited with code ${code}`;
          emitProgress('error', { error: errorMsg });
          resolve({
            success: false,
            error: errorMsg,
          });
        }
      });

      proc.on('error', (err) => {
        const errorMsg = `Failed to spawn yt-dlp: ${err.message}`;
        emitProgress('error', { error: errorMsg });
        resolve({
          success: false,
          error: errorMsg,
        });
      });
    });

    if (result.success) {
      return result;
    }

    // Only retry on 403 errors (YouTube rate limiting)
    if (attempt < MAX_RETRIES && result.error?.includes('403')) {
      console.log(`  ⚠ Download failed, will retry...`);
    } else {
      return result;
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

export async function downloadPlaylist(
  songs: Array<{ name: string; artist?: string; searchQuery: string }>,
  outputDir: string,
  onProgress?: ProgressCallback
): Promise<{ successful: number; failed: number; skipped: number; results: DownloadResult[] }> {
  const results: DownloadResult[] = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    const displayName = song.artist ? `${song.artist} - ${song.name}` : song.name;
    console.log(`\n[${i + 1}/${songs.length}] ${displayName}`);

    const result = await downloadSong(song.searchQuery, song.name, {
      outputDir,
      trackNumber: i + 1,
      artist: song.artist,
      totalTracks: songs.length,
    }, onProgress);

    results.push(result);

    if (result.skipped) {
      skipped++;
      console.log(`  ⏭ Skipped (exists): ${result.filename}`);
    } else if (result.success) {
      successful++;
      console.log(`  ✓ Downloaded: ${result.filename}`);
    } else {
      failed++;
      console.log(`  ✗ Failed: ${result.error}`);
    }
  }

  return { successful, failed, skipped, results };
}
