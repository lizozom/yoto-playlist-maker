import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated' | 'logging_in';

interface AuthState {
  status: AuthStatus;
  username?: string;
  error?: string;
}

interface AuthContextValue {
  auth: AuthState;
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [auth, setAuth] = useState<AuthState>({
    status: 'checking',
  });

  // Check authentication status
  const checkAuth = useCallback(async () => {
    setAuth(prev => ({ ...prev, status: 'checking', error: undefined }));

    try {
      const status = await window.electronAPI.getAuthStatus();
      setAuth(status.authenticated
        ? { status: 'authenticated', username: status.username }
        : { status: 'unauthenticated', error: status.error }
      );
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to check auth status';
      setAuth({ status: 'unauthenticated', error });
    }
  }, []);

  // Start login flow
  const login = useCallback(async (): Promise<boolean> => {
    setAuth((prev) => ({ ...prev, status: 'logging_in', error: undefined }));

    try {
      const success = await window.electronAPI.login();

      if (success) {
        setAuth({
          status: 'authenticated',
        });
        return true;
      } else {
        setAuth({
          status: 'unauthenticated',
          error: 'Login failed or was cancelled',
        });
        return false;
      }
    } catch (err) {
      setAuth({
        status: 'unauthenticated',
        error: err instanceof Error ? err.message : 'Login failed',
      });
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await window.electronAPI.logout();
      setAuth({
        status: 'unauthenticated',
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Still set as unauthenticated even if logout fails
      setAuth({
        status: 'unauthenticated',
        error: err instanceof Error ? err.message : 'Logout failed',
      });
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ auth, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
