#!/usr/bin/env node
// Yoto login script for Windows
// Usage: node scripts/yoto-login.mjs

import { login } from '@lizozom/yoto';

console.log('Starting Yoto authentication...');
console.log('A browser window will open for you to log in.\n');

try {
  await login();
  console.log('\n✓ Successfully authenticated with Yoto!');
  console.log('Your credentials are saved in ~/.yoto/config.json');
} catch (error) {
  console.error('\n✗ Authentication failed:', error.message);
  process.exit(1);
}
