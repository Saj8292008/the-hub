#!/usr/bin/env node
/**
 * ig-api.js — Instagram Graph API client for The Hub
 * 
 * Handles: single image posts, carousels, reels, and status checking.
 * 
 * Usage:
 *   node ig-api.js post-image --url "https://..." --caption "Deal alert!"
 *   node ig-api.js post-reel --url "https://..." --caption "Watch this deal"
 *   node ig-api.js post-carousel --urls "url1,url2,url3" --caption "Top 5 deals"
 *   node ig-api.js status
 *   node ig-api.js test
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const GRAPH_API = 'https://graph.facebook.com/v24.0';
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_ACCOUNT_ID;

// ── Helpers ──────────────────────────────────────────────

async function graphPost(endpoint, params) {
  const url = `${GRAPH_API}${endpoint}`;
  const body = { ...params, access_token: ACCESS_TOKEN };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  
  const data = await res.json();
  if (data.error) throw new Error(`Graph API: ${data.error.message} (code ${data.error.code})`);
  return data;
}

async function graphGet(endpoint, params = {}) {
  const qs = new URLSearchParams({ ...params, access_token: ACCESS_TOKEN }).toString();
  const res = await fetch(`${GRAPH_API}${endpoint}?${qs}`);
  const data = await res.json();
  if (data.error) throw new Error(`Graph API: ${data.error.message} (code ${data.error.code})`);
  return data;
}

function requireConfig() {
  if (!ACCESS_TOKEN) throw new Error('Missing INSTAGRAM_ACCESS_TOKEN in .env');
  if (!IG_ACCOUNT_ID) throw new Error('Missing INSTAGRAM_ACCOUNT_ID in .env');
}

// ── Publishing ───────────────────────────────────────────

async function postImage(imageUrl, caption) {
  requireConfig();
  
  console.log('📸 Creating image container...');
  const container = await graphPost(`/${IG_ACCOUNT_ID}/media`, {
    image_url: imageUrl,
    caption,
  });
  
  console.log(`📦 Container created: ${container.id}`);
  console.log('📤 Publishing...');
  
  const result = await graphPost(`/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });
  
  console.log(`✅ Published! Post ID: ${result.id}`);
  return result;
}

async function postReel(videoUrl, caption, options = {}) {
  requireConfig();
  
  console.log('🎬 Creating reel container...');
  const containerParams = {
    video_url: videoUrl,
    caption,
    media_type: 'REELS',
  };
  
  if (options.coverUrl) containerParams.cover_url = options.coverUrl;
  if (options.thumbOffset) containerParams.thumb_offset = options.thumbOffset;
  if (options.shareToFeed !== undefined) containerParams.share_to_feed = options.shareToFeed;
  
  const container = await graphPost(`/${IG_ACCOUNT_ID}/media`, containerParams);
  console.log(`📦 Container created: ${container.id}`);
  
  // Poll for video processing completion
  console.log('⏳ Waiting for video processing...');
  let status = 'IN_PROGRESS';
  let attempts = 0;
  const maxAttempts = 30; // 5 min max
  
  while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
    await new Promise(r => setTimeout(r, 10000)); // 10 sec intervals
    attempts++;
    
    const check = await graphGet(`/${container.id}`, { fields: 'status_code,status' });
    status = check.status_code;
    console.log(`  [${attempts}/${maxAttempts}] Status: ${status}`);
    
    if (status === 'ERROR') {
      throw new Error(`Video processing failed: ${check.status || 'unknown error'}`);
    }
  }
  
  if (status !== 'FINISHED') {
    throw new Error(`Video processing timed out after ${maxAttempts * 10}s`);
  }
  
  console.log('📤 Publishing reel...');
  const result = await graphPost(`/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });
  
  console.log(`✅ Reel published! Post ID: ${result.id}`);
  return result;
}

async function postCarousel(imageUrls, caption) {
  requireConfig();
  
  console.log(`🎠 Creating carousel with ${imageUrls.length} items...`);
  
  // Create individual media containers
  const childIds = [];
  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`  📸 Item ${i + 1}/${imageUrls.length}...`);
    const child = await graphPost(`/${IG_ACCOUNT_ID}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: true,
    });
    childIds.push(child.id);
  }
  
  // Create carousel container
  console.log('📦 Creating carousel container...');
  const container = await graphPost(`/${IG_ACCOUNT_ID}/media`, {
    media_type: 'CAROUSEL',
    caption,
    children: childIds.join(','),
  });
  
  console.log('📤 Publishing carousel...');
  const result = await graphPost(`/${IG_ACCOUNT_ID}/media_publish`, {
    creation_id: container.id,
  });
  
  console.log(`✅ Carousel published! Post ID: ${result.id}`);
  return result;
}

// ── Account Info ─────────────────────────────────────────

async function getAccountStatus() {
  requireConfig();
  
  const info = await graphGet(`/${IG_ACCOUNT_ID}`, {
    fields: 'username,name,biography,followers_count,follows_count,media_count,profile_picture_url',
  });
  
  console.log('📊 Instagram Account Status');
  console.log(`  Username: @${info.username}`);
  console.log(`  Name: ${info.name || '(none)'}`);
  console.log(`  Followers: ${info.followers_count}`);
  console.log(`  Following: ${info.follows_count}`);
  console.log(`  Posts: ${info.media_count}`);
  
  return info;
}

async function testConnection() {
  requireConfig();
  
  console.log('🧪 Testing Instagram Graph API connection...');
  console.log(`  Account ID: ${IG_ACCOUNT_ID}`);
  console.log(`  Token: ${ACCESS_TOKEN.substring(0, 10)}...${ACCESS_TOKEN.slice(-5)}`);
  
  try {
    const info = await getAccountStatus();
    console.log('\n✅ Connection successful!');
    return true;
  } catch (err) {
    console.error(`\n❌ Connection failed: ${err.message}`);
    return false;
  }
}

// ── Token Management ─────────────────────────────────────

async function exchangeLongLivedToken(shortToken, appId, appSecret) {
  const url = `${GRAPH_API}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.error) throw new Error(data.error.message);
  
  console.log('✅ Long-lived token generated!');
  console.log(`  Token: ${data.access_token.substring(0, 20)}...`);
  console.log(`  Expires in: ${Math.round(data.expires_in / 86400)} days`);
  console.log('\n  Add to .env:');
  console.log(`  INSTAGRAM_ACCESS_TOKEN=${data.access_token}`);
  
  return data.access_token;
}

async function refreshToken() {
  requireConfig();
  
  const url = `${GRAPH_API}/oauth/access_token?grant_type=ig_refresh_token&access_token=${ACCESS_TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.error) throw new Error(data.error.message);
  
  console.log('🔄 Token refreshed!');
  console.log(`  New token: ${data.access_token.substring(0, 20)}...`);
  console.log(`  Expires in: ${Math.round(data.expires_in / 86400)} days`);
  
  return data.access_token;
}

// ── CLI ──────────────────────────────────────────────────

async function main() {
  const [command, ...args] = process.argv.slice(2);
  
  const getArg = (flag) => {
    const idx = args.indexOf(flag);
    return idx >= 0 ? args[idx + 1] : null;
  };

  switch (command) {
    case 'status':
      await getAccountStatus();
      break;
      
    case 'test':
      await testConnection();
      break;
      
    case 'post-image':
      await postImage(getArg('--url'), getArg('--caption') || '#TheHub #watches');
      break;
      
    case 'post-reel':
      await postReel(getArg('--url'), getArg('--caption') || '#TheHub #watches', {
        coverUrl: getArg('--cover'),
        shareToFeed: true,
      });
      break;
      
    case 'post-carousel':
      const urls = (getArg('--urls') || '').split(',');
      await postCarousel(urls, getArg('--caption') || '#TheHub #watches');
      break;
      
    case 'exchange-token':
      await exchangeLongLivedToken(getArg('--token'), getArg('--app-id'), getArg('--secret'));
      break;

    case 'refresh-token':
      await refreshToken();
      break;
      
    default:
      console.log(`
Instagram Graph API CLI — The Hub Deals

Commands:
  test                                    Test API connection
  status                                  Show account info
  post-image --url <URL> --caption <TXT>  Post a single image
  post-reel --url <URL> --caption <TXT>   Post a Reel (video)
  post-carousel --urls <CSV> --caption    Post a carousel
  exchange-token --token <T> --app-id <I> --secret <S>
                                          Exchange short token for long-lived
  refresh-token                           Refresh expiring token
      `);
  }
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});

module.exports = { postImage, postReel, postCarousel, getAccountStatus, testConnection, refreshToken };
