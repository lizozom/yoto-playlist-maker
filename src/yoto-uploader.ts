import * as fs from 'fs';
import * as path from 'path';

// Lazy load the @lizozom/yoto module (ESM-only package)
let yotoModule: typeof import('@lizozom/yoto') | null = null;

async function getYotoModule() {
  if (!yotoModule) {
    yotoModule = await import('@lizozom/yoto');
  }
  return yotoModule;
}

interface YotoIcon {
  mediaId: string;
  title?: string;
  publicTags?: string[];
}

let cachedIcons: YotoIcon[] | null = null;

export async function checkAuth(): Promise<boolean> {
  try {
    const { loadConfig } = await getYotoModule();
    const config = await loadConfig();
    return !!config?.accessToken;
  } catch {
    return false;
  }
}

export async function getIcons(tag?: string): Promise<YotoIcon[]> {
  if (!cachedIcons) {
    try {
      const { getAuthenticatedClient } = await getYotoModule();
      const client = await getAuthenticatedClient();
      const response = await client.getPublicIcons();
      cachedIcons = response.displayIcons.map((icon) => ({
        mediaId: icon.mediaId,
        title: icon.title,
        publicTags: icon.publicTags,
      }));
    } catch {
      return [];
    }
  }

  if (tag) {
    return cachedIcons?.filter(i => i.publicTags?.includes(tag)) || [];
  }
  return cachedIcons || [];
}

export function getRandomIcon(icons: YotoIcon[]): YotoIcon | undefined {
  if (icons.length === 0) return undefined;
  return icons[Math.floor(Math.random() * icons.length)];
}

export function findIconByName(icons: YotoIcon[], name: string): YotoIcon | undefined {
  const lowerName = name.toLowerCase();
  // Match order: exact title, exact tag, title substring, tag substring. Tags
  // matter because some icons have no title at all (e.g. the pineapple icon,
  // tagged food/fruit/pineapple), so title-only matching can never reach them.
  return (
    icons.find(i => i.title?.toLowerCase() === lowerName) ||
    icons.find(i => i.publicTags?.some(t => t.toLowerCase() === lowerName)) ||
    icons.find(i => i.title?.toLowerCase().includes(lowerName)) ||
    icons.find(i => i.publicTags?.some(t => t.toLowerCase().includes(lowerName)))
  );
}

interface YotoPlaylist {
  cardId: string;
  title: string;
}

export async function getPlaylists(): Promise<YotoPlaylist[]> {
  try {
    const { getAuthenticatedClient } = await getYotoModule();
    const client = await getAuthenticatedClient();
    const response = await client.listContent();
    return response.cards.map((card: any) => ({
      cardId: card.cardId,
      title: card.title,
    }));
  } catch {
    return [];
  }
}

export async function findPlaylistByName(name: string): Promise<YotoPlaylist | undefined> {
  const playlists = await getPlaylists();
  return playlists.find(p => p.title === name);
}

export async function removePlaylist(cardId: string): Promise<boolean> {
  try {
    const { getAuthenticatedClient } = await getYotoModule();
    const client = await getAuthenticatedClient();
    await client.deleteContent(cardId);
    return true;
  } catch {
    return false;
  }
}

export async function clearPlaylistEntries(cardId: string): Promise<number> {
  const { getAuthenticatedClient, deleteEntry } = await getYotoModule();
  const client = await getAuthenticatedClient();
  const content = await client.getContent(cardId);
  const chapters = content.card.content?.chapters || [];

  // Delete entries from last to first to avoid index shifting issues
  for (let i = chapters.length - 1; i >= 0; i--) {
    await deleteEntry(cardId, i);
  }

  return chapters.length;
}

export interface CreatePlaylistResult {
  cardId: string;
  title: string;
}

export async function makePlaylist(title: string, description?: string): Promise<CreatePlaylistResult> {
  const { getAuthenticatedClient } = await getYotoModule();
  const client = await getAuthenticatedClient();

  const response = await client.createContent({
    title,
    content: {
      chapters: [],
      playbackType: 'linear',
      activity: 'yoto_Player',
      version: '1',
      restricted: true,
    },
    metadata: {
      description,
    },
  });

  return {
    cardId: response.card.cardId,
    title: response.card.title,
  };
}

export interface AddEntryResult {
  success: boolean;
  title: string;
  duration?: number;
  error?: string;
}

export async function addTrackToPlaylist(
  cardId: string,
  title: string,
  audioPath: string,
  iconId?: string
): Promise<AddEntryResult> {
  try {
    const { addEntry } = await getYotoModule();
    // Use the addEntry function from yoto-cli which handles upload + transcode + add
    await addEntry(cardId, title, {
      file: audioPath,
      icon: iconId ? `yoto:#${iconId}` : undefined,
    });

    return { success: true, title };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, title, error: message };
  }
}

export interface SongInfo {
  name: string;
  artist?: string;
  icon?: string;
}

export interface UploadProgress {
  stage: 'init' | 'auth' | 'icons' | 'playlist' | 'uploading' | 'complete' | 'error';
  songIndex?: number;
  totalSongs?: number;
  songName?: string;
  percent?: number;
  message?: string;
  error?: string;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

export interface UploadPlaylistOptions {
  playlistName: string;
  outputDir: string;
  songs?: SongInfo[];
  description?: string;
  onProgress?: UploadProgressCallback;
  shouldCancel?: () => boolean;
}

// Safe console log that won't crash on encoding issues
function safeLog(message: string): void {
  try {
    console.log(message);
  } catch {
    // Ignore logging errors
  }
}

export async function uploadPlaylist(options: UploadPlaylistOptions): Promise<void> {
  const { playlistName, outputDir, songs, description, onProgress, shouldCancel } = options;

  const emit = (progress: UploadProgress) => {
    if (onProgress) {
      try {
        onProgress(progress);
      } catch (err) {
        console.error('Error in progress callback:', err);
      }
    }
  };

  const checkCancel = () => {
    if (shouldCancel?.()) {
      emit({ stage: 'error', error: 'Upload cancelled' });
      throw new Error('Upload cancelled');
    }
  };

  // Check authentication
  safeLog('Checking Yoto authentication...');
  emit({ stage: 'auth', message: 'Checking authentication...' });
  if (!await checkAuth()) {
    safeLog('\n⚠ Not logged in. Please run: yoto login\n');
    emit({ stage: 'error', error: 'Authentication required. Run yoto login first.' });
    throw new Error('Authentication required. Run yoto login first.');
  }
  safeLog('✓ Authenticated\n');

  checkCancel();

  // Use outputDir directly - it already points to the playlist directory
  const playlistDir = outputDir;

  // Get list of audio files (opus or mp3)
  emit({ stage: 'init', message: 'Scanning audio files...' });

  if (!fs.existsSync(playlistDir)) {
    emit({ stage: 'error', error: `Playlist directory not found: ${playlistDir}` });
    throw new Error(`Playlist directory not found: ${playlistDir}`);
  }

  const files = fs.readdirSync(playlistDir)
    .filter(f => f.endsWith('.opus') || f.endsWith('.mp3'))
    .sort();

  if (files.length === 0) {
    emit({ stage: 'error', error: `No audio files found in ${playlistDir}` });
    throw new Error(`No audio files found in ${playlistDir}`);
  }

  checkCancel();

  safeLog(`Found ${files.length} tracks to upload\n`);

  // Fetch icons
  safeLog('Fetching icons...');
  emit({ stage: 'icons', message: 'Fetching icons...' });
  const allIcons = await getIcons();
  const musicIcons = await getIcons('music');
  if (allIcons.length > 0) {
    safeLog(`✓ Found ${allIcons.length} icons (${musicIcons.length} music)\n`);
  } else {
    safeLog('⚠ No icons found, entries will use default icon\n');
  }

  checkCancel();

  // Check for existing playlist with same name
  safeLog(`Checking for existing playlist: ${playlistName}`);
  emit({ stage: 'playlist', message: `Looking for playlist "${playlistName}"...` });
  const existingPlaylist = await findPlaylistByName(playlistName);

  let playlistId: string;

  if (existingPlaylist) {
    safeLog(`  Found existing playlist (ID: ${existingPlaylist.cardId})`);
    safeLog(`  Clearing existing entries...`);
    emit({ stage: 'playlist', message: 'Clearing existing entries...' });
    const clearedCount = await clearPlaylistEntries(existingPlaylist.cardId);
    safeLog(`  ✓ Cleared ${clearedCount} entries\n`);
    playlistId = existingPlaylist.cardId;
  } else {
    safeLog(`  No existing playlist found`);
    safeLog(`  Creating new playlist: ${playlistName}`);
    emit({ stage: 'playlist', message: `Creating playlist "${playlistName}"...` });
    const playlist = await makePlaylist(playlistName, description);
    safeLog(`  ✓ Created playlist (ID: ${playlist.cardId})\n`);
    playlistId = playlist.cardId;
  }

  checkCancel();

  // Upload each track
  safeLog('Uploading tracks...\n');
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    // Check for cancellation before each upload
    checkCancel();

    const file = files[i];
    const filePath = path.join(playlistDir, file);
    // Parse filename like "01. Artist - Song Name.opus" or "01-old-format.mp3"
    const title = file
      .replace(/^\d+[\.\-]\s*/, '')  // Remove track number prefix
      .replace(/\.(opus|mp3)$/, ''); // Remove extension

    // Get icon: use specified icon from CSV, or pick random
    const songInfo = songs?.[i];
    let icon: YotoIcon | undefined;

    if (songInfo?.icon) {
      icon = findIconByName(allIcons, songInfo.icon);
      if (!icon) {
        safeLog(`  ⚠ Icon "${songInfo.icon}" not found, using random`);
      }
    }

    if (!icon) {
      icon = getRandomIcon(musicIcons);
    }

    const iconInfo = icon ? ` (icon: ${icon.title})` : '';

    safeLog(`[${successful + failed + 1}/${files.length}] ${title}${iconInfo}`);
    emit({
      stage: 'uploading',
      songIndex: i + 1,
      totalSongs: files.length,
      songName: title,
      percent: Math.round((i / files.length) * 100),
      message: `Uploading: ${title}`,
    });

    const result = await addTrackToPlaylist(playlistId, title, filePath, icon?.mediaId);

    if (result.success) {
      successful++;
      safeLog(`  ✓ Uploaded\n`);
    } else {
      failed++;
      safeLog(`  ✗ Failed: ${result.error}\n`);
    }
  }

  // Summary
  safeLog('═'.repeat(40));
  safeLog('Upload Complete!');
  safeLog(`  ✓ Successful: ${successful}`);
  if (failed > 0) {
    safeLog(`  ✗ Failed: ${failed}`);
  }
  safeLog(`\nPlaylist "${playlistName}" is ready on your Yoto account!`);

  emit({
    stage: 'complete',
    percent: 100,
    message: `Upload complete! ${successful} tracks uploaded${failed > 0 ? `, ${failed} failed` : ''}.`,
  });
}
