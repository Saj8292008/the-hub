/**
 * Jay's Brain - Autonomous Decision Engine
 * Makes decisions, coordinates agents, learns from outcomes
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class Brain extends EventEmitter {
  constructor(configPath) {
    super();
    this.configPath = configPath || path.join(__dirname, '../config.json');
    this.config = null;
    this.state = {
      active: false,
      autonomyLevel: 2,
      taskCount: 0,
      decisions: [],
      learning: {}
    };
    this.stateFile = path.join(__dirname, '../state.json');
  }

  /**
   * Initialize brain
   */
  async init() {
    console.log('🧠 Initializing Jay\'s Brain...');
    
    // Load config
    try {
      const configData = await fs.readFile(this.configPath, 'utf8');
      this.config = JSON.parse(configData);
      this.state.autonomyLevel = this.config.autonomyLevel;
      console.log(`✅ Config loaded (Autonomy Level: ${this.state.autonomyLevel})`);
    } catch (error) {
      console.error('❌ Failed to load config:', error.message);
      process.exit(1);
    }

    // Load previous state
    try {
      const stateData = await fs.readFile(this.stateFile, 'utf8');
      const prevState = JSON.parse(stateData);
      this.state.learning = prevState.learning || {};
      this.state.taskCount = prevState.taskCount || 0;
      console.log('✅ Previous state restored');
    } catch (error) {
      console.log('📝 Starting with fresh state');
    }

    this.state.active = true;
    await this.saveState();
    
    console.log('🧠 Brain is online\n');
    this.emit('ready');
  }

  /**
   * Make a decision
   */
  async decide(situation) {
    const decision = {
      timestamp: new Date().toISOString(),
      situation: situation.description,
      options: situation.options || [],
      risk: situation.risk || 'medium',
      urgency: situation.urgency || 'normal',
      autonomyRequired: situation.autonomyRequired || 2
    };

    console.log(`\n🤔 Decision needed: ${decision.situation}`);
    console.log(`   Risk: ${decision.risk} | Urgency: ${decision.urgency}`);

    // Check autonomy level
    if (decision.autonomyRequired > this.state.autonomyLevel) {
      console.log(`⚠️  Requires Level ${decision.autonomyRequired}, current: ${this.state.autonomyLevel}`);
      decision.action = 'escalate';
      decision.reason = 'Insufficient autonomy level';
      this.emit('needsApproval', decision);
      return decision;
    }

    // Check work hours (unless critical)
    if (situation.urgency !== 'critical' && !this.isWorkHours()) {
      console.log('🌙 Outside work hours, deferring non-critical decision');
      decision.action = 'defer';
      decision.reason = 'Outside work hours';
      return decision;
    }

    // Check rate limits
    if (!this.checkRateLimits()) {
      console.log('⏸️  Rate limit reached, cooling down');
      decision.action = 'defer';
      decision.reason = 'Rate limit';
      return decision;
    }

    // Apply decision logic
    decision.action = this.selectAction(situation);
    decision.reason = this.explainDecision(situation, decision.action);
    decision.confidence = this.calculateConfidence(situation, decision.action);

    console.log(`✅ Decision: ${decision.action}`);
    console.log(`   Reason: ${decision.reason}`);
    console.log(`   Confidence: ${decision.confidence}%`);

    // Record decision
    this.state.decisions.push(decision);
    if (this.state.decisions.length > 100) {
      this.state.decisions = this.state.decisions.slice(-100);
    }

    await this.saveState();
    this.emit('decision', decision);

    return decision;
  }

  /**
   * Select best action based on situation
   */
  selectAction(situation) {
    // Use learning if available
    const learned = this.state.learning[situation.type];
    if (learned && learned.successRate > 0.8) {
      return learned.bestAction;
    }

    // Apply rules
    if (situation.type === 'serverDown') {
      return 'restart';
    }
    if (situation.type === 'highMemory') {
      return 'restart';
    }
    if (situation.type === 'hotDeal') {
      return 'post';
    }
    if (situation.type === 'bugDetected') {
      return 'investigate';
    }

    // Default: investigate first
    return 'investigate';
  }

  /**
   * Explain decision reasoning
   */
  explainDecision(situation, action) {
    const reasons = {
      restart: 'System health degraded, restart is safe recovery',
      post: 'High value detected, posting maximizes engagement',
      investigate: 'Need more information before acting',
      fix: 'Issue identified, fix is known and safe',
      escalate: 'Requires human judgment',
      defer: 'Can wait for better timing'
    };
    return reasons[action] || 'Based on learned patterns';
  }

  /**
   * Calculate confidence level
   */
  calculateConfidence(situation, action) {
    let confidence = 50; // Base confidence

    // Increase if we've done this successfully before
    const learned = this.state.learning[situation.type];
    if (learned && learned.attempts > 5) {
      confidence += learned.successRate * 30;
    }

    // Increase for low-risk actions
    if (situation.risk === 'low') {
      confidence += 20;
    } else if (situation.risk === 'high') {
      confidence -= 20;
    }

    // Cap at 95% (never 100% certain)
    return Math.min(95, Math.max(20, Math.round(confidence)));
  }

  /**
   * Learn from outcome
   */
  async learn(outcome) {
    const { situationType, action, success, metrics } = outcome;

    if (!this.state.learning[situationType]) {
      this.state.learning[situationType] = {
        attempts: 0,
        successes: 0,
        successRate: 0,
        bestAction: null,
        actions: {}
      };
    }

    const learning = this.state.learning[situationType];
    learning.attempts++;
    
    if (!learning.actions[action]) {
      learning.actions[action] = { attempts: 0, successes: 0 };
    }
    
    learning.actions[action].attempts++;

    if (success) {
      learning.successes++;
      learning.actions[action].successes++;
    }

    learning.successRate = learning.successes / learning.attempts;

    // Update best action
    let bestAction = null;
    let bestRate = 0;
    for (const [act, stats] of Object.entries(learning.actions)) {
      const rate = stats.attempts > 2 ? stats.successes / stats.attempts : 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestAction = act;
      }
    }
    learning.bestAction = bestAction;

    console.log(`\n📚 Learned from ${situationType}:`);
    console.log(`   Success rate: ${(learning.successRate * 100).toFixed(1)}%`);
    console.log(`   Best action: ${learning.bestAction}`);

    await this.saveState();
    this.emit('learned', learning);
  }

  /**
   * Execute action
   */
  async execute(action, params = {}) {
    console.log(`\n⚡ Executing: ${action}`);
    this.state.taskCount++;
    
    const execution = {
      action,
      params,
      timestamp: new Date().toISOString(),
      status: 'started'
    };

    try {
      // This would integrate with actual execution systems
      // For now, just log
      console.log(`   Params:`, params);
      
      execution.status = 'completed';
      execution.completedAt = new Date().toISOString();
      
      this.emit('executed', execution);
      return { success: true, execution };
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      console.error(`❌ Execution failed:`, error.message);
      
      this.emit('executionFailed', execution);
      return { success: false, execution, error };
    }
  }

  /**
   * Check if within work hours
   */
  isWorkHours() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    const [startH, startM] = this.config.workHours.start.split(':').map(Number);
    const [endH, endM] = this.config.workHours.end.split(':').map(Number);
    const startTime = startH * 60 + startM;
    const endTime = endH * 60 + endM;

    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Check rate limits
   */
  checkRateLimits() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentDecisions = this.state.decisions.filter(d => 
      new Date(d.timestamp).getTime() > oneHourAgo
    );
    
    return recentDecisions.length < this.config.limits.maxTasksPerHour;
  }

  /**
   * Save state to disk
   */
  async saveState() {
    try {
      await fs.writeFile(
        this.stateFile,
        JSON.stringify(this.state, null, 2)
      );
    } catch (error) {
      console.error('Failed to save state:', error.message);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      active: this.state.active,
      autonomyLevel: this.state.autonomyLevel,
      taskCount: this.state.taskCount,
      recentDecisions: this.state.decisions.slice(-5),
      learning: Object.keys(this.state.learning).map(type => ({
        type,
        successRate: this.state.learning[type].successRate,
        bestAction: this.state.learning[type].bestAction
      })),
      workHours: this.isWorkHours(),
      rateLimitOk: this.checkRateLimits()
    };
  }

  /**
   * Shutdown brain
   */
  async shutdown() {
    console.log('\n🧠 Shutting down brain...');
    this.state.active = false;
    await this.saveState();
    console.log('✅ Brain shutdown complete');
  }
}

// Export
module.exports = { Brain };

// CLI usage
if (require.main === module) {
  const brain = new Brain();
  
  brain.on('ready', () => {
    console.log('Brain is ready for decisions\n');
  });

  brain.on('decision', (decision) => {
    console.log(`Decision recorded: ${decision.action}`);
  });

  brain.on('needsApproval', (decision) => {
    console.log(`⚠️  Approval needed for: ${decision.situation}`);
  });

  // Initialize
  brain.init();

  // Handle shutdown
  process.on('SIGINT', async () => {
    await brain.shutdown();
    process.exit(0);
  });

  // Example decision after 2 seconds
  setTimeout(async () => {
    const decision = await brain.decide({
      description: 'Server memory usage at 85%',
      type: 'highMemory',
      options: ['restart', 'clearCache', 'alert'],
      risk: 'low',
      urgency: 'normal',
      autonomyRequired: 2
    });

    if (decision.action !== 'escalate' && decision.action !== 'defer') {
      await brain.execute(decision.action, { graceful: true });
      
      // Simulate learning
      await brain.learn({
        situationType: 'highMemory',
        action: decision.action,
        success: true,
        metrics: { memoryAfter: '45%', downtime: '0s' }
      });
    }

    console.log('\nBrain status:', brain.getStatus());
  }, 2000);
}
