import { shell } from 'electron';
import {
  YotoClient,
  loadConfig,
  saveConfig,
  clearConfig,
} from '@lizozom/yoto';

const CLIENT_ID = 'A1c4Noo77MdN7CB8QjUOvwtdyMZnSwkd';

export interface AuthResult {
  success: boolean;
  username?: string;
  error?: string;
}

export interface DeviceFlowStatus {
  status: 'pending' | 'complete' | 'error' | 'timeout';
  verificationUrl?: string;
  userCode?: string;
  error?: string;
}

/**
 * Start the OAuth device flow login process
 * Opens the browser for user to authorize the app
 */
export async function startLogin(
  onStatusChange?: (status: DeviceFlowStatus) => void
): Promise<AuthResult> {
  try {
    const client = new YotoClient({ clientId: CLIENT_ID });

    // Initialize device flow
    const deviceCode = await client.initDeviceFlow();

    // Notify about pending status with URL
    onStatusChange?.({
      status: 'pending',
      verificationUrl: deviceCode.verification_uri_complete,
      userCode: deviceCode.user_code,
    });

    // Open browser for authentication
    await shell.openExternal(deviceCode.verification_uri_complete);

    // Poll for token
    const pollInterval = (deviceCode.interval || 5) * 1000;
    const expiresAt = Date.now() + deviceCode.expires_in * 1000;

    while (Date.now() < expiresAt) {
      await new Promise((resolve) => setTimeout(resolve, pollInterval));

      try {
        const tokens = await client.pollForToken(deviceCode.device_code);

        // Save credentials
        await saveConfig({
          clientId: CLIENT_ID,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });

        onStatusChange?.({ status: 'complete' });

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message === 'authorization_pending' || message === 'slow_down') {
          // Continue polling
          continue;
        }
        throw err;
      }
    }

    // Timeout
    onStatusChange?.({ status: 'timeout', error: 'Authorization timed out' });
    return { success: false, error: 'Authorization timed out. Please try again.' };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    onStatusChange?.({ status: 'error', error });
    return { success: false, error };
  }
}

/**
 * Perform logout by clearing stored credentials
 */
export async function performLogout(): Promise<void> {
  await clearConfig();
}

/**
 * Get current authentication status
 */
export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const config = await loadConfig();

    if (!config?.accessToken) {
      return { authenticated: false };
    }

    // Verify token is still valid by making a test request
    const client = new YotoClient({
      clientId: config.clientId,
      accessToken: config.accessToken,
      refreshToken: config.refreshToken,
    });

    try {
      await client.listContent();
      return { authenticated: true };
    } catch {
      return {
        authenticated: false,
        error: 'Token expired. Please log in again.',
      };
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { authenticated: false, error };
  }
}
