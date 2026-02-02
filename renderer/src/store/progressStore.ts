import { create } from 'zustand';
import { DownloadProgress, UploadProgress } from '../types';

interface ProgressState {
  // Download state
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  downloadResults: DownloadProgress[];
  setIsDownloading: (value: boolean) => void;
  setDownloadProgress: (progress: DownloadProgress | null) => void;
  addDownloadResult: (result: DownloadProgress) => void;
  clearDownloadResults: () => void;

  // Upload state
  isUploading: boolean;
  uploadProgress: UploadProgress | null;
  setIsUploading: (value: boolean) => void;
  setUploadProgress: (progress: UploadProgress | null) => void;

  // General loading state
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;
}

export const useProgressStore = create<ProgressState>((set) => ({
  isDownloading: false,
  downloadProgress: null,
  downloadResults: [],
  setIsDownloading: (value) => set({ isDownloading: value }),
  setDownloadProgress: (progress) => set({ downloadProgress: progress }),
  addDownloadResult: (result) => set((state) => ({
    downloadResults: [...state.downloadResults, result],
  })),
  clearDownloadResults: () => set({ downloadResults: [] }),

  isUploading: false,
  uploadProgress: null,
  setIsUploading: (value) => set({ isUploading: value }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),

  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),

  error: null,
  setError: (error) => set({ error }),
}));
