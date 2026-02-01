#!/usr/bin/env node
/**
 * Reddit Post Manager
 * Tracks Reddit outreach posts, engagement, and schedules
 * 
 * Can work in two modes:
 * 1. Manual: Generates ready-to-post content, tracks after manual posting
 * 2. Automated: Uses Reddit API (requires REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, 'reddit-posts.json');
const OUTREACH_PATH = path.join(__dirname, '../../outreach/reddit-posts.md');

// Load post tracking
function loadPosts() {
  try {
    return JSON.parse(fs.readFileSync(POSTS_PATH, 'utf8'));
  } catch {
    return { 
      posts: [],
      subreddits: {
        'r/Watches': { members: 320000, posted: false, rules: 'Check self-promo policy' },
        'r/WatchExchange': { members: 180000, posted: false, rules: 'META tag for tools' },
        'r/Sneakers': { members: 2300000, posted: false, rules: 'Very strict on promo' },
        'r/Flipping': { members: 400000, posted: false, rules: 'Allows tools if valuable' },
        'r/Entrepreneur': { members: 1200000, posted: false, rules: 'Build stories welcome' }
      }
    };
  }
}

function savePosts(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(POSTS_PATH, JSON.stringify(data, null, 2));
}

// Parse outreach markdown for post templates
function loadTemplates() {
  try {
    const content = fs.readFileSync(OUTREACH_PATH, 'utf8');
    const posts = [];
    
    // Parse each subreddit section
    const sections = content.split(/## r\/(\w+)/);
    for (let i = 1; i < sections.length; i += 2) {
      const subreddit = `r/${sections[i]}`;
      const body = sections[i + 1];
      
      // Extract title
      const titleMatch = body.match(/\*\*Title:\*\* (.+)/);
      const title = titleMatch ? titleMatch[1] : '';
      
      // Extract body (between **Body:** and ---)
      const bodyMatch = body.match(/\*\*Body:\*\*\n([\s\S]*?)(?=\n---|\n## |$)/);
      const postBody = bodyMatch ? bodyMatch[1].trim() : '';
      
      if (title && postBody) {
        posts.push({ subreddit, title, body: postBody });
      }
    }
    
    return posts;
  } catch (e) {
    console.error('Could not load templates:', e.message);
    return [];
  }
}

// Generate a ready-to-post version
function preparePost(subreddit) {
  const templates = loadTemplates();
  const template = templates.find(t => t.subreddit.toLowerCase() === subreddit.toLowerCase());
  
  if (!template) {
    console.log(`No template found for ${subreddit}`);
    return null;
  }

  const data = loadPosts();
  const subData = data.subreddits[subreddit];
  
  console.log(`\n📝 Ready to post to ${subreddit}`);
  if (subData) {
    console.log(`   Members: ~${(subData.members / 1000).toFixed(0)}k`);
    console.log(`   Notes: ${subData.rules}`);
    console.log(`   Previously posted: ${subData.posted ? 'Yes' : 'No'}`);
  }
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TITLE: ${template.title}`);
  console.log(`${'='.repeat(60)}`);
  console.log(template.body);
  console.log(`${'='.repeat(60)}\n`);
  
  return template;
}

// Track that we posted
function recordPost(subreddit, url, title) {
  const data = loadPosts();
  
  const post = {
    id: `post-${Date.now()}`,
    subreddit,
    url,
    title,
    postedAt: new Date().toISOString(),
    karma: 0,
    comments: 0,
    lastChecked: null
  };
  
  data.posts.push(post);
  if (data.subreddits[subreddit]) {
    data.subreddits[subreddit].posted = true;
    data.subreddits[subreddit].lastPostUrl = url;
  }
  
  savePosts(data);
  console.log(`✅ Recorded post to ${subreddit}`);
  return post;
}

// Update karma/engagement (manual for now)
function updatePost(postId, karma, comments) {
  const data = loadPosts();
  const post = data.posts.find(p => p.id === postId);
  
  if (!post) {
    console.log('Post not found');
    return;
  }

  post.karma = karma;
  post.comments = comments;
  post.lastChecked = new Date().toISOString();
  
  savePosts(data);
  console.log(`📊 Updated ${post.subreddit}: ${karma} karma, ${comments} comments`);
}

// Show status
function showStatus() {
  const data = loadPosts();
  
  console.log('\n📊 Reddit Outreach Status\n');
  
  console.log('Subreddits:');
  for (const [sub, info] of Object.entries(data.subreddits)) {
    const status = info.posted ? '✅ Posted' : '⏳ Pending';
    console.log(`  ${status} ${sub} (~${(info.members / 1000).toFixed(0)}k members)`);
  }
  
  if (data.posts.length > 0) {
    console.log('\nActive Posts:');
    for (const post of data.posts) {
      const age = Math.floor((Date.now() - new Date(post.postedAt)) / (1000 * 60 * 60));
      console.log(`  • ${post.subreddit}: ${post.karma} karma, ${post.comments} comments (${age}h ago)`);
      if (post.url) console.log(`    ${post.url}`);
    }
  }
  
  const posted = Object.values(data.subreddits).filter(s => s.posted).length;
  const total = Object.keys(data.subreddits).length;
  console.log(`\nProgress: ${posted}/${total} subreddits posted`);
}

// Suggest next action
function suggestNext() {
  const data = loadPosts();
  const templates = loadTemplates();
  
  // Find unposted subreddits with templates, sorted by member count
  const candidates = [];
  for (const [sub, info] of Object.entries(data.subreddits)) {
    if (!info.posted && templates.find(t => t.subreddit === sub)) {
      candidates.push({ subreddit: sub, ...info });
    }
  }
  
  candidates.sort((a, b) => b.members - a.members);
  
  if (candidates.length === 0) {
    console.log('✅ All planned subreddits have been posted to!');
    return null;
  }
  
  const next = candidates[0];
  console.log(`\n💡 Suggested next post: ${next.subreddit}`);
  console.log(`   ${(next.members / 1000000).toFixed(1)}M members`);
  console.log(`   Run: node reddit-manager.js prepare "${next.subreddit}"`);
  
  return next.subreddit;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'next':
      suggestNext();
      break;
    case 'prepare':
      if (args[1]) preparePost(args[1]);
      else {
        const next = suggestNext();
        if (next) preparePost(next);
      }
      break;
    case 'record':
      if (args[1] && args[2]) {
        recordPost(args[1], args[2], args.slice(3).join(' ') || 'The Hub post');
      } else {
        console.log('Usage: reddit-manager.js record <subreddit> <url> [title]');
      }
      break;
    case 'update':
      if (args[1] && args[2] && args[3]) {
        updatePost(args[1], parseInt(args[2]), parseInt(args[3]));
      } else {
        console.log('Usage: reddit-manager.js update <postId> <karma> <comments>');
      }
      break;
    case 'templates':
      const templates = loadTemplates();
      console.log(`Found ${templates.length} post templates:`);
      templates.forEach(t => console.log(`  • ${t.subreddit}: "${t.title}"`));
      break;
    default:
      console.log('Commands: status, next, prepare [subreddit], record, update, templates');
  }
}

module.exports = { loadPosts, savePosts, preparePost, recordPost, updatePost, showStatus, suggestNext };
