import React, { useState, useRef, useEffect } from 'react';
import { useAuth, type AuthStatus as AuthStatusType } from '../contexts/AuthContext';

interface AuthStatusProps {
  depsOk: boolean | null;
}

function AuthStatus({ depsOk }: AuthStatusProps) {
  const { auth, login, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async () => {
    setShowDropdown(false);
    await login();
  };

  const handleLogout = async () => {
    setShowDropdown(false);
    await logout();
  };

  const getAuthStatusDisplay = () => {
    switch (auth.status) {
      case 'checking':
        return (
          <>
            <span className="text-gray-400">Checking auth...</span>
          </>
        );
      case 'logging_in':
        return (
          <>
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span className="text-yellow-700">Logging in...</span>
          </>
        );
      case 'authenticated':
        return (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">Yoto connected</span>
          </>
        );
      case 'unauthenticated':
        return (
          <>
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-yellow-700">Not logged in</span>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="no-drag flex items-center gap-4 text-sm">
      {/* Dependencies Status */}
      <div className="flex items-center gap-1.5">
        {depsOk === null ? (
          <span className="text-gray-400">Checking tools...</span>
        ) : depsOk ? (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">Tools ready</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-red-600">Missing yt-dlp/ffmpeg</span>
          </>
        )}
      </div>

      {/* Auth Status with dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-1.5 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
          disabled={auth.status === 'checking' || auth.status === 'logging_in'}
        >
          {getAuthStatusDisplay()}
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
            {auth.status === 'authenticated' ? (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-xs text-gray-500">Logged in to Yoto</div>
                  {auth.username && (
                    <div className="text-sm font-medium text-gray-700 truncate">
                      {auth.username}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Log out</span>
                </button>
              </>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-xs text-gray-500">Not logged in</div>
                  <div className="text-sm text-gray-600">
                    Log in to upload playlists
                  </div>
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full px-4 py-2 text-left text-sm text-yoto-orange hover:bg-orange-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Log in</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthStatus;
