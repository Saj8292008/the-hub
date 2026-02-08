/**
 * The Hub Empire Controller
 * Manages multi-agent system coordination
 */

const fs = require('fs').promises;
const path = require('path');
const { AGENTS } = require('./definitions');

const STATE_FILE = path.join(__dirname, '../../empire/state.json');
const REPORTS_DIR = path.join(__dirname, '../../empire/reports');

class EmpireController {
  constructor() {
    this.agents = {};
    this.activeAgents = new Set();
  }

  /**
   * Initialize empire system
   */
  async init() {
    // Create empire directories
    await fs.mkdir(path.dirname(STATE_FILE), { recursive: true });
    await fs.mkdir(REPORTS_DIR, { recursive: true });

    // Load previous state
    try {
      const state = await fs.readFile(STATE_FILE, 'utf8');
      const data = JSON.parse(state);
      this.activeAgents = new Set(data.activeAgents || []);
      console.log('🏛️ Empire state loaded');
    } catch (error) {
      console.log('🏛️ Empire initialized (new state)');
      await this.saveState();
    }
  }

  /**
   * Save empire state
   */
  async saveState() {
    const state = {
      activeAgents: Array.from(this.activeAgents),
      lastUpdate: new Date().toISOString(),
      agentCount: this.activeAgents.size
    };
    await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
  }

  /**
   * Spawn an agent
   */
  async spawnAgent(agentId, task = null) {
    const agent = AGENTS[agentId];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Check if already active
    if (this.activeAgents.has(agentId)) {
      return {
        success: false,
        message: `${agent.label} is already active`
      };
    }

    // Build task prompt
    const taskPrompt = task || agent.defaultTask;
    const fullPrompt = `${agent.systemPrompt}\n\n---\n\nTASK: ${taskPrompt}\n\nProvide your report in the specified format.`;

    // Spawn via Clawdbot sessions_spawn
    // Note: This requires integration with Clawdbot's session system
    // For now, we'll create a spawn request that the main bot can execute

    const spawnRequest = {
      agentId,
      label: agent.label,
      model: agent.model,
      thinking: agent.thinking,
      task: fullPrompt,
      timestamp: new Date().toISOString()
    };

    // Save spawn request for main bot to pick up
    const requestFile = path.join(__dirname, '../../empire/spawn-requests', `${agentId}-${Date.now()}.json`);
    await fs.mkdir(path.dirname(requestFile), { recursive: true });
    await fs.writeFile(requestFile, JSON.stringify(spawnRequest, null, 2));

    this.activeAgents.add(agentId);
    await this.saveState();

    return {
      success: true,
      agent: agent.label,
      task: taskPrompt,
      message: `${agent.emoji} ${agent.label} spawned and working...`
    };
  }

  /**
   * Get agent status
   */
  async getAgentStatus(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) return null;

    const isActive = this.activeAgents.has(agentId);
    
    // Check for recent reports
    let lastReport = null;
    try {
      const reportFile = path.join(REPORTS_DIR, `${agentId}-latest.json`);
      const report = await fs.readFile(reportFile, 'utf8');
      lastReport = JSON.parse(report);
    } catch (error) {
      // No report yet
    }

    return {
      id: agentId,
      label: agent.label,
      title: agent.title,
      emoji: agent.emoji,
      model: agent.model,
      active: isActive,
      lastReport: lastReport?.timestamp || null,
      status: isActive ? '🟢 Online' : '⚪ Offline'
    };
  }

  /**
   * Get all agents status
   */
  async getAllStatus() {
    const statuses = [];
    for (const agentId of Object.keys(AGENTS)) {
      const status = await this.getAgentStatus(agentId);
      statuses.push(status);
    }
    return statuses;
  }

  /**
   * Save agent report
   */
  async saveReport(agentId, report) {
    const reportData = {
      agentId,
      timestamp: new Date().toISOString(),
      report
    };

    // Save as latest
    const latestFile = path.join(REPORTS_DIR, `${agentId}-latest.json`);
    await fs.writeFile(latestFile, JSON.stringify(reportData, null, 2));

    // Also save timestamped version
    const timestamp = Date.now();
    const archiveFile = path.join(REPORTS_DIR, agentId, `${timestamp}.json`);
    await fs.mkdir(path.dirname(archiveFile), { recursive: true });
    await fs.writeFile(archiveFile, JSON.stringify(reportData, null, 2));

    console.log(`📊 Report saved for ${AGENTS[agentId].label}`);
  }

  /**
   * Stop an agent
   */
  async stopAgent(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    if (!this.activeAgents.has(agentId)) {
      return {
        success: false,
        message: `${agent.label} is not active`
      };
    }

    this.activeAgents.delete(agentId);
    await this.saveState();

    return {
      success: true,
      message: `${agent.emoji} ${agent.label} stopped`
    };
  }

  /**
   * Generate org chart text
   */
  async getOrgChart() {
    const statuses = await this.getAllStatus();
    
    let chart = '🏛️ **THE HUB EMPIRE**\\n\\n';
    chart += '```\\n';
    chart += '         🔥 JAY\\n';
    chart += '   CEO / Chief Operating Officer\\n';
    chart += '              |\\n';
    chart += '    ┌────┬────┼────┬────┐\\n';
    chart += '    |    |    |    |    |\\n';
    
    for (const status of statuses) {
      const statusIcon = status.active ? '🟢' : '⚪';
      chart += `    ${status.emoji} ${statusIcon}\\n`;
      chart += `    ${status.label}\\n`;
      chart += `    |\\n`;
    }
    
    chart += '```\\n\\n';
    
    // Add individual statuses
    for (const status of statuses) {
      chart += `${status.emoji} **${status.label}** ${status.status}\\n`;
      chart += `   ${status.title}\\n`;
      if (status.lastReport) {
        chart += `   Last report: ${new Date(status.lastReport).toLocaleString()}\\n`;
      }
      chart += '\\n';
    }
    
    return chart;
  }
}

// Singleton instance
const empire = new EmpireController();

module.exports = { empire, EmpireController };
