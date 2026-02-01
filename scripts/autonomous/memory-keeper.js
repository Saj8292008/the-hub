#!/usr/bin/env node
/**
 * Memory Keeper
 * Helps Jay maintain better context between sessions
 * 
 * Features:
 * - Track key facts (things Syd tells me)
 * - Log activities (what we did)
 * - Daily summaries for MEMORY.md
 */

const fs = require('fs');
const path = require('path');

const FACTS_PATH = path.join(__dirname, 'key-facts.json');
const CLAWD_MEMORY = '/Users/sydneyjackson/clawd/MEMORY.md';
const CLAWD_DAILY = '/Users/sydneyjackson/clawd/memory';

function loadFacts() {
  try {
    return JSON.parse(fs.readFileSync(FACTS_PATH, 'utf8'));
  } catch {
    return {
      lastUpdated: null,
      facts: [],
      activities: [],
      questions: [] // Things I should ask about
    };
  }
}

function saveFacts(data) {
  data.lastUpdated = new Date().toISOString();
  fs.writeFileSync(FACTS_PATH, JSON.stringify(data, null, 2));
}

// Add a key fact to remember
function addFact(category, fact, source = 'conversation') {
  const data = loadFacts();
  
  const entry = {
    id: `fact-${Date.now()}`,
    category, // syd, thehub, external, technical
    fact,
    source,
    addedAt: new Date().toISOString(),
    confirmedAt: null
  };
  
  data.facts.push(entry);
  saveFacts(data);
  
  console.log(`📝 Remembered: [${category}] ${fact}`);
  return entry;
}

// Log an activity
function logActivity(activity, outcome = null) {
  const data = loadFacts();
  
  const entry = {
    id: `act-${Date.now()}`,
    activity,
    outcome,
    timestamp: new Date().toISOString()
  };
  
  data.activities.push(entry);
  saveFacts(data);
  
  console.log(`✅ Logged: ${activity}`);
  return entry;
}

// Add something to ask Syd about
function addQuestion(question, context = null) {
  const data = loadFacts();
  
  const entry = {
    id: `q-${Date.now()}`,
    question,
    context,
    addedAt: new Date().toISOString(),
    answered: false
  };
  
  data.questions.push(entry);
  saveFacts(data);
  
  console.log(`❓ Will ask: ${question}`);
  return entry;
}

// Get pending questions
function getPendingQuestions() {
  const data = loadFacts();
  return data.questions.filter(q => !q.answered);
}

// Search facts
function searchFacts(query) {
  const data = loadFacts();
  const lowerQuery = query.toLowerCase();
  
  return data.facts.filter(f => 
    f.fact.toLowerCase().includes(lowerQuery) ||
    f.category.toLowerCase().includes(lowerQuery)
  );
}

// Generate daily summary for MEMORY.md
function generateSummary(date = null) {
  const data = loadFacts();
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  // Filter today's activities
  const todayActivities = data.activities.filter(a => 
    a.timestamp.startsWith(targetDate)
  );
  
  // Filter recent facts
  const recentFacts = data.facts.filter(f =>
    f.addedAt.startsWith(targetDate)
  );

  let summary = `## ${targetDate}\n\n`;
  
  if (recentFacts.length > 0) {
    summary += `### Key Facts Learned\n`;
    for (const fact of recentFacts) {
      summary += `- [${fact.category}] ${fact.fact}\n`;
    }
    summary += '\n';
  }
  
  if (todayActivities.length > 0) {
    summary += `### Activities\n`;
    for (const act of todayActivities) {
      summary += `- ${act.activity}`;
      if (act.outcome) summary += ` → ${act.outcome}`;
      summary += '\n';
    }
  }

  return summary;
}

// Show current memory state
function showStatus() {
  const data = loadFacts();
  
  console.log('\n🧠 Memory Keeper Status\n');
  console.log(`Facts stored: ${data.facts.length}`);
  console.log(`Activities logged: ${data.activities.length}`);
  console.log(`Pending questions: ${data.questions.filter(q => !q.answered).length}`);
  
  if (data.lastUpdated) {
    const ago = Math.floor((Date.now() - new Date(data.lastUpdated)) / 60000);
    console.log(`Last updated: ${ago} minutes ago`);
  }

  // Show recent facts by category
  const byCategory = {};
  for (const fact of data.facts.slice(-20)) {
    byCategory[fact.category] = byCategory[fact.category] || [];
    byCategory[fact.category].push(fact.fact);
  }
  
  console.log('\nRecent facts by category:');
  for (const [cat, facts] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${facts.length} items`);
  }

  // Show pending questions
  const pending = getPendingQuestions();
  if (pending.length > 0) {
    console.log('\n❓ Questions to ask Syd:');
    for (const q of pending.slice(0, 5)) {
      console.log(`  - ${q.question}`);
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  switch (command) {
    case 'status':
      showStatus();
      break;
    case 'fact':
      if (args[1] && args[2]) {
        addFact(args[1], args.slice(2).join(' '));
      } else {
        console.log('Usage: memory-keeper.js fact <category> <fact>');
        console.log('Categories: syd, thehub, external, technical');
      }
      break;
    case 'log':
      if (args[1]) {
        logActivity(args.slice(1).join(' '));
      } else {
        console.log('Usage: memory-keeper.js log <activity>');
      }
      break;
    case 'ask':
      if (args[1]) {
        addQuestion(args.slice(1).join(' '));
      } else {
        console.log('Usage: memory-keeper.js ask <question>');
      }
      break;
    case 'search':
      if (args[1]) {
        const results = searchFacts(args.slice(1).join(' '));
        console.log(`Found ${results.length} facts:`);
        results.forEach(f => console.log(`  [${f.category}] ${f.fact}`));
      }
      break;
    case 'summary':
      console.log(generateSummary(args[1]));
      break;
    case 'questions':
      const pending = getPendingQuestions();
      console.log(`${pending.length} pending questions:`);
      pending.forEach(q => console.log(`  - ${q.question}`));
      break;
    default:
      console.log('Commands: status, fact, log, ask, search, summary, questions');
  }
}

module.exports = { 
  addFact, logActivity, addQuestion, 
  searchFacts, getPendingQuestions, generateSummary 
};
