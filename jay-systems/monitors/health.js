/**
 * Health Monitor
 * Proactive system health checking
 */

const http = require('http');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class HealthMonitor {
  constructor(brain) {
    this.brain = brain;
    this.checks = [];
    this.interval = null;
  }

  /**
   * Start monitoring
   */
  start(intervalMs = 60000) {
    console.log('🏥 Health monitor started');
    
    this.interval = setInterval(async () => {
      await this.runChecks();
    }, intervalMs);

    // Run immediately
    this.runChecks();
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      console.log('🏥 Health monitor stopped');
    }
  }

  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {
      timestamp: new Date().toISOString(),
      checks: [],
      issues: []
    };

    // Check Hub server
    const hubHealth = await this.checkPort(3001, '/health');
    results.checks.push({ name: 'Hub Server', ...hubHealth });
    if (!hubHealth.healthy) {
      results.issues.push({ service: 'Hub Server', issue: 'Not responding' });
    }

    // Check Mission Control
    const mcHealth = await this.checkPort(4001, '/api/health');
    results.checks.push({ name: 'Mission Control', ...mcHealth });

    // Check Clawdbot Gateway
    const gwHealth = await this.checkGateway();
    results.checks.push({ name: 'Clawdbot Gateway', ...gwHealth });
    if (!gwHealth.healthy) {
      results.issues.push({ service: 'Clawdbot', issue: 'Gateway not running' });
    }

    // Check disk space
    const diskHealth = await this.checkDiskSpace();
    results.checks.push({ name: 'Disk Space', ...diskHealth });
    if (!diskHealth.healthy) {
      results.issues.push({ service: 'System', issue: 'Low disk space' });
    }

    // If issues found and brain available, make decisions
    if (results.issues.length > 0 && this.brain) {
      for (const issue of results.issues) {
        await this.handleIssue(issue);
      }
    }

    return results;
  }

  /**
   * Check if a port is responding
   */
  checkPort(port, path = '/') {
    return new Promise((resolve) => {
      const req = http.get({
        hostname: 'localhost',
        port,
        path,
        timeout: 5000
      }, (res) => {
        resolve({
          healthy: res.statusCode === 200 || res.statusCode === 404,
          port,
          statusCode: res.statusCode
        });
      });

      req.on('error', () => {
        resolve({ healthy: false, port, error: 'Connection refused' });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ healthy: false, port, error: 'Timeout' });
      });
    });
  }

  /**
   * Check if Clawdbot gateway is running
   */
  async checkGateway() {
    try {
      const { stdout } = await execPromise('pgrep -f "clawdbot" || true');
      const running = stdout.trim().length > 0;
      return {
        healthy: running,
        process: running ? 'Running' : 'Stopped'
      };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Check disk space
   */
  async checkDiskSpace() {
    try {
      const { stdout } = await execPromise('df -h /Users | tail -1');
      const parts = stdout.trim().split(/\s+/);
      const usedPercent = parseInt(parts[4]);

      return {
        healthy: usedPercent < 90,
        used: parts[4],
        available: parts[3],
        warning: usedPercent > 80
      };
    } catch (error) {
      return { healthy: true, error: 'Could not check' };
    }
  }

  /**
   * Handle detected issue
   */
  async handleIssue(issue) {
    console.log(`⚠️  Issue detected: ${issue.service} - ${issue.issue}`);

    if (!this.brain) return;

    // Let brain decide what to do
    const decision = await this.brain.decide({
      description: `${issue.service}: ${issue.issue}`,
      type: issue.service === 'Hub Server' ? 'serverDown' : 'serviceIssue',
      options: ['restart', 'alert', 'investigate'],
      risk: 'low',
      urgency: 'normal',
      autonomyRequired: 2
    });

    if (decision.action === 'restart' && issue.service === 'Hub Server') {
      await this.restartHub();
    }
  }

  /**
   * Restart The Hub server
   */
  async restartHub() {
    try {
      console.log('🔄 Restarting The Hub...');
      
      // Kill existing process
      await execPromise('pkill -f "node.*the-hub" || true');
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Start new process
      const hubDir = '/Users/sydneyjackson/the-hub';
      exec(
        'nohup npm start > logs/nohup.log 2>&1 &',
        { cwd: hubDir, detached: true },
        (error) => {
          if (error) {
            console.error('Failed to restart:', error.message);
          } else {
            console.log('✅ The Hub restarted');
          }
        }
      );

      if (this.brain) {
        await this.brain.learn({
          situationType: 'serverDown',
          action: 'restart',
          success: true,
          metrics: { downtime: '5s' }
        });
      }
    } catch (error) {
      console.error('❌ Restart failed:', error.message);
    }
  }
}

module.exports = { HealthMonitor };

// CLI usage
if (require.main === module) {
  (async () => {
    const monitor = new HealthMonitor();
    
    console.log('Running health checks...\n');
    const results = await monitor.runChecks();

    console.log('\n📋 Health Check Results:');
    for (const check of results.checks) {
      const status = check.healthy ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${check.healthy ? 'OK' : check.error}`);
    }

    if (results.issues.length > 0) {
      console.log('\n⚠️  Issues found:');
      for (const issue of results.issues) {
        console.log(`   - ${issue.service}: ${issue.issue}`);
      }
    } else {
      console.log('\n✅ All systems healthy');
    }
  })();
}
