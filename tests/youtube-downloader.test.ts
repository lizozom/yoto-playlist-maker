import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeFilename, downloadSong, downloadPlaylist, DownloadProgress } from '../src/youtube-downloader';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as child_process from 'child_process';

// Mock fs and child_process
vi.mock('fs');
vi.mock('child_process');

describe('sanitizeFilename', () => {
  it('removes forward slashes', () => {
    expect(sanitizeFilename('song/name')).toBe('songname');
  });

  it('removes backslashes', () => {
    expect(sanitizeFilename('song\\name')).toBe('songname');
  });

  it('removes colons', () => {
    expect(sanitizeFilename('song:name')).toBe('songname');
  });

  it('removes asterisks', () => {
    expect(sanitizeFilename('song*name')).toBe('songname');
  });

  it('removes question marks', () => {
    expect(sanitizeFilename('song?name')).toBe('songname');
  });

  it('removes double quotes', () => {
    expect(sanitizeFilename('song"name')).toBe('songname');
  });

  it('removes angle brackets', () => {
    expect(sanitizeFilename('song<name>')).toBe('songname');
  });

  it('removes pipe characters', () => {
    expect(sanitizeFilename('song|name')).toBe('songname');
  });

  it('removes multiple unsafe characters', () => {
    expect(sanitizeFilename('song/\\:*?"<>|name')).toBe('songname');
  });

  it('trims whitespace from start and end', () => {
    expect(sanitizeFilename('  song name  ')).toBe('song name');
  });

  it('truncates to 80 characters', () => {
    const longName = 'a'.repeat(100);
    expect(sanitizeFilename(longName)).toHaveLength(80);
  });

  it('preserves safe characters', () => {
    expect(sanitizeFilename('My Song - Artist (2024)')).toBe('My Song - Artist (2024)');
  });

  it('preserves unicode characters', () => {
    expect(sanitizeFilename('שיר בעברית')).toBe('שיר בעברית');
  });

  it('handles empty string', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('downloadSong', () => {
  let mockSpawn: ReturnType<typeof vi.fn>;
  let mockProcess: EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock process
    mockProcess = Object.assign(new EventEmitter(), {
      stdout: new EventEmitter(),
      stderr: new EventEmitter(),
    });

    mockSpawn = vi.fn().mockReturnValue(mockProcess);
    vi.mocked(child_process.spawn).mockImplementation(mockSpawn);

    // Default fs mocks
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates output directory if it does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const downloadPromise = downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    // Simulate successful download
    setTimeout(() => mockProcess.emit('close', 0), 10);

    await downloadPromise;

    expect(fs.mkdirSync).toHaveBeenCalledWith('/output', { recursive: true });
  });

  it('skips download if file already exists (exact match)', async () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).includes('01. Test Song.mp3');
    });

    const result = await downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('skips download if similar file exists (fuzzy match)', async () => {
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      // Output dir exists, but exact file doesn't
      return String(path) === '/output';
    });
    vi.mocked(fs.readdirSync).mockReturnValue([
      '01. Test Song.mp3' as unknown as fs.Dirent,
    ]);

    const result = await downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    expect(result.success).toBe(true);
    expect(result.skipped).toBe(true);
    expect(result.filename).toBe('01. Test Song.mp3');
  });

  it('returns success on successful download', async () => {
    const downloadPromise = downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    // Simulate successful download
    setTimeout(() => {
      mockProcess.stdout.emit('data', 'Downloading... 50%');
      mockProcess.emit('close', 0);
    }, 10);

    const result = await downloadPromise;

    expect(result.success).toBe(true);
    expect(result.skipped).toBeFalsy();
    expect(result.filename).toBe('01. Test Song.mp3');
  });

  it('includes artist in filename when provided', async () => {
    const downloadPromise = downloadSong('artist song', 'My Song', {
      outputDir: '/output',
      trackNumber: 1,
      artist: 'Cool Artist',
    });

    setTimeout(() => mockProcess.emit('close', 0), 10);

    const result = await downloadPromise;

    expect(result.filename).toBe('01. Cool Artist - My Song.mp3');
  });

  it('pads track number with leading zero', async () => {
    const downloadPromise = downloadSong('test', 'Song', {
      outputDir: '/output',
      trackNumber: 5,
    });

    setTimeout(() => mockProcess.emit('close', 0), 10);

    const result = await downloadPromise;

    expect(result.filename).toBe('05. Song.mp3');
  });

  it('returns error on failed download', async () => {
    const downloadPromise = downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    setTimeout(() => {
      mockProcess.stderr.emit('data', 'Some error occurred');
      mockProcess.emit('close', 1);
    }, 10);

    const result = await downloadPromise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('Some error occurred');
  });

  it('returns error when spawn fails', async () => {
    const downloadPromise = downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    setTimeout(() => {
      mockProcess.emit('error', new Error('spawn failed'));
    }, 10);

    const result = await downloadPromise;

    expect(result.success).toBe(false);
    expect(result.error).toContain('spawn failed');
  });

  it('calls progress callback with status updates', async () => {
    const progressUpdates: DownloadProgress[] = [];
    const onProgress = (progress: DownloadProgress) => {
      progressUpdates.push({ ...progress });
    };

    const downloadPromise = downloadSong('test query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
      totalTracks: 5,
    }, onProgress);

    setTimeout(() => {
      mockProcess.stdout.emit('data', 'Downloading 50%');
      mockProcess.emit('close', 0);
    }, 10);

    await downloadPromise;

    expect(progressUpdates.length).toBeGreaterThan(0);
    expect(progressUpdates[0].songName).toBe('Test Song');
    expect(progressUpdates[0].totalSongs).toBe(5);
  });

  it('spawns yt-dlp with correct arguments', async () => {
    const downloadPromise = downloadSong('my search query', 'Test Song', {
      outputDir: '/output',
      trackNumber: 1,
    });

    setTimeout(() => mockProcess.emit('close', 0), 10);

    await downloadPromise;

    expect(mockSpawn).toHaveBeenCalledWith('yt-dlp', expect.arrayContaining([
      'ytsearch1:my search query',
      '--extract-audio',
      '--audio-format', 'mp3',
    ]));
  });
});

describe('downloadPlaylist', () => {
  let mockSpawn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock spawn that auto-completes each process
    mockSpawn = vi.fn().mockImplementation(() => {
      const proc = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      // Auto-complete after a short delay
      setTimeout(() => proc.emit('close', 0), 10);
      return proc;
    });

    vi.mocked(child_process.spawn).mockImplementation(mockSpawn);
    vi.mocked(fs.existsSync).mockReturnValue(false);
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.readdirSync).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('downloads all songs in playlist', async () => {
    const songs = [
      { name: 'Song 1', searchQuery: 'song 1' },
      { name: 'Song 2', searchQuery: 'song 2' },
      { name: 'Song 3', searchQuery: 'song 3' },
    ];

    const result = await downloadPlaylist(songs, '/output');

    expect(result.successful).toBe(3);
    expect(result.failed).toBe(0);
    expect(result.results).toHaveLength(3);
  });

  it('tracks failed downloads separately', async () => {
    let callCount = 0;
    vi.mocked(child_process.spawn).mockImplementation(() => {
      callCount++;
      const proc = Object.assign(new EventEmitter(), {
        stdout: new EventEmitter(),
        stderr: new EventEmitter(),
      });
      setTimeout(() => {
        if (callCount === 1) {
          proc.emit('close', 0); // First succeeds
        } else {
          proc.stderr.emit('data', 'error');
          proc.emit('close', 1); // Second fails
        }
      }, 10);
      return proc;
    });

    const songs = [
      { name: 'Song 1', searchQuery: 'song 1' },
      { name: 'Song 2', searchQuery: 'song 2' },
    ];

    const result = await downloadPlaylist(songs, '/output');

    expect(result.successful).toBe(1);
    expect(result.failed).toBe(1);
  });

  it('tracks skipped downloads', async () => {
    // First file exists, second doesn't
    vi.mocked(fs.existsSync).mockImplementation((path) => {
      return String(path).includes('01. Song 1.mp3');
    });

    const songs = [
      { name: 'Song 1', searchQuery: 'song 1' },
      { name: 'Song 2', searchQuery: 'song 2' },
    ];

    const result = await downloadPlaylist(songs, '/output');

    expect(result.skipped).toBe(1);
    expect(result.successful).toBe(1);
  });

  it('includes artist in search when provided', async () => {
    const songs = [
      { name: 'My Song', artist: 'Cool Artist', searchQuery: 'Cool Artist My Song' },
    ];

    await downloadPlaylist(songs, '/output');

    expect(mockSpawn).toHaveBeenCalledWith('yt-dlp', expect.arrayContaining([
      'ytsearch1:Cool Artist My Song',
    ]));
  });
});
