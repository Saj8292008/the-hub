#!/usr/bin/env node
/**
 * auto-post-reel.js — End-to-end Reel pipeline
 * 
 * 1. Pulls hot deals from The Hub
 * 2. Generates premium images via Gemini Pro (OpenRouter)
 * 3. Generates video via Kimi 2.5 (OpenRouter)
 * 4. Publishes to Instagram via Graph API
 * 
 * Usage:
 *   node auto-post-reel.js                    # Auto-pick best deal
 *   node auto-post-reel.js --product "Omega"  # Specific product
 *   node auto-post-reel.js --dry-run          # Preview without posting
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { postReel } = require('./ig-api.js');

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const OUTPUT_DIR = path.join(__dirname, '../../content/reels');

// ── OpenRouter Helper ────────────────────────────────────

async function callOpenRouter(model, messages, options = {}) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://thehubdeals.com',
      'X-Title': 'The Hub - Auto Reel'
    },
    body: JSON.stringify({ model, messages, ...options }),
  });
  return res.json();
}

// ── Step 1: Get Deal Data ────────────────────────────────

async function getTopDeal(productFilter) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    
    let query = sb.from('watch_listings')
      .select('title, price, source, url, brand, score, condition')
      .order('score', { ascending: false })
      .limit(10);
    
    if (productFilter) {
      query = query.ilike('title', `%${productFilter}%`);
    }
    
    const { data } = await query;
    return data?.[0] || null;
  } catch (e) {
    // Fallback to API
    const res = await fetch('http://localhost:4003/api/dashboard/status');
    const dashboard = await res.json();
    const activity = dashboard.activity || [];
    if (productFilter) {
      return activity.find(a => a.title.toLowerCase().includes(productFilter.toLowerCase())) || activity[0];
    }
    return activity[0];
  }
}

// ── Step 2: Generate Image ───────────────────────────────

async function generateImage(deal) {
  const brand = deal.brand || extractBrand(deal.title);
  const cleanTitle = deal.title.replace(/^\[WTS\]\s*/i, '');
  
  const prompt = `Cinematic luxury product photography of a ${brand || ''} ${cleanTitle.substring(0, 60)} watch. ` +
    `Dramatic side lighting on dark marble surface. Shallow depth of field. ` +
    `Ultra-premium advertising quality. Dark moody background. 4K detail. Vertical 9:16 format.`;

  console.log('🎨 Generating premium image...');
  const result = await callOpenRouter('google/gemini-3-pro-image-preview', [
    { role: 'user', content: prompt }
  ], { max_tokens: 4096 });

  const content = result.choices?.[0]?.message?.content;
  if (!content) throw new Error('No image generated');

  // Extract and save image
  const reelDir = path.join(OUTPUT_DIR, `reel-${Date.now()}`);
  fs.mkdirSync(reelDir, { recursive: true });
  
  let imagePath;
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const base64 = part.image_url.url.replace(/^data:image\/\w+;base64,/, '');
        imagePath = path.join(reelDir, 'hero.png');
        fs.writeFileSync(imagePath, Buffer.from(base64, 'base64'));
        break;
      }
    }
  }
  
  if (!imagePath) {
    // Save raw response for debugging
    fs.writeFileSync(path.join(reelDir, 'image-response.json'), JSON.stringify(content, null, 2));
    throw new Error('Could not extract image from response');
  }

  console.log(`✅ Image saved: ${imagePath}`);
  return { imagePath, reelDir };
}

// ── Step 3: Generate Video via Kimi 2.5 ──────────────────

async function generateVideo(deal, imagePath) {
  const cleanTitle = deal.title.replace(/^\[WTS\]\s*/i, '').substring(0, 60);
  const price = deal.price ? `$${deal.price.toLocaleString()}` : '';

  console.log('🎬 Generating video with Kimi 2.5...');
  
  // Read image as base64 for Kimi
  const imageBase64 = fs.readFileSync(imagePath).toString('base64');
  const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

  const result = await callOpenRouter('moonshotai/kimi-k2.5', [
    {
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` }
        },
        {
          type: 'text',
          text: `Create a 10-second cinematic product video from this luxury watch image. ` +
            `Slow dramatic zoom in, subtle light reflections moving across the watch face, ` +
            `particles of light in the background. Premium luxury brand advertisement feel. ` +
            `Product: ${cleanTitle} ${price}. Dark moody atmosphere.`
        }
      ]
    }
  ], { max_tokens: 4096 });

  // Kimi returns video data or URL
  const content = result.choices?.[0]?.message?.content;
  const reelDir = path.dirname(imagePath);
  
  // Save video (handle various response formats)
  let videoPath = path.join(reelDir, 'reel.mp4');
  
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'video_url' || part.type === 'video') {
        const videoUrl = part.video_url?.url || part.video;
        if (videoUrl.startsWith('data:')) {
          const base64 = videoUrl.replace(/^data:video\/\w+;base64,/, '');
          fs.writeFileSync(videoPath, Buffer.from(base64, 'base64'));
        } else if (videoUrl.startsWith('http')) {
          const res = await fetch(videoUrl);
          fs.writeFileSync(videoPath, Buffer.from(await res.arrayBuffer()));
        }
        break;
      }
    }
  }

  // If we got text back instead of video, save for debugging
  if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
    fs.writeFileSync(path.join(reelDir, 'video-response.json'), JSON.stringify(content, null, 2));
    console.log('⚠️ Video generation returned text — may need different approach');
    console.log('  Response saved to video-response.json for inspection');
    return null;
  }

  console.log(`✅ Video saved: ${videoPath}`);
  return videoPath;
}

// ── Step 4: Generate Caption ─────────────────────────────

function generateCaption(deal) {
  const cleanTitle = deal.title.replace(/^\[WTS\]\s*/i, '');
  const price = deal.price ? `$${deal.price.toLocaleString()}` : '';
  const brand = deal.brand || extractBrand(deal.title) || 'Watch';

  return `🔥 ${cleanTitle}\n` +
    `💰 ${price}\n\n` +
    `Found this on ${deal.source || 'the market'}. Is this a cop or a drop? 👇\n\n` +
    `Follow @thehubdeals08 for daily watch deals\n\n` +
    `#${brand.replace(/\s/g, '')} #watches #watchdeals #luxury #thehubdeals ` +
    `#watchcollector #horology #wristwatch #affordablewatches #dailywatch`;
}

// ── Utilities ────────────────────────────────────────────

function extractBrand(title) {
  const brands = ['Omega', 'Rolex', 'Seiko', 'Tudor', 'Longines', 'Breitling',
    'Tag Heuer', 'Cartier', 'IWC', 'Panerai', 'Grand Seiko', 'Oris',
    'Hamilton', 'Tissot', 'Sinn', 'Nomos', 'Zenith', 'Casio'];
  const lower = (title || '').toLowerCase();
  return brands.find(b => lower.includes(b.toLowerCase())) || null;
}

// ── Main Pipeline ────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const product = args.includes('--product') ? args[args.indexOf('--product') + 1] : null;

  console.log('🚀 Auto-Post Reel Pipeline');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  // Step 1: Get deal
  console.log('📊 Step 1: Finding top deal...');
  const deal = await getTopDeal(product);
  if (!deal) { console.log('❌ No deals found'); return; }
  console.log(`   ${deal.title} — $${deal.price}`);

  // Step 2: Generate image
  console.log('\n🎨 Step 2: Generating premium image...');
  const { imagePath, reelDir } = await generateImage(deal);

  // Step 3: Generate video
  console.log('\n🎬 Step 3: Generating video with Kimi 2.5...');
  const videoPath = await generateVideo(deal, imagePath);

  // Step 4: Generate caption
  const caption = generateCaption(deal);
  console.log('\n📝 Step 4: Caption generated');
  console.log(`   ${caption.substring(0, 100)}...`);

  // Save metadata
  fs.writeFileSync(path.join(reelDir, 'metadata.json'), JSON.stringify({
    deal, caption, imagePath, videoPath,
    generatedAt: new Date().toISOString(),
    posted: false,
  }, null, 2));

  if (dryRun) {
    console.log('\n✅ DRY RUN complete. Files saved to:', reelDir);
    console.log('   Run without --dry-run to publish to Instagram.');
    return;
  }

  if (!videoPath) {
    console.log('\n⚠️ No video generated — skipping publish step.');
    console.log('   Fix video generation, then run: node ig-api.js post-reel --url <video_url> --caption "..."');
    return;
  }

  // Step 5: Upload video to a public URL (required by Graph API)
  // The video needs to be accessible via URL for Instagram to process
  console.log('\n📤 Step 5: Publishing to Instagram...');
  console.log('   ⚠️ Video must be at a public URL for Graph API.');
  console.log(`   Local path: ${videoPath}`);
  console.log('   Upload to a CDN/hosting first, then run:');
  console.log(`   node ig-api.js post-reel --url <PUBLIC_URL> --caption "${caption.substring(0, 50)}..."`);
  
  // TODO: Auto-upload to Supabase Storage or R2 for public URL
}

main().catch(err => {
  console.error('❌ Pipeline error:', err.message);
  process.exit(1);
});
