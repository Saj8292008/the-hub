#!/usr/bin/env node
/**
 * Initialize Jay Systems
 * Set up directories and initial state
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Initializing Jay\'s Autonomous Systems...\n');

const dirs = [
  '../data',
  '../logs',
  '../data/reports'
];

// Create directories
for (const dir of dirs) {
  const fullPath = path.join(__dirname, dir);
  try {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created ${dir}`);
  } catch (error) {
    console.log(`⚠️  ${dir} already exists`);
  }
}

// Initialize state file
const statePath = path.join(__dirname, '../state.json');
if (!fs.existsSync(statePath)) {
  const initialState = {
    active: false,
    autonomyLevel: 2,
    taskCount: 0,
    decisions: [],
    learning: {}
  };
  fs.writeFileSync(statePath, JSON.stringify(initialState, null, 2));
  console.log('✅ Created state.json');
} else {
  console.log('⚠️  state.json already exists');
}

// Initialize queue
const queuePath = path.join(__dirname, '../data/queue.json');
if (!fs.existsSync(queuePath)) {
  const initialQueue = {
    queue: [],
    running: [],
    completed: []
  };
  fs.writeFileSync(queuePath, JSON.stringify(initialQueue, null, 2));
  console.log('✅ Created queue.json');
} else {
  console.log('⚠️  queue.json already exists');
}

// Initialize memory
const memoryPath = path.join(__dirname, '../data/jay-memory.json');
if (!fs.existsSync(memoryPath)) {
  const initialMemory = {
    recent: [],
    patterns: {},
    preferences: {},
    successes: [],
    failures: []
  };
  fs.writeFileSync(memoryPath, JSON.stringify(initialMemory, null, 2));
  console.log('✅ Created jay-memory.json');
} else {
  console.log('⚠️  jay-memory.json already exists');
}

console.log('\n✅ Initialization complete!\n');
console.log('Next steps:');
console.log('  1. Review config: jay-systems/config.json');
console.log('  2. Set autonomy: node jay-systems/tools/set-autonomy.js 2');
console.log('  3. Start brain: node jay-systems/core/brain.js');
console.log('  4. Check status: node jay-systems/tools/status.js');
console.log('');
