#!/usr/bin/env node
/**
 * Autonomous Progress Reporter
 * Generates progress reports for review
 */

const fs = require('fs');
const path = require('path');

const QUEUE_PATH = path.join(__dirname, 'task-queue.json');

function loadQueue() {
  try {
    return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf8'));
  } catch {
    return { version: 1, tasks: [], completed: [], discovered: [] };
  }
}

function generateReport(format = 'text') {
  const queue = loadQueue();
  const now = new Date();
  
  const report = {
    generatedAt: now.toISOString(),
    summary: {
      inProgress: queue.tasks.filter(t => t.status === 'in-progress').length,
      pending: queue.tasks.filter(t => t.status === 'pending').length,
      discovered: queue.discovered.length,
      completedTotal: queue.completed.length,
      completedToday: queue.completed.filter(t => {
        const completedDate = new Date(t.completedAt);
        return completedDate.toDateString() === now.toDateString();
      }).length
    },
    inProgress: queue.tasks.filter(t => t.status === 'in-progress'),
    recentlyCompleted: queue.completed.slice(-5),
    highPriorityPending: queue.tasks
      .filter(t => t.status === 'pending' && t.priority === 'high')
      .slice(0, 3),
    newlyDiscovered: queue.discovered.slice(-3)
  };

  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  // Text format for Telegram/chat
  let text = `📊 **Jay's Work Report**\n`;
  text += `_${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}_\n\n`;

  if (report.summary.completedToday > 0) {
    text += `✅ **Completed Today:** ${report.summary.completedToday}\n`;
    for (const task of report.recentlyCompleted.filter(t => {
      const d = new Date(t.completedAt);
      return d.toDateString() === now.toDateString();
    })) {
      text += `  • ${task.title}\n`;
    }
    text += '\n';
  }

  if (report.inProgress.length > 0) {
    text += `🔨 **Working On:**\n`;
    for (const task of report.inProgress) {
      text += `  • ${task.title}\n`;
    }
    text += '\n';
  }

  if (report.highPriorityPending.length > 0) {
    text += `🎯 **Up Next (High Priority):**\n`;
    for (const task of report.highPriorityPending) {
      text += `  • ${task.title}\n`;
    }
    text += '\n';
  }

  if (report.newlyDiscovered.length > 0) {
    text += `🔍 **Discovered:**\n`;
    for (const task of report.newlyDiscovered) {
      text += `  • ${task.title}\n`;
    }
  }

  return text;
}

function markComplete(taskId, notes = '') {
  const queue = loadQueue();
  
  const taskIndex = queue.tasks.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    console.log(`Task ${taskId} not found`);
    return false;
  }

  const task = queue.tasks.splice(taskIndex, 1)[0];
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  task.notes = notes;
  queue.completed.push(task);
  
  queue.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  
  console.log(`✅ Marked complete: ${task.title}`);
  return true;
}

function promoteDiscovered(taskId) {
  const queue = loadQueue();
  
  const taskIndex = queue.discovered.findIndex(t => t.id === taskId);
  if (taskIndex === -1) {
    console.log(`Discovered task ${taskId} not found`);
    return false;
  }

  const task = queue.discovered.splice(taskIndex, 1)[0];
  task.status = 'pending';
  task.promotedAt = new Date().toISOString();
  queue.tasks.push(task);
  
  queue.lastUpdated = new Date().toISOString();
  fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
  
  console.log(`📥 Promoted to queue: ${task.title}`);
  return true;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'report';

  switch (command) {
    case 'report':
      console.log(generateReport('text'));
      break;
    case 'json':
      console.log(generateReport('json'));
      break;
    case 'complete':
      if (args[1]) markComplete(args[1], args.slice(2).join(' '));
      else console.log('Usage: reporter.js complete <taskId> [notes]');
      break;
    case 'promote':
      if (args[1]) promoteDiscovered(args[1]);
      else console.log('Usage: reporter.js promote <taskId>');
      break;
    default:
      console.log('Commands: report, json, complete <id>, promote <id>');
  }
}

module.exports = { generateReport, markComplete, promoteDiscovered };
