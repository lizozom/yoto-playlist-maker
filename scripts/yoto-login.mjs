#!/usr/bin/env node
// Yoto login. Delegates to @lizozom/yoto's PKCE loopback flow (>= 0.3.0).
// Usage: npm run yoto:login
//
// One-time setup (see .env.example):
//   1. Create a *public* client at https://dashboard.yoto.dev/
//   2. Register redirect URI  http://127.0.0.1:8787/callback
//   3. Enable "Allow Offline Access" (for refresh tokens)
//   4. Put the client id in .env:  YOTO_CLIENT_ID=...

import 'dotenv/config';
import { login } from '@lizozom/yoto';

const clientId = process.env.YOTO_CLIENT_ID?.trim();
if (!clientId) {
  console.error('\n✗ No YOTO_CLIENT_ID set.');
  console.error('  1. Create a public client at https://dashboard.yoto.dev/');
  console.error('  2. Register redirect URI: http://127.0.0.1:8787/callback');
  console.error('  3. Add to .env:  YOTO_CLIENT_ID=your-client-id\n');
  process.exit(1);
}

try {
  // login() opens the browser, runs the loopback callback, and saves config.
  // YOTO_SCOPES overrides the default scopes (e.g. drop offline_access).
  await login({ clientId, scope: process.env.YOTO_SCOPES?.trim() || undefined });
} catch (error) {
  console.error('\n✗ Authentication failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
