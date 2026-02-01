import { useState, useEffect, useCallback } from 'react';
import { useIpcInvoke, useIpcOn } from './useIpc';
import { DependencyStatus } from '../types';

interface AuthState {
  isAuthenticated: boolean | null;
  isChecking: boolean;
  isLoggingIn: boolean;
  browserOpened: boolean;
  userCode: string | null;
  dependencies: DependencyStatus[];
}

export function useAuth() {
  const invoke = useIpcInvoke();
  const [state, setState] = useState<AuthState>({
    isAuthenticated: null,
    isChecking: true,
    isLoggingIn: false,
    browserOpened: false,
    userCode: null,
    dependencies: [],
  });

  // Listen for browser opened event
  useIpcOn('auth:browser-opened', useCallback((data: unknown) => {
    const { userCode } = data as { url: string; userCode: string };
    setState((s) => ({ ...s, browserOpened: true, userCode }));
  }, []));

  const checkAuth = useCallback(async () => {
    setState((s) => ({ ...s, isChecking: true }));
    try {
      const result = await invoke<{ success: boolean; authenticated: boolean }>('auth:check');
      setState((s) => ({
        ...s,
        isAuthenticated: result.authenticated,
        isChecking: false,
      }));
    } catch {
      setState((s) => ({ ...s, isAuthenticated: false, isChecking: false }));
    }
  }, [invoke]);

  const checkDependencies = useCallback(async () => {
    try {
      const result = await invoke<{ success: boolean; dependencies: DependencyStatus[] }>(
        'system:check-deps'
      );
      if (result.success) {
        setState((s) => ({ ...s, dependencies: result.dependencies }));
      }
    } catch {
      // Ignore errors
    }
  }, [invoke]);

  const login = useCallback(async () => {
    setState((s) => ({ ...s, isLoggingIn: true, browserOpened: false, userCode: null }));
    try {
      const result = await invoke<{ success: boolean; error?: string }>('auth:login');
      if (result.success) {
        // Re-check auth status after login
        await checkAuth();
      }
      return result;
    } catch (error) {
      return { success: false, error: 'Login failed' };
    } finally {
      setState((s) => ({ ...s, isLoggingIn: false, browserOpened: false, userCode: null }));
    }
  }, [invoke, checkAuth]);

  useEffect(() => {
    checkAuth();
    checkDependencies();
  }, [checkAuth, checkDependencies]);

  return {
    ...state,
    checkAuth,
    checkDependencies,
    login,
  };
}
