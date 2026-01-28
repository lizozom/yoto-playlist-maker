import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface DownloadOptions {
  outputDir: string;
  trackNumber: number;
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
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50);
}

export async function downloadSong(
  searchQuery: string,
  songName: string,
  options: DownloadOptions
): Promise<DownloadResult> {
  const { outputDir, trackNumber, bitrate = 192 } = options;

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const paddedNumber = String(trackNumber).padStart(2, '0');
  const sanitizedName = sanitizeFilename(songName);
  const expectedFile = path.join(outputDir, `${paddedNumber}-${sanitizedName}.mp3`);
  const outputTemplate = path.join(outputDir, `${paddedNumber}-${sanitizedName}.%(ext)s`);

  // Skip if file already exists
  if (fs.existsSync(expectedFile)) {
    return {
      success: true,
      filename: path.basename(expectedFile),
      skipped: true,
    };
  }

  return new Promise((resolve) => {
    const args = [
      `ytsearch1:${searchQuery}`,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', `${bitrate}K`,
      '--output', outputTemplate,
      '--no-playlist',
      '--quiet',
      '--progress',
    ];

    console.log(`  Downloading: ${searchQuery}`);

    const process = spawn('yt-dlp', args);

    let stderr = '';

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.stdout.on('data', (data) => {
      const line = data.toString().trim();
      if (line) {
        console.log(`    ${line}`);
      }
    });

    process.on('close', (code) => {
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

    process.on('error', (err) => {
      resolve({
        success: false,
        error: `Failed to spawn yt-dlp: ${err.message}`,
      });
    });
  });
}

export async function downloadPlaylist(
  songs: Array<{ name: string; searchQuery: string }>,
  outputDir: string
): Promise<{ successful: number; failed: number; skipped: number; results: DownloadResult[] }> {
  const results: DownloadResult[] = [];
  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    console.log(`\n[${i + 1}/${songs.length}] ${song.name}`);

    const result = await downloadSong(song.searchQuery, song.name, {
      outputDir,
      trackNumber: i + 1,
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
