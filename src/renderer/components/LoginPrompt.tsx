import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPromptProps {
  onClose?: () => void;
  message?: string;
}

function LoginPrompt({ onClose, message }: LoginPromptProps) {
  const { auth, login } = useAuth();

  const handleLogin = async () => {
    await login();
  };

  const isLoggingIn = auth.status === 'logging_in';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🔐</span>
            <span>Login to Yoto</span>
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
              {message}
            </div>
          )}

          {auth.error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {auth.error}
            </div>
          )}

          {isLoggingIn ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 border-4 border-yoto-orange border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-700 font-medium mb-2">Opening browser...</p>
              <p className="text-gray-500 text-sm">
                Please log in with your Yoto account in the browser window that opens.
              </p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <strong>Waiting for authorization...</strong>
                <br />
                Complete the login in your browser to continue.
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🎵</div>
              <p className="text-gray-700 mb-2">
                Connect your Yoto account to upload playlists.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                A browser window will open for you to log in with your Yoto credentials.
              </p>

              <button
                onClick={handleLogin}
                className="w-full py-3 bg-yoto-orange text-white rounded-lg font-medium hover:bg-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Login with Yoto</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {onClose && !isLoggingIn && (
          <div className="border-t border-gray-100 px-6 py-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPrompt;
