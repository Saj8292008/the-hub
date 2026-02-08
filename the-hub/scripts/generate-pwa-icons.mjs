#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '..', 'public', 'icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('⚠️  Creating placeholder icons...');
console.log('📝 Note: Replace these with actual icons using the generate-icons.html file');
console.log('   Open public/icons/generate-icons.html in a browser to create proper icons\n');

// SVG content
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#6366f1"/>
  <g transform="translate(256, 256)">
    <circle cx="0" cy="0" r="40" fill="#ffffff"/>
    <circle cx="0" cy="-120" r="30" fill="#ffffff" opacity="0.9"/>
    <circle cx="104" cy="-60" r="30" fill="#ffffff" opacity="0.9"/>
    <circle cx="104" cy="60" r="30" fill="#ffffff" opacity="0.9"/>
    <circle cx="0" cy="120" r="30" fill="#ffffff" opacity="0.9"/>
    <circle cx="-104" cy="60" r="30" fill="#ffffff" opacity="0.9"/>
    <circle cx="-104" cy="-60" r="30" fill="#ffffff" opacity="0.9"/>
    <line x1="0" y1="0" x2="0" y2="-120" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
    <line x1="0" y1="0" x2="104" y2="-60" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
    <line x1="0" y1="0" x2="104" y2="60" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
    <line x1="0" y1="0" x2="0" y2="120" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
    <line x1="0" y1="0" x2="-104" y2="60" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
    <line x1="0" y1="0" x2="-104" y2="-60" stroke="#ffffff" stroke-width="8" opacity="0.6"/>
  </g>
  <text x="256" y="440" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="#ffffff" text-anchor="middle">THE HUB</text>
</svg>`;

// Save SVG versions (can be used temporarily)
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), svgContent);
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), svgContent);

console.log('✅ Created SVG icon files');
console.log('');
console.log('To create PNG icons (REQUIRED for PWA):');
console.log('1. Open: public/icons/generate-icons.html in Chrome/Firefox');
console.log('2. Icons will auto-download');
console.log('3. Move downloaded PNGs to: public/icons/');
console.log('');
console.log('Or convert online: https://cloudconvert.com/svg-to-png');

