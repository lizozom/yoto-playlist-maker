import { describe, it, expect } from 'vitest';
import { sanitizeFilename } from '../src/youtube-downloader';

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
