import React from 'react';

interface AuthStatusProps {
  isAuthenticated: boolean | null;
  depsOk: boolean | null;
}

function AuthStatus({ isAuthenticated, depsOk }: AuthStatusProps) {
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

      {/* Auth Status */}
      <div className="flex items-center gap-1.5">
        {isAuthenticated === null ? (
          <span className="text-gray-400">Checking auth...</span>
        ) : isAuthenticated ? (
          <>
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-gray-600">Yoto connected</span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 bg-yellow-500 rounded-full" />
            <span className="text-yellow-700">Not logged in</span>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthStatus;
