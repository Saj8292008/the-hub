#!/usr/bin/env node
/**
 * EMPIRE AI - The Hub Autonomous Coordinator
 * Manages all agent tasks, delegates work, monitors performance
 * Run: node scripts/agents/empire-ai.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Agent state file
const STATE_FILE = path.join(__dirname, 'empire-state.json');

// Load or initialize state
function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  }
  return {
    lastRun: null,
    agents: {
      dealHunter: { lastRun: null, status: 'idle', stats: { dealsPosted: 0 } },
      contentFactory: { lastRun: null, status: 'idle', stats: { contentCreated: 0 } },
      analytics: { lastRun: null, status: 'idle', stats: { reportsGenerated: 0 } },
      growth: { lastRun: null, status: 'idle', stats: { sourcesFound: 0 } },
      qualityControl: { lastRun: null, status: 'idle', stats: { dealsImproved: 0 } },
      selfImprover: { lastRun: null, status: 'idle', stats: { analysisRuns: 0, suggestionsGenerated: 0 } }
    }
  };
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// Task scheduler
class EmpireAI {
  constructor() {
    this.state = loadState();
    this.running = true;
  }

  async run() {
    console.log('🏰 EMPIRE AI - Autonomous Coordinator Starting...\n');
    
    // Main loop - check every 5 minutes
    while (this.running) {
      try {
        const now = Date.now();
        console.log(`[${new Date().toLocaleTimeString()}] Checking agent tasks...`);
        
        // Deal Hunter - runs every 10 minutes
        if (!this.state.agents.dealHunter.lastRun || now - this.state.agents.dealHunter.lastRun > 10 * 60 * 1000) {
          await this.runDealHunter();
        }
        
        // Content Factory - runs every 6 hours
        if (!this.state.agents.contentFactory.lastRun || now - this.state.agents.contentFactory.lastRun > 6 * 60 * 60 * 1000) {
          await this.runContentFactory();
        }
        
        // Analytics - runs every hour
        if (!this.state.agents.analytics.lastRun || now - this.state.agents.analytics.lastRun > 60 * 60 * 1000) {
          await this.runAnalytics();
        }
        
        // Quality Control - runs every 30 minutes
        if (!this.state.agents.qualityControl.lastRun || now - this.state.agents.qualityControl.lastRun > 30 * 60 * 1000) {
          await this.runQualityControl();
        }
        
        // Self-Improver - runs every 6 hours
        if (!this.state.agents.selfImprover || !this.state.agents.selfImprover.lastRun || now - this.state.agents.selfImprover.lastRun > 6 * 60 * 60 * 1000) {
          await this.runSelfImprover();
        }
        
        this.state.lastRun = now;
        saveState(this.state);
        
        // Sleep for 5 minutes
        await this.sleep(5 * 60 * 1000);
        
      } catch (error) {
        console.error('❌ Empire AI error:', error.message);
        await this.sleep(60 * 1000); // Wait 1 min on error
      }
    }
  }

  async runDealHunter() {
    console.log('\n🔍 DEAL HUNTER: Checking for hot deals...');
    this.state.agents.dealHunter.status = 'running';
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      // Run deal hunter
      await execPromise('cd /Users/sydneyjackson/the-hub && HOT_DEAL_THRESHOLD=12 node scripts/agents/deal-hunter.js');
      
      this.state.agents.dealHunter.lastRun = Date.now();
      this.state.agents.dealHunter.status = 'success';
      this.state.agents.dealHunter.stats.dealsPosted++;
      console.log('✅ Deal Hunter complete');
      
    } catch (error) {
      this.state.agents.dealHunter.status = 'error';
      console.log('⚠️  Deal Hunter:', error.message.substring(0, 100));
    }
  }

  async runContentFactory() {
    console.log('\n📝 CONTENT FACTORY: Generating content...');
    this.state.agents.contentFactory.status = 'running';
    
    try {
      // Get top deals from last 24h
      const { data: deals } = await supabase
        .from('watch_listings')
        .select('*')
        .gte('deal_score', 8)
        .gte('scraped_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('deal_score', { ascending: false })
        .limit(10);
      
      if (deals && deals.length > 0) {
        const date = new Date().toISOString().split('T')[0];
        const contentDir = `/Users/sydneyjackson/the-hub/content/${date}`;
        
        // Create auto-generated post (simple version for now)
        const content = this.generateQuickPost(deals);
        
        if (!fs.existsSync(contentDir)) {
          fs.mkdirSync(contentDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(contentDir, 'auto-daily-digest.md'),
          content
        );
        
        this.state.agents.contentFactory.stats.contentCreated++;
        console.log(`✅ Content created: ${contentDir}/auto-daily-digest.md`);
      } else {
        console.log('📭 No deals to feature today');
      }
      
      this.state.agents.contentFactory.lastRun = Date.now();
      this.state.agents.contentFactory.status = 'success';
      
    } catch (error) {
      this.state.agents.contentFactory.status = 'error';
      console.error('⚠️  Content Factory error:', error.message);
    }
  }

  async runAnalytics() {
    console.log('\n📊 ANALYTICS: Generating report...');
    this.state.agents.analytics.status = 'running';
    
    try {
      // Get counts
      const { count: watchCount } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true });
      
      const { count: sneakerCount } = await supabase
        .from('sneaker_listings')
        .select('*', { count: 'exact', head: true });
      
      const { count: subscriberCount } = await supabase
        .from('newsletter_subscribers')
        .select('*', { count: 'exact', head: true });
      
      const report = {
        timestamp: new Date().toISOString(),
        metrics: {
          watchListings: watchCount || 0,
          sneakerListings: sneakerCount || 0,
          subscribers: subscriberCount || 0
        }
      };
      
      console.log('📈 Metrics:', report.metrics);
      
      this.state.agents.analytics.lastRun = Date.now();
      this.state.agents.analytics.status = 'success';
      this.state.agents.analytics.stats.reportsGenerated++;
      
    } catch (error) {
      this.state.agents.analytics.status = 'error';
      console.error('⚠️  Analytics error:', error.message);
    }
  }

  async runQualityControl() {
    console.log('\n🛡️  QUALITY CONTROL: Checking data quality...');
    this.state.agents.qualityControl.status = 'running';
    
    try {
      // Remove old deals (>30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data: deleted } = await supabase
        .from('watch_listings')
        .delete()
        .lt('scraped_at', thirtyDaysAgo);
      
      console.log('🗑️  Cleaned old listings');
      
      this.state.agents.qualityControl.lastRun = Date.now();
      this.state.agents.qualityControl.status = 'success';
      this.state.agents.qualityControl.stats.dealsImproved++;
      
    } catch (error) {
      this.state.agents.qualityControl.status = 'error';
      console.error('⚠️  Quality Control error:', error.message);
    }
  }

  generateQuickPost(deals) {
    const top3 = deals.slice(0, 3);
    return `# Daily Deals Digest - ${new Date().toLocaleDateString()}

Auto-generated by Empire AI 🤖

## Top 3 Deals Today

${top3.map((d, i) => `
### ${i + 1}. ${d.brand || 'Watch'} ${d.model || ''} - $${d.price}
- **Score:** ${d.deal_score}/100
- **Source:** ${d.source}
- **Link:** ${d.url}
`).join('\n')}

---
*Generated automatically by The Hub Empire AI*
`;
  }

  async runSelfImprover() {
    console.log('\n🔍 SELF-IMPROVER: Analyzing system...');
    this.state.agents.selfImprover.status = 'running';
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execPromise = util.promisify(exec);
      
      await execPromise('cd /Users/sydneyjackson/the-hub && node scripts/agents/self-improver.js');
      
      this.state.agents.selfImprover.lastRun = Date.now();
      this.state.agents.selfImprover.status = 'success';
      this.state.agents.selfImprover.stats.analysisRuns++;
      console.log('✅ Self-Improver complete');
      
    } catch (error) {
      this.state.agents.selfImprover.status = 'error';
      console.log('⚠️  Self-Improver:', error.message.substring(0, 100));
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('\n🛑 Empire AI shutting down...');
    this.running = false;
  }
}

// Run
const empire = new EmpireAI();

// Graceful shutdown
process.on('SIGINT', () => empire.stop());
process.on('SIGTERM', () => empire.stop());

empire.run().catch(console.error);
