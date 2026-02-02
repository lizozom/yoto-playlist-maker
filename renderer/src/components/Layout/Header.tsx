import { Music } from 'lucide-react';
import { AuthStatus } from '../Auth/AuthStatus';

export function Header() {
  return (
    <header className="h-14 bg-[var(--bg-secondary)] border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center">
          <Music className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-lg font-semibold">Yoto Playlist Maker</h1>
      </div>

      <div className="flex items-center gap-4">
        <AuthStatus />
      </div>
    </header>
  );
}
