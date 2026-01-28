import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

// Use yoto binary: check node_modules first, then global install
function getYotoCli(): string {
  if (process.env.YOTO_CLI_PATH) return process.env.YOTO_CLI_PATH;

  const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '@thebestmoshe', 'yoto-cli', 'dist', 'yoto');
  if (fs.existsSync(nodeModulesPath)) return nodeModulesPath;

  return path.join(process.env.HOME || '', '.local', 'bin', 'yoto');
}
const YOTO_CLI = getYotoCli();

interface YotoIcon {
  mediaId: string;
  title: string;
  publicTags?: string[];
}

function runYotoCommand(args: string[]): string {
  try {
    return execSync(`${YOTO_CLI} ${args.join(' ')}`, { encoding: 'utf-8' });
  } catch (error: unknown) {
    const execError = error as { stderr?: string; message?: string };
    throw new Error(execError.stderr || execError.message || 'Command failed');
  }
}

export function checkAuth(): boolean {
  try {
    const output = runYotoCommand(['status']);
    return output.toLowerCase().includes('logged in') || output.includes('✓');
  } catch {
    return false;
  }
}

export async function login(): Promise<void> {
  console.log('Opening Yoto login...');
  console.log('Follow the instructions in your browser to authenticate.\n');

  return new Promise((resolve, reject) => {
    const proc = spawn(YOTO_CLI, ['login'], { stdio: 'inherit' });
    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error('Login failed'));
      }
    });
  });
}

export function getIcons(tag?: string): YotoIcon[] {
  try {
    const args = ['icon', 'list', '--json'];
    if (tag) {
      args.splice(2, 0, '--tag', tag);
    }
    const output = runYotoCommand(args);
    return JSON.parse(output) as YotoIcon[];
  } catch {
    return [];
  }
}

export function getRandomIcon(icons: YotoIcon[]): YotoIcon | undefined {
  if (icons.length === 0) return undefined;
  return icons[Math.floor(Math.random() * icons.length)];
}

export function findIconByName(icons: YotoIcon[], name: string): YotoIcon | undefined {
  const lowerName = name.toLowerCase();
  // Try exact match first
  let icon = icons.find(i => i.title?.toLowerCase() === lowerName);
  if (icon) return icon;
  // Try partial match
  icon = icons.find(i => i.title?.toLowerCase().includes(lowerName));
  return icon;
}

interface YotoPlaylist {
  cardId: string;
  title: string;
}

export function getPlaylists(): YotoPlaylist[] {
  try {
    const output = runYotoCommand(['playlist', 'list', '--json']);
    return JSON.parse(output) as YotoPlaylist[];
  } catch {
    return [];
  }
}

export function findPlaylistByName(name: string): YotoPlaylist | undefined {
  const playlists = getPlaylists();
  return playlists.find(p => p.title === name);
}

export function deletePlaylist(cardId: string): boolean {
  try {
    runYotoCommand(['playlist', 'delete', cardId]);
    return true;
  } catch {
    return false;
  }
}

export interface CreatePlaylistResult {
  cardId: string;
  title: string;
}

export function createPlaylist(title: string, description?: string): CreatePlaylistResult {
  const args = ['playlist', 'create', `"${title}"`];
  if (description) {
    args.push('--description', `"${description}"`);
  }

  const output = runYotoCommand(args);

  // Parse output like: "✓ Created playlist: Test\nℹ Card ID: 1S2Zn"
  const cardIdMatch = output.match(/Card ID:\s*(\S+)/);
  if (!cardIdMatch) {
    throw new Error(`Failed to parse card ID from output: ${output}`);
  }

  return {
    cardId: cardIdMatch[1],
    title,
  };
}

export interface AddEntryResult {
  success: boolean;
  title: string;
  error?: string;
}

export async function addEntry(
  cardId: string,
  title: string,
  audioPath: string,
  iconId?: string
): Promise<AddEntryResult> {
  return new Promise((resolve) => {
    // Build command as a shell string with proper escaping
    const escapedTitle = title.replace(/"/g, '\\"');
    const escapedPath = audioPath.replace(/"/g, '\\"');
    let cmd = `${YOTO_CLI} entry add ${cardId} "${escapedTitle}" --file "${escapedPath}"`;

    if (iconId) {
      // Use yoto:# format for media IDs
      cmd += ` --icon "yoto:#${iconId}"`;
    }

    const proc = spawn('sh', ['-c', cmd]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      process.stdout.write(data);
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, title });
      } else {
        resolve({ success: false, title, error: stderr || 'Upload failed' });
      }
    });
  });
}

export interface SongInfo {
  name: string;
  artist?: string;
  icon?: string;
}

export interface UploadPlaylistOptions {
  playlistName: string;
  outputDir: string;
  songs?: SongInfo[];
  description?: string;
}

export async function uploadPlaylist(options: UploadPlaylistOptions): Promise<void> {
  const { playlistName, outputDir, songs, description } = options;

  // Check authentication
  console.log('Checking Yoto authentication...');
  if (!checkAuth()) {
    console.log('Not logged in. Starting login flow...\n');
    await login();

    if (!checkAuth()) {
      throw new Error('Authentication failed. Please try again.');
    }
  }
  console.log('✓ Authenticated\n');

  // Get list of audio files (opus or mp3)
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.opus') || f.endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    throw new Error(`No audio files found in ${outputDir}`);
  }

  console.log(`Found ${files.length} tracks to upload\n`);

  // Fetch icons - all icons for name lookup, music icons for random fallback
  console.log('Fetching icons...');
  const allIcons = getIcons();
  const musicIcons = getIcons('music');
  if (allIcons.length > 0) {
    console.log(`✓ Found ${allIcons.length} icons (${musicIcons.length} music)\n`);
  } else {
    console.log('⚠ No icons found, entries will use default icon\n');
  }

  // Check for existing playlist with same name
  console.log(`Checking for existing playlist: ${playlistName}`);
  const existingPlaylist = findPlaylistByName(playlistName);
  if (existingPlaylist) {
    console.log(`  Found existing playlist (ID: ${existingPlaylist.cardId}), deleting...`);
    if (deletePlaylist(existingPlaylist.cardId)) {
      console.log(`  ✓ Deleted old playlist\n`);
    } else {
      console.log(`  ⚠ Failed to delete old playlist, creating new one anyway\n`);
    }
  } else {
    console.log(`  No existing playlist found\n`);
  }

  // Create playlist
  console.log(`Creating playlist: ${playlistName}`);
  const playlist = createPlaylist(playlistName, description);
  console.log(`✓ Created playlist (ID: ${playlist.cardId})\n`);

  // Upload each track
  console.log('Uploading tracks...\n');
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filePath = path.join(outputDir, file);
    // Parse filename like "01. Artist - Song Name.opus" or "01-old-format.mp3"
    const title = file
      .replace(/^\d+[\.\-]\s*/, '')  // Remove track number prefix (01. or 01-)
      .replace(/\.(opus|mp3)$/, ''); // Remove extension

    // Get icon: use specified icon from CSV, or pick random
    const songInfo = songs?.[i];
    let icon: YotoIcon | undefined;

    if (songInfo?.icon) {
      icon = findIconByName(allIcons, songInfo.icon);
      if (!icon) {
        console.log(`  ⚠ Icon "${songInfo.icon}" not found, using random`);
      }
    }

    if (!icon) {
      icon = getRandomIcon(musicIcons);
    }

    const iconInfo = icon ? ` (icon: ${icon.title})` : '';

    console.log(`[${successful + failed + 1}/${files.length}] ${title}${iconInfo}`);

    const result = await addEntry(playlist.cardId, title, filePath, icon?.mediaId);

    if (result.success) {
      successful++;
      console.log(`  ✓ Uploaded\n`);
    } else {
      failed++;
      console.log(`  ✗ Failed: ${result.error}\n`);
    }
  }

  // Summary
  console.log('═'.repeat(40));
  console.log('Upload Complete!');
  console.log(`  ✓ Successful: ${successful}`);
  if (failed > 0) {
    console.log(`  ✗ Failed: ${failed}`);
  }
  console.log(`\nPlaylist "${playlistName}" is ready on your Yoto account!`);
}
