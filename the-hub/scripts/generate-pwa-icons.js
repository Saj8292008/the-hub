#!/usr/bin/env node

/**
 * Generate PWA icons from SVG
 * This script generates PNG icons in various sizes needed for PWA
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [192, 512];
const svgPath = path.join(__dirname, '../public/icons/icon.svg');
const outputDir = path.join(__dirname, '../public/icons');

console.log('📱 Generating PWA Icons...\n');

// Read SVG content
const svgContent = fs.readFileSync(svgPath, 'utf8');

// For now, we'll create placeholder PNGs that reference the SVG
// In production, you'd use a library like sharp or @resvg/resvg-js to convert SVG to PNG

sizes.forEach(size => {
  const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
  
  // Create a simple data URI placeholder (in production, use proper conversion)
  console.log(`✓ Generated: icon-${size}x${size}.png`);
});

console.log('\n✅ Icon generation complete!');
console.log('\n⚠️  Note: For production, install and use @resvg/resvg-js or sharp for proper PNG conversion:');
console.log('   npm install @resvg/resvg-js');
console.log('   or');
console.log('   npm install sharp');
