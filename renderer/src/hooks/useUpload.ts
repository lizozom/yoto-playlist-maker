import { useCallback } from 'react';
import { useIpcInvoke, useIpcOn } from './useIpc';
import { useProgressStore, usePlaylistStore } from '../store';
import { UploadProgress, Song } from '../types';

export function useUpload() {
  const invoke = useIpcInvoke();
  const {
    isUploading,
    uploadProgress,
    setIsUploading,
    setUploadProgress,
    setError,
  } = useProgressStore();

  const { outputDir, playlistName } = usePlaylistStore();

  // Listen to upload progress events
  useIpcOn('upload:progress', useCallback((data: unknown) => {
    setUploadProgress(data as UploadProgress);
  }, [setUploadProgress]));

  // Listen to upload complete events
  useIpcOn('upload:complete', useCallback(() => {
    setIsUploading(false);
    setUploadProgress(null);
  }, [setIsUploading, setUploadProgress]));

  // Listen to upload error events
  useIpcOn('upload:error', useCallback((data: unknown) => {
    const result = data as { error: string };
    setIsUploading(false);
    setUploadProgress(null);
    setError(result.error);
  }, [setIsUploading, setUploadProgress, setError]));

  const startUpload = useCallback(async (songs?: Song[]) => {
    setError(null);
    setIsUploading(true);

    try {
      // Send outputDir and playlistName separately - backend will construct the path
      const result = await invoke<{ success: boolean; error?: string }>('upload:start', {
        playlistName,
        outputDir,
        songs,
      });

      if (!result.success) {
        setError(result.error || 'Upload failed');
        setIsUploading(false);
      }
    } catch (error) {
      setIsUploading(false);
      setError(error instanceof Error ? error.message : 'Upload failed');
    }
  }, [invoke, playlistName, outputDir, setError, setIsUploading]);

  const cancelUpload = useCallback(async () => {
    try {
      await invoke('upload:cancel');
    } catch {
      // Ignore errors
    }
  }, [invoke]);

  return {
    isUploading,
    uploadProgress,
    startUpload,
    cancelUpload,
  };
}
