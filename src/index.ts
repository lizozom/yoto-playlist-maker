import * as path from 'path';
import { parsePlaylistCSV } from './csv-parser';
import { downloadPlaylist } from './youtube-downloader';
import { uploadPlaylist } from './yoto-uploader';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm start -- <path-to-csv> [--upload]');
    console.log('       npm run upload -- <path-to-csv>');
    console.log('');
    console.log('Examples:');
    console.log('  npm start -- playlists/songs-for-millie.csv           # Download only');
    console.log('  npm start -- playlists/songs-for-millie.csv --upload  # Download + upload');
    console.log('  npm run upload -- playlists/songs-for-millie.csv      # Upload only');
    process.exit(1);
  }

  const csvPath = args.find(a => !a.startsWith('--')) || '';
  const shouldUpload = args.includes('--upload');
  const uploadOnly = args.includes('--upload-only');

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
