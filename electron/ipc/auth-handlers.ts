import { IpcMain, shell, BrowserWindow } from 'electron';
import { spawn } from 'child_process';

const CLIENT_ID = 'A1c4Noo77MdN7CB8QjUOvwtdyMZnSwkd';

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

  // Attempt to login to Yoto - custom implementation that opens browser
  ipcMain.handle('auth:login', async () => {
    try {
      // Import YotoClient and saveConfig from @lizozom/yoto
      const { YotoClient, saveConfig } = await import('@lizozom/yoto');

      const client = new YotoClient({ clientId: CLIENT_ID });

      // Start device flow to get the verification URL
      const deviceCode = await client.initDeviceFlow();

      // Open browser with the verification URL
      const verificationUrl = deviceCode.verification_uri_complete;
      console.log(`Opening browser: ${verificationUrl}`);
      await shell.openExternal(verificationUrl);

      // Notify renderer that browser was opened
      const mainWindow = getMainWindow();
      mainWindow?.webContents.send('auth:browser-opened', {
        url: verificationUrl,
        userCode: deviceCode.user_code,
      });

      // Poll for token
      const pollInterval = (deviceCode.interval || 5) * 1000;
      const expiresAt = Date.now() + deviceCode.expires_in * 1000;

      while (Date.now() < expiresAt) {
        await new Promise((resolve) => setTimeout(resolve, pollInterval));

        try {
          const tokens = await client.pollForToken(deviceCode.device_code);

          // Save config
          await saveConfig({
            clientId: CLIENT_ID,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
          });

          return { success: true };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          if (message === 'authorization_pending' || message === 'slow_down') {
            // Still waiting for user to authorize, continue polling
            continue;
          }
          throw err;
        }
      }

      return { success: false, error: 'Authorization timed out. Please try again.' };
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
