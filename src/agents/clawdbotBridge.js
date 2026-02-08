/**
 * Clawdbot Bridge
 * Integrates Empire agents with Clawdbot's session system
 */

const fs = require('fs').promises;
const path = require('path');
const { AGENTS } = require('./definitions');
const { empire } = require('./empireController');

const SPAWN_DIR = path.join(__dirname, '../../empire/spawn-requests');
const RESPONSE_DIR = path.join(__dirname, '../../empire/responses');

class ClawdbotBridge {
  constructor() {
    this.watching = false;
  }

  /**
   * Initialize bridge
   */
  async init() {
    await fs.mkdir(SPAWN_DIR, { recursive: true });
    await fs.mkdir(RESPONSE_DIR, { recursive: true });
    console.log('🌉 Clawdbot Bridge initialized');
  }

  /**
   * Watch for spawn requests and execute them
   */
  async watchSpawnRequests() {
    if (this.watching) return;
    this.watching = true;

    console.log('👀 Watching for agent spawn requests...');

    while (this.watching) {
      try {
        const files = await fs.readdir(SPAWN_DIR);
        
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          
          const requestPath = path.join(SPAWN_DIR, file);
          const request = JSON.parse(await fs.readFile(requestPath, 'utf8'));
          
          console.log(`🚀 Spawning agent: ${request.label}`);
          
          // Execute spawn via Clawdbot
          // This would call sessions_spawn with the agent config
          // For now, we'll create a placeholder response
          
          const response = {
            agentId: request.agentId,
            sessionKey: `empire-${request.agentId}-${Date.now()}`,
            label: request.label,
            status: 'spawned',
            timestamp: new Date().toISOString()
          };
          
          // Save response
          const responsePath = path.join(
            RESPONSE_DIR,
            `${request.agentId}-${Date.now()}.json`
          );
          await fs.writeFile(responsePath, JSON.stringify(response, null, 2));
          
          // Remove request
          await fs.unlink(requestPath);
          
          console.log(`✅ Agent spawned: ${request.label}`);
        }
      } catch (error) {
        console.error('Error watching spawn requests:', error);
      }
      
      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  /**
   * Stop watching
   */
  stopWatching() {
    this.watching = false;
  }

  /**
   * Spawn agent via Clawdbot sessions_spawn
   * This is the actual integration point
   */
  async spawnAgentSession(agentId, task) {
    const agent = AGENTS[agentId];
    if (!agent) {
      throw new Error(`Unknown agent: ${agentId}`);
    }

    // Build the task prompt
    const fullTask = `${agent.systemPrompt}

---

TASK: ${task || agent.defaultTask}

Provide your report in the specified format. When done, save your report to:
/Users/sydneyjackson/the-hub/empire/reports/${agentId}-latest.json

Format:
{
  "agentId": "${agentId}",
  "timestamp": "<ISO timestamp>",
  "report": "<your report text>",
  "status": "success|error",
  "data": { /* any structured data */ }
}
`;

    // This would call Clawdbot's sessions_spawn tool
    // For demo purposes, return the config that should be passed
    return {
      agentId: agent.id,
      label: agent.label,
      model: agent.model,
      thinking: agent.thinking,
      task: fullTask,
      cleanup: 'delete', // Delete session when done
      runTimeoutSeconds: 600 // 10 min timeout
    };
  }

  /**
   * Get agent session info
   */
  async getAgentSession(agentId) {
    // This would query Clawdbot's sessions to find active agent
    // For now, check if response file exists
    const files = await fs.readdir(RESPONSE_DIR);
    const agentFiles = files.filter(f => f.startsWith(agentId));
    
    if (agentFiles.length === 0) return null;
    
    const latestFile = agentFiles.sort().reverse()[0];
    const response = JSON.parse(
      await fs.readFile(path.join(RESPONSE_DIR, latestFile), 'utf8')
    );
    
    return response;
  }
}

// Singleton
const bridge = new ClawdbotBridge();

module.exports = { bridge, ClawdbotBridge };
