import { useEffect, useCallback } from 'react';

// Generic hook for IPC invoke calls
export function useIpcInvoke() {
  const invoke = useCallback(async <T>(channel: string, data?: unknown): Promise<T> => {
    return window.electronAPI.invoke<T>(channel, data);
  }, []);

  return invoke;
}

// Hook for listening to IPC events
export function useIpcOn(channel: string, callback: (data: unknown) => void) {
  useEffect(() => {
    const unsubscribe = window.electronAPI.on(channel, callback);
    return () => {
      unsubscribe();
    };
  }, [channel, callback]);
}

// Hook for one-time IPC events
export function useIpcOnce(channel: string, callback: (data: unknown) => void) {
  useEffect(() => {
    window.electronAPI.once(channel, callback);
  }, [channel, callback]);
}
