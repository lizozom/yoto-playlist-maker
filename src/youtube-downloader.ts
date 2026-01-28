import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadOptions {
  outputDir: string;
  trackNumber: number;
  artist?: string;
  bitrate?: number;
}

export interface DownloadResult {
  success: boolean;
  filename?: string;
  error?: string;
  skipped?: boolean;
}

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
  options: DownloadOptions
): Promise<DownloadResult> {
  const { outputDir, trackNumber, artist } = options;

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

  // Skip if file already exists
  if (fs.existsSync(expectedFile)) {
    return {
      success: true,
      filename: path.basename(expectedFile),
      skipped: true,
    };
  }

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 1) {
      console.log(`  ⟳ Retry ${attempt}/${MAX_RETRIES}...`);
      await sleep(RETRY_DELAY_MS);
    }

    const result = await new Promise<DownloadResult>((resolve) => {
      // Simple MP3 download - Yoto server handles transcoding
      const args = [
        `ytsearch1:${searchQuery}`,
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',
        '--output', outputTemplate,
        '--no-playlist',
        '--quiet',
        '--progress',
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
        }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          const expectedFile = outputTemplate.replace('.%(ext)s', '.mp3');
          resolve({
            success: true,
            filename: path.basename(expectedFile),
          });
        } else {
          resolve({
            success: false,
            error: stderr || `yt-dlp exited with code ${code}`,
          });
        }
      });

      proc.on('error', (err) => {
        resolve({
          success: false,
          error: `Failed to spawn yt-dlp: ${err.message}`,
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
  outputDir: string
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
    });

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
