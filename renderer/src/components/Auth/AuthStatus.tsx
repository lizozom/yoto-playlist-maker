import { useAuth } from '../../hooks';
import { CheckCircle, Loader2, AlertTriangle, LogIn, ExternalLink } from 'lucide-react';

export function AuthStatus() {
  const { isAuthenticated, isChecking, isLoggingIn, browserOpened, userCode, dependencies, checkAuth, login } = useAuth();

  const missingDeps = dependencies.filter((d) => !d.found);

  if (isChecking) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {missingDeps.length > 0 && (
        <div className="flex items-center gap-2 text-yellow-400" title={`Missing: ${missingDeps.map(d => d.name).join(', ')}`}>
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Missing tools</span>
        </div>
      )}

      {isAuthenticated ? (
        <button
          onClick={checkAuth}
          className="flex items-center gap-2"
          title="Yoto: Connected (click to refresh)"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Yoto Connected</span>
        </button>
      ) : isLoggingIn && browserOpened ? (
        <div className="flex items-center gap-2 text-blue-400" title="Please complete login in your browser">
          <ExternalLink className="w-4 h-4" />
          <span className="text-sm">
            Waiting for browser login...
            {userCode && <span className="ml-1 font-mono text-xs">({userCode})</span>}
          </span>
          <Loader2 className="w-3 h-3 animate-spin" />
        </div>
      ) : (
        <button
          onClick={login}
          disabled={isLoggingIn}
          className="flex items-center gap-2 px-3 py-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded text-white text-sm disabled:opacity-50"
          title="Click to login to Yoto"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Opening browser...</span>
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              <span>Login to Yoto</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
