/**
 * Deal Copywriter
 * Generates engaging content from deal data
 * For Telegram, newsletter, and social posts
 */

class DealCopywriter {
  constructor() {
    // Engaging hooks by deal quality
    this.hooks = {
      fire: ['🔥 STEAL ALERT', '💰 PRICE DROP', '⚡ HOT DEAL', '🎯 SNIPER SPECIAL'],
      good: ['👀 Worth a Look', '📍 Spotted', '💎 Solid Find', '✨ Fresh Listing'],
      neutral: ['📋 New Listing', '🔍 On the Market', '📦 Just Posted']
    };

    // Brand prestige tiers
    this.prestigeBrands = {
      grail: ['Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'A. Lange', 'Richard Mille'],
      luxury: ['Rolex', 'Omega', 'Cartier', 'IWC', 'Panerai', 'Jaeger-LeCoultre', 'Breitling'],
      enthusiast: ['Tudor', 'Grand Seiko', 'Zenith', 'Nomos', 'Oris', 'Longines', 'Sinn'],
      entry: ['Seiko', 'Hamilton', 'Tissot', 'Orient', 'Citizen', 'Casio']
    };
  }

  /**
   * Get hook based on deal score
   */
  getHook(score) {
    if (score >= 8) return this.hooks.fire[Math.floor(Math.random() * this.hooks.fire.length)];
    if (score >= 6) return this.hooks.good[Math.floor(Math.random() * this.hooks.good.length)];
    return this.hooks.neutral[Math.floor(Math.random() * this.hooks.neutral.length)];
  }

  /**
   * Get brand tier emoji
   */
  getBrandEmoji(brand) {
    if (this.prestigeBrands.grail.some(b => brand?.toLowerCase().includes(b.toLowerCase()))) return '👑';
    if (this.prestigeBrands.luxury.some(b => brand?.toLowerCase().includes(b.toLowerCase()))) return '⌚';
    if (this.prestigeBrands.enthusiast.some(b => brand?.toLowerCase().includes(b.toLowerCase()))) return '🎯';
    return '⏱️';
  }

  /**
   * Format price nicely
   */
  formatPrice(price) {
    if (!price) return 'Price TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Generate score visualization
   */
  getScoreBar(score, max = 10) {
    const filled = Math.round((score / max) * 10);
    const empty = 10 - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  /**
   * Generate fire emojis based on score
   */
  getFireLevel(score) {
    if (score >= 9) return '🔥🔥🔥';
    if (score >= 8) return '🔥🔥';
    if (score >= 7) return '🔥';
    return '';
  }

  /**
   * Clean up title for display
   */
  cleanTitle(title) {
    if (!title) return '';
    return title
      .replace(/\[WTS\]/gi, '')
      .replace(/\[WTB\]/gi, '')
      .replace(/\[WTT\]/gi, '')
      .replace(/\$\d+[\d,]*/, '')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 80);
  }

  /**
   * Generate Telegram post for a single deal
   */
  generateTelegramPost(deal) {
    const hook = this.getHook(deal.deal_score || 5);
    const brandEmoji = this.getBrandEmoji(deal.brand);
    const fires = this.getFireLevel(deal.deal_score || 5);
    const price = this.formatPrice(deal.price);
    const title = this.cleanTitle(deal.title);
    
    let post = `${hook} ${fires}\n\n`;
    post += `${brandEmoji} <b>${deal.brand || 'Watch'}</b>\n`;
    post += `${title}\n\n`;
    post += `💰 <b>${price}</b>\n`;
    
    if (deal.condition && deal.condition !== 'unknown') {
      post += `📦 ${deal.condition.charAt(0).toUpperCase() + deal.condition.slice(1)}\n`;
    }
    
    if (deal.deal_score) {
      post += `\n⭐ Deal Score: <code>${this.getScoreBar(deal.deal_score)}</code> ${deal.deal_score}/10\n`;
    }
    
    if (deal.url) {
      post += `\n🔗 <a href="${deal.url}">View Listing →</a>`;
    }
    
    return post;
  }

  /**
   * Generate a multi-deal roundup post
   */
  generateRoundupPost(deals, title = 'TOP DEALS') {
    let post = `📊 <b>${title}</b>\n`;
    post += `<i>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</i>\n\n`;
    
    deals.slice(0, 5).forEach((deal, i) => {
      const fires = this.getFireLevel(deal.deal_score || 5);
      const price = this.formatPrice(deal.price);
      post += `<b>${i + 1}.</b> ${deal.brand || '?'} ${fires}\n`;
      post += `   ${price} • ${deal.condition || 'N/A'}\n`;
      if (deal.url) {
        post += `   <a href="${deal.url}">View →</a>\n`;
      }
      post += '\n';
    });
    
    post += `\n📍 Found on r/watchexchange & more`;
    return post;
  }

  /**
   * Generate a price alert style post
   */
  generatePriceAlertPost(deal, previousPrice) {
    const priceDrop = previousPrice - deal.price;
    const dropPercent = Math.round((priceDrop / previousPrice) * 100);
    
    let post = `🚨 <b>PRICE DROP ALERT</b> 🚨\n\n`;
    post += `${this.getBrandEmoji(deal.brand)} <b>${deal.brand}</b>\n`;
    post += `${this.cleanTitle(deal.title)}\n\n`;
    post += `💰 <s>${this.formatPrice(previousPrice)}</s> → <b>${this.formatPrice(deal.price)}</b>\n`;
    post += `📉 Down ${dropPercent}% (${this.formatPrice(priceDrop)} off)\n`;
    
    if (deal.url) {
      post += `\n🔗 <a href="${deal.url}">Grab it →</a>`;
    }
    
    return post;
  }

  /**
   * Generate newsletter section for deals
   */
  generateNewsletterSection(deals, sectionTitle = 'This Week\'s Best Deals') {
    let html = `<h2>${sectionTitle}</h2>\n`;
    
    deals.slice(0, 5).forEach((deal, i) => {
      const fires = deal.deal_score >= 8 ? '🔥' : '';
      html += `<div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #007bff;">\n`;
      html += `  <h3>${i + 1}. ${deal.brand || 'Watch'} ${fires}</h3>\n`;
      html += `  <p><strong>${this.formatPrice(deal.price)}</strong> • ${deal.condition || 'See listing'}</p>\n`;
      html += `  <p>${this.cleanTitle(deal.title)}</p>\n`;
      if (deal.url) {
        html += `  <p><a href="${deal.url}">View Listing →</a></p>\n`;
      }
      html += `</div>\n`;
    });
    
    return html;
  }

  /**
   * Generate a "deal of the day" feature post
   */
  generateDealOfTheDay(deal) {
    let post = `⭐ <b>DEAL OF THE DAY</b> ⭐\n\n`;
    post += `${this.getBrandEmoji(deal.brand)} <b>${deal.brand}</b>\n`;
    post += `${this.cleanTitle(deal.title)}\n\n`;
    post += `💰 <b>${this.formatPrice(deal.price)}</b>\n`;
    
    if (deal.condition && deal.condition !== 'unknown') {
      post += `📦 Condition: ${deal.condition}\n`;
    }
    
    if (deal.deal_score) {
      post += `\n🎯 <b>Why it's good:</b>\n`;
      post += `<code>${this.getScoreBar(deal.deal_score)}</code> ${deal.deal_score}/10\n`;
      
      if (deal.deal_score >= 8) {
        post += `\n✅ Priced below market\n`;
        post += `✅ Good condition for price\n`;
        post += `✅ Trusted source\n`;
      }
    }
    
    if (deal.url) {
      post += `\n🔗 <a href="${deal.url}">View Full Listing →</a>`;
    }
    
    post += `\n\n<i>Curated by The Hub • @thehubdeals</i>`;
    return post;
  }
}

module.exports = DealCopywriter;
