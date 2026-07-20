import { IpcMain, shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';

export function registerAuthHandlers(ipcMain: IpcMain, getMainWindow: () => BrowserWindow | null) {
  // Check if user is authenticated with Yoto
  ipcMain.handle('auth:check', async () => {
    try {
      const { checkAuth } = await import('../../src/yoto-uploader');
      const isAuthenticated = await checkAuth();
      return { success: true, authenticated: isAuthenticated };
    } catch (error) {
      return {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Failed to check auth',
      };
    }
  });

  // Log in to Yoto via the package's PKCE loopback flow. The client id comes
  // from YOTO_CLIENT_ID (create a public client at https://dashboard.yoto.dev/
  // and register http://127.0.0.1:8787/callback as a redirect URI).
  ipcMain.handle('auth:login', async () => {
    try {
      const { login } = await import('@lizozom/yoto');

      const clientId = process.env.YOTO_CLIENT_ID?.trim();
      if (!clientId) {
        return {
          success: false,
          error:
            'YOTO_CLIENT_ID is not set. Create a public client at ' +
            'https://dashboard.yoto.dev/ and set YOTO_CLIENT_ID.',
        };
      }

      // login() opens the browser + runs a local callback server itself. We hook
      // onAuthorizeUrl only to open the URL in the user's browser and mirror it
      // to the renderer so the UI can show a "waiting for authorization" state.
      await login({
        clientId,
        onAuthorizeUrl: (url) => {
          console.log(`Opening browser: ${url}`);
          void shell.openExternal(url);
          getMainWindow()?.webContents.send('auth:browser-opened', { url });
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to login',
      };
    }
  });

  // Check external dependencies (yt-dlp, ffmpeg)
  ipcMain.handle('system:check-deps', async () => {
    const deps = [
      { name: 'yt-dlp', command: 'yt-dlp', args: ['--version'] },
      { name: 'ffmpeg', command: 'ffmpeg', args: ['-version'] },
    ];

    const results = await Promise.all(
      deps.map(async (dep) => {
        try {
          return new Promise<{ name: string; found: boolean; version?: string }>((resolve) => {
            const proc = spawn(dep.command, dep.args, { shell: true });
            let output = '';

            proc.stdout?.on('data', (data) => {
              output += data.toString();
            });

            proc.on('close', (code) => {
              if (code === 0) {
                // Extract version from first line
                const version = output.split('\n')[0]?.trim();
                resolve({ name: dep.name, found: true, version });
              } else {
                resolve({ name: dep.name, found: false });
              }
            });

            proc.on('error', () => {
              resolve({ name: dep.name, found: false });
            });

            // Timeout after 5 seconds
            setTimeout(() => {
              proc.kill();
              resolve({ name: dep.name, found: false });
            }, 5000);
          });
        } catch {
          return { name: dep.name, found: false };
        }
      })
    );

    return { success: true, dependencies: results };
  });
}
