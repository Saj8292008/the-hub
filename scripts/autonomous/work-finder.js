#!/usr/bin/env node
/**
 * Autonomous Work Finder
 * Scans The Hub for opportunities, bugs, and improvements
 * Adds discovered tasks to the queue
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY
);

const QUEUE_PATH = path.join(__dirname, 'task-queue.json');

async function loadQueue() {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  } catch {
    return { version: 1, tasks: [], completed: [], discovered: [] };
  }
}

function saveQueue(queue) {
  queue.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

async function checkDatabaseHealth() {
  const issues = [];
  
  // Check for deals with missing prices
  const { data: missingPrices } = await supabase
    .from('deals')
    .select('id')
    .is('price', null)
    .limit(100);
  
  if (missingPrices?.length > 10) {
    issues.push({
      id: `fix-prices-${Date.now()}`,
      title: `Fix ${missingPrices.length} deals with missing prices`,
      description: 'Many deals have null prices - need better extraction',
      priority: 'medium',
      category: 'data-quality'
    });
  }

  // Check for stale deals (no new ones in 24h)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('deals')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', yesterday);

  if (count < 10) {
    issues.push({
      id: `scraper-stale-${Date.now()}`,
      title: 'Scrapers may be failing - low deal count',
      description: `Only ${count} new deals in 24h. Check scrapers.`,
      priority: 'high',
      category: 'reliability'
    });
  }

  return issues;
}

async function checkGrowthMetrics() {
  const issues = [];

  // Check newsletter subscribers
  const { count: subCount } = await supabase
    .from('subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('confirmed', true);

  if (subCount < 10) {
    issues.push({
      id: 'growth-subscribers',
      title: `Only ${subCount} confirmed subscribers - need growth`,
      description: 'Focus on user acquisition: Reddit posts, Telegram, SEO',
      priority: 'high',
      category: 'growth'
    });
  }

  return issues;
}

async function checkCodeQuality() {
  const issues = [];

  // Check for TODO comments in code
  const scriptsDir = path.join(__dirname, '..');
  const files = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
  
  let todoCount = 0;
  for (const file of files) {
    const content = fs.readFileSync(path.join(scriptsDir, file), 'utf8');
    const todos = content.match(/\/\/\s*TODO/gi);
    if (todos) todoCount += todos.length;
  }

  if (todoCount > 5) {
    issues.push({
      id: `todos-${Date.now()}`,
      title: `${todoCount} TODO comments in codebase`,
      description: 'Review and resolve TODO items',
      priority: 'low',
      category: 'code-quality'
    });
  }

  return issues;
}

async function findWork() {
  console.log('🔍 Autonomous Work Finder\n');
  
  const queue = await loadQueue();
  const existingIds = new Set([
    ...queue.tasks.map(t => t.id),
    ...queue.completed.map(t => t.id),
    ...queue.discovered.map(t => t.id)
  ]);

  const allIssues = [];

  console.log('Checking database health...');
  const dbIssues = await checkDatabaseHealth();
  allIssues.push(...dbIssues);

  console.log('Checking growth metrics...');
  const growthIssues = await checkGrowthMetrics();
  allIssues.push(...growthIssues);

  console.log('Checking code quality...');
  const codeIssues = await checkCodeQuality();
  allIssues.push(...codeIssues);

  // Filter out already-known issues
  const newIssues = allIssues.filter(i => !existingIds.has(i.id));

  if (newIssues.length > 0) {
    console.log(`\n✨ Found ${newIssues.length} new tasks:`);
    for (const issue of newIssues) {
      console.log(`  - [${issue.priority}] ${issue.title}`);
      issue.createdAt = new Date().toISOString();
      issue.status = 'discovered';
      queue.discovered.push(issue);
    }
    saveQueue(queue);
  } else {
    console.log('\n✅ No new issues discovered');
  }

  // Summary
  console.log('\n📊 Queue Summary:');
  console.log(`  In Progress: ${queue.tasks.filter(t => t.status === 'in-progress').length}`);
  console.log(`  Pending: ${queue.tasks.filter(t => t.status === 'pending').length}`);
  console.log(`  Discovered: ${queue.discovered.length}`);
  console.log(`  Completed: ${queue.completed.length}`);

  return { newIssues, queue };
}

// Run if called directly
if (require.main === module) {
  findWork().catch(console.error);
}

module.exports = { findWork, loadQueue, saveQueue };
