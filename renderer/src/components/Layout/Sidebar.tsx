import { FileUp, ListMusic, Download, Upload, FolderOpen } from 'lucide-react';
import packageJson from '../../../../package.json';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'import', label: 'Import CSV', icon: FileUp },
  { id: 'playlist', label: 'Edit Playlist', icon: ListMusic },
  { id: 'download', label: 'Download', icon: Download },
  { id: 'upload', label: 'Upload to Yoto', icon: Upload },
  { id: 'yoto', label: 'Yoto Playlists', icon: FolderOpen },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <aside className="w-56 bg-[var(--bg-secondary)] border-r border-gray-700 flex flex-col">
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <li key={tab.id}>
                <button
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-gray-300 hover:bg-[var(--bg-tertiary)] hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-gray-700">
        <p className="text-xs text-gray-500 text-center">
          v{packageJson.version}
        </p>
      </div>
    </aside>
  );
}
