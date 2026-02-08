#!/usr/bin/env node
/**
 * SELF-IMPROVER AGENT
 * Analyzes system performance and suggests/implements improvements
 * Inspired by advanced ClawdBot patterns
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class SelfImprover {
  constructor() {
    this.improvementsFile = path.join(__dirname, 'improvements.json');
    this.improvements = this.loadImprovements();
  }

  loadImprovements() {
    try {
      if (fs.existsSync(this.improvementsFile)) {
        return JSON.parse(fs.readFileSync(this.improvementsFile, 'utf8'));
      }
    } catch (err) {
      console.warn('Could not load improvements:', err.message);
    }
    return { implemented: [], pending: [], rejected: [] };
  }

  saveImprovements() {
    try {
      fs.writeFileSync(this.improvementsFile, JSON.stringify(this.improvements, null, 2));
    } catch (err) {
      console.warn('Could not save improvements:', err.message);
    }
  }

  async analyze() {
    console.log('🔍 Analyzing system performance...\n');

    const insights = {
      database: await this.analyzeDatabaseHealth(),
      agents: await this.analyzeAgentPerformance(),
      deals: await this.analyzeDealQuality(),
      opportunities: []
    };

    // Generate improvement suggestions
    const suggestions = this.generateSuggestions(insights);
    
    console.log('\n📊 Analysis Complete');
    console.log('='.repeat(50));
    this.printInsights(insights);
    this.printSuggestions(suggestions);

    return { insights, suggestions };
  }

  async analyzeDatabaseHealth() {
    try {
      // Check listing counts
      const { count: watchCount } = await supabase
        .from('watch_listings')
        .select('*', { count: 'exact', head: true });

      const { count: sneakerCount } = await supabase
        .from('sneaker_listings')
        .select('*', { count: 'exact', head: true });

      // Check for duplicates
      const { data: duplicates } = await supabase
        .from('watch_listings')
        .select('url')
        .limit(1000);
      
      const uniqueUrls = new Set(duplicates?.map(d => d.url) || []);
      const duplicateRatio = 1 - (uniqueUrls.size / (duplicates?.length || 1));

      return {
        watchListings: watchCount || 0,
        sneakerListings: sneakerCount || 0,
        total: (watchCount || 0) + (sneakerCount || 0),
        duplicateRatio: duplicateRatio.toFixed(2),
        health: duplicateRatio < 0.1 ? 'good' : 'needs-cleanup'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeAgentPerformance() {
    try {
      const stateFile = path.join(__dirname, 'empire-state.json');
      const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

      const agents = Object.entries(state.agents).map(([name, data]) => ({
        name,
        status: data.status,
        lastRun: data.lastRun ? new Date(data.lastRun).toLocaleString() : 'never',
        stats: data.stats
      }));

      const activeCount = agents.filter(a => a.status === 'success').length;
      const failedCount = agents.filter(a => a.status === 'error').length;

      return {
        agents,
        activeCount,
        failedCount,
        totalAgents: agents.length,
        health: failedCount === 0 ? 'excellent' : 'needs-attention'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async analyzeDealQuality() {
    try {
      // Get recent hot deals
      const { data: hotDeals } = await supabase
        .from('watch_listings')
        .select('deal_score, brand, price')
        .gte('deal_score', 10)
        .order('deal_score', { ascending: false })
        .limit(20);

      const avgScore = hotDeals?.reduce((sum, d) => sum + d.deal_score, 0) / (hotDeals?.length || 1);

      return {
        hotDealsCount: hotDeals?.length || 0,
        avgScore: avgScore.toFixed(1),
        topBrands: this.getTopBrands(hotDeals || []),
        quality: avgScore > 50 ? 'excellent' : avgScore > 20 ? 'good' : 'improving'
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  getTopBrands(deals) {
    const brands = {};
    deals.forEach(d => {
      const brand = d.brand || 'Unknown';
      brands[brand] = (brands[brand] || 0) + 1;
    });
    return Object.entries(brands)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand, count]) => ({ brand, count }));
  }

  generateSuggestions(insights) {
    const suggestions = [];

    // Database health suggestions
    if (insights.database.duplicateRatio > 0.1) {
      suggestions.push({
        priority: 'high',
        category: 'database',
        issue: `${(insights.database.duplicateRatio * 100).toFixed(0)}% duplicate URLs detected`,
        solution: 'Implement deduplication script',
        impact: 'Reduce storage, improve query speed'
      });
    }

    // Agent performance suggestions
    if (insights.agents.failedCount > 0) {
      suggestions.push({
        priority: 'high',
        category: 'agents',
        issue: `${insights.agents.failedCount} agent(s) failing`,
        solution: 'Add error recovery and retry logic',
        impact: 'Improve reliability'
      });
    }

    // Deal quality suggestions
    if (insights.deals.avgScore < 30) {
      suggestions.push({
        priority: 'medium',
        category: 'deals',
        issue: 'Average deal score is low',
        solution: 'Tune scoring algorithm or find better sources',
        impact: 'Higher quality deals = more engagement'
      });
    }

    // Proactive suggestions
    if (insights.database.total < 500) {
      suggestions.push({
        priority: 'low',
        category: 'growth',
        issue: 'Low inventory count',
        solution: 'Add more scraper sources',
        impact: 'More deals = more value'
      });
    }

    return suggestions;
  }

  printInsights(insights) {
    console.log('\n📊 SYSTEM INSIGHTS\n');
    
    console.log('Database:');
    console.log(`  Total Listings: ${insights.database.total}`);
    console.log(`  Watches: ${insights.database.watchListings}`);
    console.log(`  Sneakers: ${insights.database.sneakerListings}`);
    console.log(`  Health: ${insights.database.health}`);
    
    console.log('\nAgents:');
    console.log(`  Active: ${insights.agents.activeCount}/${insights.agents.totalAgents}`);
    console.log(`  Failed: ${insights.agents.failedCount}`);
    console.log(`  Health: ${insights.agents.health}`);
    
    console.log('\nDeal Quality:');
    console.log(`  Hot Deals: ${insights.deals.hotDealsCount}`);
    console.log(`  Avg Score: ${insights.deals.avgScore}`);
    console.log(`  Quality: ${insights.deals.quality}`);
    if (insights.deals.topBrands.length > 0) {
      console.log(`  Top Brands: ${insights.deals.topBrands.map(b => b.brand).join(', ')}`);
    }
  }

  printSuggestions(suggestions) {
    if (suggestions.length === 0) {
      console.log('\n✅ No improvements needed - system running optimally!');
      return;
    }

    console.log('\n💡 IMPROVEMENT SUGGESTIONS\n');
    suggestions.forEach((s, i) => {
      const priority = s.priority === 'high' ? '🔴' : s.priority === 'medium' ? '🟡' : '🟢';
      console.log(`${i + 1}. ${priority} [${s.category.toUpperCase()}]`);
      console.log(`   Issue: ${s.issue}`);
      console.log(`   Solution: ${s.solution}`);
      console.log(`   Impact: ${s.impact}\n`);
    });
  }
}

// Run if called directly
if (require.main === module) {
  const improver = new SelfImprover();
  improver.analyze()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

module.exports = SelfImprover;
