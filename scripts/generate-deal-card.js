#!/usr/bin/env node
/**
 * Deal Card Image Generator for Instagram
 * Generates 1080x1080 Instagram-ready images from deal data
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available, fallback to basic HTML canvas approach
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('⚠️  Sharp not installed. Run: npm install sharp');
  process.exit(1);
}

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1080;

// Brand colors
const COLORS = {
  primary: '#FF6B35',    // Orange
  secondary: '#004E89',  // Blue
  accent: '#FFB81C',     // Yellow
  dark: '#1A1A2E',       // Dark background
  light: '#FFFFFF',      // White text
  success: '#22C55E'     // Green for discount
};

/**
 * Generate deal card image
 */
async function generateDealCard(deal, outputPath) {
  try {
    // Calculate discount percentage if available
    let discountPercent = null;
    if (deal.original_price && deal.price) {
      discountPercent = Math.round(
        ((deal.original_price - deal.price) / deal.original_price) * 100
      );
    }

    // Create SVG card
    const svg = `
      <svg width="${CARD_WIDTH}" height="${CARD_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="${COLORS.dark}"/>
        
        <!-- Top bar with logo -->
        <rect x="0" y="0" width="${CARD_WIDTH}" height="120" fill="${COLORS.primary}"/>
        <text x="540" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
              fill="${COLORS.light}" text-anchor="middle">THE HUB</text>
        
        <!-- Deal Score Badge -->
        <circle cx="920" cy="60" r="50" fill="${COLORS.accent}"/>
        <text x="920" y="75" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
              fill="${COLORS.dark}" text-anchor="middle">${deal.score || 0}</text>
        
        <!-- Product Title -->
        <text x="540" y="250" font-family="Arial, sans-serif" font-size="42" font-weight="bold" 
              fill="${COLORS.light}" text-anchor="middle">${escapeXml(truncate(deal.title || 'Hot Deal', 50))}</text>
        
        <!-- Price Section -->
        <text x="540" y="480" font-family="Arial, sans-serif" font-size="96" font-weight="bold" 
              fill="${COLORS.accent}" text-anchor="middle">$${deal.price || '??'}</text>
        
        ${deal.original_price ? `
          <line x1="400" y1="580" x2="680" y2="580" stroke="${COLORS.light}" stroke-width="4"/>
          <text x="540" y="610" font-family="Arial, sans-serif" font-size="36" 
                fill="${COLORS.light}" text-anchor="middle">$${deal.original_price}</text>
        ` : ''}
        
        ${discountPercent ? `
          <rect x="400" y="650" width="280" height="80" rx="15" fill="${COLORS.success}"/>
          <text x="540" y="705" font-family="Arial, sans-serif" font-size="42" font-weight="bold" 
                fill="${COLORS.light}" text-anchor="middle">-${discountPercent}% OFF</text>
        ` : ''}
        
        <!-- Source -->
        <text x="540" y="850" font-family="Arial, sans-serif" font-size="32" 
              fill="${COLORS.light}" text-anchor="middle">Source: ${deal.source || 'Unknown'}</text>
        
        <!-- Category Badge -->
        <rect x="350" y="920" width="380" height="60" rx="30" fill="${COLORS.secondary}"/>
        <text x="540" y="960" font-family="Arial, sans-serif" font-size="28" 
              fill="${COLORS.light}" text-anchor="middle">${getCategoryEmoji(deal.category)} ${deal.category || 'Deal'}</text>
      </svg>
    `;

    // Convert SVG to PNG using sharp
    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);

    console.log(`✅ Generated card: ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('❌ Error generating card:', error);
    throw error;
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Truncate text to specified length
 */
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category) {
  const map = {
    'watches': '⌚',
    'sneakers': '👟',
    'cars': '🚗',
    'sports': '⚽',
    'tech': '💻'
  };
  return map[category?.toLowerCase()] || '🔥';
}

/**
 * CLI Usage
 */
async function main() {
  if (process.argv.length < 3) {
    console.log('Usage: node generate-deal-card.js <deal-json> [output-path]');
    console.log('Example: node generate-deal-card.js \'{"title":"Watch","price":499,"score":12}\' deal.png');
    process.exit(1);
  }

  const dealJson = process.argv[2];
  const outputPath = process.argv[3] || 'deal-card.png';

  try {
    const deal = JSON.parse(dealJson);
    await generateDealCard(deal, outputPath);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { generateDealCard };

// Run CLI if called directly
if (require.main === module) {
  main();
}
