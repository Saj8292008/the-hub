#!/usr/bin/env node

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon-512x512.svg');

console.log('🎨 Converting SVG to PNG icons...\n');

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 512, name: 'icon-512x512.png' }
];

async function convertIcons() {
  try {
    // Read SVG
    const svgBuffer = fs.readFileSync(svgPath);

    // Convert to each size
    for (const { size, name } of sizes) {
      const outputPath = path.join(iconsDir, name);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Created: ${name} (${size}x${size})`);
    }

    console.log('\n🎉 Icon generation complete!');
    console.log('📍 Icons saved to: public/icons/');
    
  } catch (error) {
    console.error('❌ Error converting icons:', error.message);
    process.exit(1);
  }
}

convertIcons();
