import { useCallback } from 'react';
import { useIpcInvoke, useIpcOn } from './useIpc';
import { useProgressStore, usePlaylistStore } from '../store';
import { DownloadProgress, Playlist } from '../types';

export function useDownload() {
  const invoke = useIpcInvoke();
  const {
    isDownloading,
    downloadProgress,
    downloadResults,
    setIsDownloading,
    setDownloadProgress,
    addDownloadResult,
    clearDownloadResults,
    setError,
  } = useProgressStore();

  const { outputDir } = usePlaylistStore();

  // Listen to download progress events
  useIpcOn('download:progress', useCallback((data: unknown) => {
    const progress = data as DownloadProgress;
    setDownloadProgress(progress);
    if (progress.status === 'complete' || progress.status === 'error' || progress.status === 'skipped') {
      addDownloadResult(progress);
    }
  }, [setDownloadProgress, addDownloadResult]));

  // Listen to download complete events
  useIpcOn('download:complete', useCallback((data: unknown) => {
    const result = data as { success: boolean; cancelled?: boolean; outputDir?: string };
    setIsDownloading(false);
    setDownloadProgress(null);
    if (!result.success && result.cancelled) {
      setError('Download cancelled');
    }
  }, [setIsDownloading, setDownloadProgress, setError]));

  // Listen to download error events
  useIpcOn('download:error', useCallback((data: unknown) => {
    const result = data as { error: string };
    setIsDownloading(false);
    setDownloadProgress(null);
    setError(result.error);
  }, [setIsDownloading, setDownloadProgress, setError]));

  const startDownload = useCallback(async (playlist: Playlist) => {
    clearDownloadResults();
    setError(null);
    setIsDownloading(true);

    try {
      await invoke('download:start', { playlist, outputDir });
    } catch (error) {
      setIsDownloading(false);
      setError(error instanceof Error ? error.message : 'Download failed');
    }
  }, [invoke, outputDir, clearDownloadResults, setError, setIsDownloading]);

  const cancelDownload = useCallback(async () => {
    try {
      await invoke('download:cancel');
    } catch {
      // Ignore errors
    }
  }, [invoke]);

  return {
    isDownloading,
    downloadProgress,
    downloadResults,
    startDownload,
    cancelDownload,
  };
}
