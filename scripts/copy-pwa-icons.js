#!/usr/bin/env node
/**
 * Copies the app icon to public/ for PWA manifest (192/512 icons).
 * Run before `expo export -p web` so dist contains icon.png.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'assets', 'images', 'icon.png');
const dest = path.join(root, 'public', 'icon.png');

if (!fs.existsSync(src)) {
  console.warn('copy-pwa-icons: assets/images/icon.png not found, skipping.');
  process.exit(0);
}

const publicDir = path.join(root, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
fs.copyFileSync(src, dest);
console.log('copy-pwa-icons: copied icon.png to public/');
