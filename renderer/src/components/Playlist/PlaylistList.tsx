import { useEffect, useState } from 'react';
import { useIpcInvoke } from '../../hooks';
import { usePlaylistStore } from '../../store';
import { YotoPlaylist } from '../../types';
import { Loader2, RefreshCw, Trash2, Music, Cloud } from 'lucide-react';

export function PlaylistList() {
  const invoke = useIpcInvoke();
  const { yotoPlaylists, setYotoPlaylists } = usePlaylistStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<{ success: boolean; playlists?: YotoPlaylist[]; error?: string }>(
        'playlist:list-yoto'
      );
      if (result.success && result.playlists) {
        setYotoPlaylists(result.playlists);
      } else {
        setError(result.error || 'Failed to fetch playlists');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (cardId: string) => {
    if (!confirm('Are you sure you want to delete this playlist from Yoto?')) {
      return;
    }

    setDeletingId(cardId);
    try {
      const result = await invoke<{ success: boolean; error?: string }>(
        'playlist:delete',
        { cardId }
      );
      if (result.success) {
        setYotoPlaylists(yotoPlaylists.filter((p) => p.cardId !== cardId));
      } else {
        setError(result.error || 'Failed to delete playlist');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete playlist');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Yoto Playlists
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Playlists stored in your Yoto account
          </p>
        </div>
        <button
          onClick={fetchPlaylists}
          disabled={loading}
          className="btn btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading && yotoPlaylists.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-500" />
          <p className="text-gray-500 mt-2">Loading playlists...</p>
        </div>
      ) : yotoPlaylists.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No playlists found</p>
          <p className="text-sm">Create a playlist and upload it to see it here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {yotoPlaylists.map((playlist) => (
            <div
              key={playlist.cardId}
              className="flex items-center justify-between p-4 bg-[var(--bg-tertiary)]/30 rounded-lg hover:bg-[var(--bg-tertiary)]/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--accent)]/20 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div>
                  <p className="font-medium">{playlist.title}</p>
                  <p className="text-xs text-gray-500">ID: {playlist.cardId}</p>
                </div>
              </div>

              <button
                onClick={() => handleDelete(playlist.cardId)}
                disabled={deletingId === playlist.cardId}
                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                title="Delete playlist"
              >
                {deletingId === playlist.cardId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
