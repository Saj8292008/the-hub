/**
 * Jay's Memory System
 * Contextual memory, learning, and pattern recognition
 */

const fs = require('fs').promises;
const path = require('path');

class Memory {
  constructor() {
    this.memoryDir = '/Users/sydneyjackson/clawd/memory';
    this.mainMemory = '/Users/sydneyjackson/clawd/MEMORY.md';
    this.jayMemory = path.join(__dirname, '../data/jay-memory.json');
    this.context = {
      recent: [],
      patterns: {},
      preferences: {},
      successes: [],
      failures: []
    };
  }

  /**
   * Initialize memory
   */
  async init() {
    console.log('🧠 Loading Jay\'s memory...');
    
    // Load Jay-specific memory
    try {
      const data = await fs.readFile(this.jayMemory, 'utf8');
      this.context = JSON.parse(data);
      console.log('✅ Memory restored');
    } catch (error) {
      console.log('📝 Starting with fresh memory');
    }

    // Load recent daily notes
    await this.loadRecentContext();
  }

  /**
   * Load recent context from memory files
   */
  async loadRecentContext() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Load today's notes
      try {
        const todayPath = path.join(this.memoryDir, `${today}.md`);
        const content = await fs.readFile(todayPath, 'utf8');
        this.context.recent.push({
          date: today,
          content: content.substring(0, 2000) // First 2000 chars
        });
      } catch (e) {}

      // Load yesterday's notes
      try {
        const yesterdayPath = path.join(this.memoryDir, `${yesterday}.md`);
        const content = await fs.readFile(yesterdayPath, 'utf8');
        this.context.recent.push({
          date: yesterday,
          content: content.substring(0, 2000)
        });
      } catch (e) {}

      console.log(`📚 Loaded ${this.context.recent.length} days of context`);
    } catch (error) {
      console.error('Failed to load recent context:', error.message);
    }
  }

  /**
   * Remember something important
   */
  async remember(key, value, category = 'general') {
    if (category === 'pattern') {
      if (!this.context.patterns[key]) {
        this.context.patterns[key] = { count: 0, examples: [] };
      }
      this.context.patterns[key].count++;
      this.context.patterns[key].examples.push(value);
      
      // Keep last 10 examples
      if (this.context.patterns[key].examples.length > 10) {
        this.context.patterns[key].examples = this.context.patterns[key].examples.slice(-10);
      }
    } else if (category === 'preference') {
      this.context.preferences[key] = value;
    } else if (category === 'success') {
      this.context.successes.push({ key, value, timestamp: new Date().toISOString() });
      if (this.context.successes.length > 100) {
        this.context.successes = this.context.successes.slice(-100);
      }
    } else if (category === 'failure') {
      this.context.failures.push({ key, value, timestamp: new Date().toISOString() });
      if (this.context.failures.length > 100) {
        this.context.failures = this.context.failures.slice(-100);
      }
    }

    await this.save();
    console.log(`💭 Remembered (${category}): ${key}`);
  }

  /**
   * Recall something
   */
  recall(key, category = null) {
    if (category === 'pattern') {
      return this.context.patterns[key] || null;
    } else if (category === 'preference') {
      return this.context.preferences[key] || null;
    } else {
      // Search all categories
      return this.context.preferences[key] ||
             this.context.patterns[key] ||
             null;
    }
  }

  /**
   * Get success rate for an action
   */
  getSuccessRate(action) {
    const successes = this.context.successes.filter(s => s.key === action).length;
    const failures = this.context.failures.filter(f => f.key === action).length;
    const total = successes + failures;

    if (total === 0) return null;

    return {
      successRate: successes / total,
      attempts: total,
      successes,
      failures
    };
  }

  /**
   * Get recognized patterns
   */
  getPatterns() {
    return Object.entries(this.context.patterns)
      .map(([key, data]) => ({
        pattern: key,
        occurrences: data.count,
        recentExamples: data.examples.slice(-3)
      }))
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /**
   * Write to today's memory file
   */
  async writeToday(section, content) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayPath = path.join(this.memoryDir, `${today}.md`);
      
      // Read existing content
      let existing = '';
      try {
        existing = await fs.readFile(todayPath, 'utf8');
      } catch (e) {
        existing = `# ${today} Memory Log\n\n`;
      }

      // Add new section
      const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const entry = `\n## ${timestamp} - ${section}\n${content}\n`;

      await fs.writeFile(todayPath, existing + entry);
      console.log(`📝 Wrote to memory: ${section}`);
    } catch (error) {
      console.error('Failed to write memory:', error.message);
    }
  }

  /**
   * Save memory to disk
   */
  async save() {
    try {
      await fs.mkdir(path.dirname(this.jayMemory), { recursive: true });
      await fs.writeFile(this.jayMemory, JSON.stringify(this.context, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error.message);
    }
  }

  /**
   * Get memory summary
   */
  getSummary() {
    return {
      recentDays: this.context.recent.length,
      patterns: Object.keys(this.context.patterns).length,
      preferences: Object.keys(this.context.preferences).length,
      successes: this.context.successes.length,
      failures: this.context.failures.length,
      topPatterns: this.getPatterns().slice(0, 5)
    };
  }
}

module.exports = { Memory };

// CLI usage
if (require.main === module) {
  (async () => {
    const memory = new Memory();
    await memory.init();

    // Example: Remember some patterns
    await memory.remember('server-restart-fixes-memory', {
      observation: 'Restarting server resolved high memory',
      memoryBefore: '85%',
      memoryAfter: '45%'
    }, 'pattern');

    await memory.remember('hot-deal-threshold', 15, 'preference');

    await memory.remember('posted-instagram', {
      action: 'Posted deal to Instagram',
      engagement: 'high'
    }, 'success');

    // Show summary
    console.log('\nMemory Summary:', memory.getSummary());

    // Write to today's memory
    await memory.writeToday('System Check', 'Ran autonomous health check, all systems normal');
  })();
}
