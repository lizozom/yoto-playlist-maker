import * as path from 'path';
import { parsePlaylistCSV } from './csv-parser';
import { downloadPlaylist } from './youtube-downloader';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: npm start -- <path-to-csv>');
    console.log('Example: npm start -- playlists/songs-for-millie.csv');
    process.exit(1);
  }

  const csvPath = args[0];

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
      console.log(`  ${i + 1}. ${song.name}${artist}`);
    });

    // Create output directory
    const outputDir = path.join(process.cwd(), 'output', playlist.name);
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
    console.log('\nNext steps:');
    console.log('  1. Review downloaded files');
    console.log('  2. Use yoto-cli to upload to your Yoto card');
    console.log('     yoto-cli upload ' + outputDir);

  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
