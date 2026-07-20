import 'dotenv/config';
import * as path from 'path';
import { parsePlaylistCSV } from './csv-parser';
import { downloadPlaylist } from './youtube-downloader';
import { uploadPlaylist } from './yoto-uploader';
import { resolveSource } from './config';
import { getSource } from './sources';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm start -- <path-to-csv> [--source <name>] [--upload]');
    console.log('       npm run upload -- <path-to-csv>');
    console.log('');
    console.log('Flags:');
    console.log('  --source <name>  Audio source: "youtube-music" (default) or "youtube".');
    console.log('                   youtube-music prefers official Art Track audio — the');
    console.log('                   real release/EP masters — and falls back to a plain');
    console.log('                   YouTube download when there is no confident match.');
    console.log('                   Use "--source youtube" to force plain YouTube.');
    console.log('                   (--music is shorthand for --source youtube-music.)');
    console.log('                   Also settable via AUDIO_SOURCE env var.');
    console.log('  --upload         Upload to your Yoto account after downloading');
    console.log('');
    console.log('Examples:');
    console.log('  npm start -- playlists/songs-for-millie.csv                    # Official audio (default)');
    console.log('  npm start -- playlists/songs-for-millie.csv --source youtube   # Plain YouTube');
    console.log('  npm start -- playlists/songs-for-millie.csv --upload           # Download + upload');
    console.log('  npm run upload -- playlists/songs-for-millie.csv               # Upload only');
    process.exit(1);
  }

  const shouldUpload = args.includes('--upload');
  const uploadOnly = args.includes('--upload-only');

  // Pick the audio source. `--music` is shorthand; `--source <name>` (the value
  // is the token right after the flag) and the AUDIO_SOURCE env var also work.
  let sourceOverride: string | undefined;
  if (args.includes('--music')) sourceOverride = 'youtube-music';
  const sourceFlag = args.indexOf('--source');
  const sourceValueIdx = sourceFlag >= 0 ? sourceFlag + 1 : -1;
  if (sourceValueIdx >= 0 && args[sourceValueIdx]) sourceOverride = args[sourceValueIdx];
  const source = getSource(resolveSource(sourceOverride));

  // The CSV is the first bare arg that's neither a flag nor a flag's value.
  const csvPath =
    args.find((a, i) => !a.startsWith('--') && i !== sourceValueIdx) || '';

  console.log('🎵 Yoto Playlist Maker\n');

  try {
    // Parse the CSV file
    console.log(`Reading playlist from: ${csvPath}`);
    const playlist = parsePlaylistCSV(csvPath);

    console.log(`\nPlaylist: ${playlist.name}`);
    console.log(`Songs: ${playlist.songs.length}`);
    console.log('─'.repeat(40));

    playlist.songs.forEach((song, i) => {
      const artist = song.artist ? ` (${song.artist})` : '';
      const icon = song.icon ? ` [${song.icon}]` : '';
      console.log(`  ${i + 1}. ${song.name}${artist}${icon}`);
    });

    // Create output directory path
    const outputDir = path.join(process.cwd(), 'output', playlist.name);

    if (!uploadOnly) {
      console.log(`\nOutput directory: ${outputDir}`);
      console.log('─'.repeat(40));

      // Let the chosen source resolve each song to a concrete download target.
      // For the default YouTube source this is a no-op pass-through; other
      // sources (e.g. YouTube Music) swap in the official Art Track and log it.
      if (source.name !== 'youtube') {
        console.log(`\n🎧 Resolving via ${source.label}...\n`);
      }
      for (const song of playlist.songs) {
        const target = await source.resolve(song);
        song.searchQuery = target.query;
        if (source.name !== 'youtube') {
          if (target.fallback) {
            console.log(`  ⚠ ${song.name} → no ${source.label} match, using fallback`);
          } else {
            console.log(`  ✓ ${song.name} → ${target.note}`);
          }
        }
      }

      // Download songs
      console.log('\nDownloading songs from YouTube...\n');
      const { successful, failed, skipped } = await downloadPlaylist(playlist.songs, outputDir);

      // Summary
      console.log('\n' + '═'.repeat(40));
      console.log('Download Complete!');
      if (skipped > 0) {
        console.log(`  ⏭ Skipped: ${skipped}`);
      }
      console.log(`  ✓ Downloaded: ${successful}`);
      if (failed > 0) {
        console.log(`  ✗ Failed: ${failed}`);
      }
      console.log(`\nFiles saved to: ${outputDir}`);
    }

    // Upload to Yoto if requested
    if (shouldUpload || uploadOnly) {
      console.log('\n' + '═'.repeat(40));
      console.log('Uploading to Yoto...\n');

      await uploadPlaylist({
        playlistName: playlist.name,
        outputDir,
        songs: playlist.songs,
      });
    } else {
      console.log('\nNext steps:');
      console.log('  1. Review downloaded files');
      console.log('  2. Upload to Yoto:');
      console.log(`     npm start -- "${csvPath}" --upload`);
    }

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
