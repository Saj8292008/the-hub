/**
 * Deal Digest Generator
 * 
 * Generates daily/weekly deal digests for newsletters
 * Auto-creates engaging content from scraped deals
 */

const logger = require('../../utils/logger');

class DealDigestGenerator {
  constructor(supabase) {
    this.supabase = supabase;
  }

  /**
   * Generate a daily digest of top deals
   */
  async generateDailyDigest() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    try {
      // Get top deals from last 24 hours
      const { data: deals, error } = await this.supabase
        .from('watch_listings')
        .select('*')
        .gte('created_at', oneDayAgo)
        .not('price', 'is', null)
        .order('deal_score', { ascending: false })
        .limit(10);

      if (error) {
        logger.error('Error fetching deals for digest:', error);
        return null;
      }

      if (!deals || deals.length === 0) {
        return null;
      }

      return this.formatDigest(deals, 'daily');
    } catch (error) {
      logger.error('Error generating daily digest:', error);
      return null;
    }
  }

  /**
   * Generate a weekly digest of top deals
   */
  async generateWeeklyDigest() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      const { data: deals, error } = await this.supabase
        .from('watch_listings')
        .select('*')
        .gte('created_at', oneWeekAgo)
        .not('price', 'is', null)
        .order('deal_score', { ascending: false })
        .limit(15);

      if (error) {
        logger.error('Error fetching deals for weekly digest:', error);
        return null;
      }

      if (!deals || deals.length === 0) {
        return null;
      }

      return this.formatDigest(deals, 'weekly');
    } catch (error) {
      logger.error('Error generating weekly digest:', error);
      return null;
    }
  }

  /**
   * Format deals into a digest
   */
  formatDigest(deals, type = 'daily') {
    const title = type === 'daily' 
      ? `🔥 Today's Top Watch Deals` 
      : `📊 This Week's Best Watch Deals`;

    const intro = type === 'daily'
      ? `Here are the hottest deals we found in the last 24 hours:`
      : `Here's your weekly roundup of the best watch deals:`;

    // Generate HTML content
    const html = this.generateHtmlDigest(deals, title, intro);
    
    // Generate plain text content
    const text = this.generateTextDigest(deals, title, intro);

    // Calculate stats
    const stats = this.calculateStats(deals);

    return {
      title,
      html,
      text,
      stats,
      dealCount: deals.length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate HTML version of digest
   */
  generateHtmlDigest(deals, title, intro) {
    let html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a1a; border-bottom: 2px solid #3b82f6;">${title}</h1>
        <p style="color: #4b5563;">${intro}</p>
    `;

    deals.forEach((deal, index) => {
      const scoreColor = deal.deal_score >= 80 ? '#10b981' : 
                        deal.deal_score >= 60 ? '#f59e0b' : '#6b7280';
      
      html += `
        <div style="background: #f9fafb; padding: 16px; margin: 16px 0; border-radius: 8px; border-left: 4px solid ${scoreColor};">
          <h3 style="margin: 0 0 8px 0; color: #1a1a1a;">
            ${index + 1}. ${this.cleanTitle(deal.title || `${deal.brand} ${deal.model}`)}
          </h3>
          <p style="margin: 0; color: #059669; font-size: 20px; font-weight: bold;">
            $${deal.price?.toLocaleString() || 'N/A'}
          </p>
          ${deal.brand ? `<p style="margin: 4px 0; color: #6b7280;">Brand: ${deal.brand}</p>` : ''}
          ${deal.deal_score ? `<p style="margin: 4px 0; color: ${scoreColor};">Deal Score: ${deal.deal_score}/100</p>` : ''}
          <a href="${deal.url}" style="display: inline-block; margin-top: 12px; background: #3b82f6; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none;">
            View Deal →
          </a>
        </div>
      `;
    });

    html += `
        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="color: #6b7280; font-size: 14px;">
            Found ${deals.length} great deals | The Hub
          </p>
          <a href="https://t.me/TheHubDeals" style="color: #3b82f6; text-decoration: none;">
            Join us on Telegram for instant alerts →
          </a>
        </div>
      </div>
    `;

    return html;
  }

  /**
   * Generate plain text version of digest
   */
  generateTextDigest(deals, title, intro) {
    let text = `${title}\n${'='.repeat(title.length)}\n\n${intro}\n\n`;

    deals.forEach((deal, index) => {
      text += `${index + 1}. ${this.cleanTitle(deal.title || `${deal.brand} ${deal.model}`)}\n`;
      text += `   💵 $${deal.price?.toLocaleString() || 'N/A'}`;
      if (deal.deal_score) text += ` | Score: ${deal.deal_score}/100`;
      text += `\n   🔗 ${deal.url}\n\n`;
    });

    text += `\n---\nJoin @TheHubDeals on Telegram for instant alerts!`;

    return text;
  }

  /**
   * Clean up deal title
   */
  cleanTitle(title) {
    return title
      .replace(/\[WTS\]/gi, '')
      .replace(/\[SOLD\]/gi, '')
      .replace(/\$[\d,]+/g, '')
      .trim()
      .substring(0, 100);
  }

  /**
   * Calculate digest statistics
   */
  calculateStats(deals) {
    const prices = deals.map(d => d.price).filter(p => p != null);
    
    return {
      totalDeals: deals.length,
      averagePrice: prices.length > 0 
        ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        : null,
      lowestPrice: prices.length > 0 ? Math.min(...prices) : null,
      highestPrice: prices.length > 0 ? Math.max(...prices) : null,
      sources: [...new Set(deals.map(d => d.source))],
      brands: [...new Set(deals.map(d => d.brand).filter(Boolean))]
    };
  }

  /**
   * Generate subject line for email
   */
  generateSubjectLine(stats, type = 'daily') {
    const subjects = [
      `🔥 ${stats.totalDeals} Hot Watch Deals Today`,
      `💰 Watches from $${stats.lowestPrice?.toLocaleString() || '???'} - Today's Picks`,
      `⌚ Don't Miss These ${stats.totalDeals} Watch Deals`,
      `📊 Your ${type === 'daily' ? 'Daily' : 'Weekly'} Watch Deal Digest`
    ];

    return subjects[Math.floor(Math.random() * subjects.length)];
  }
}

module.exports = DealDigestGenerator;
