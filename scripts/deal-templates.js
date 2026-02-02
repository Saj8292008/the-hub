/**
 * Deal Templates - Category-specific formatting for Telegram posts
 * Import these into other scripts for consistent branding
 */

const templates = {
  // Watch-specific template
  watch: (deal) => {
    const score = deal.deal_score || 0;
    const fires = score >= 9 ? '🔥🔥🔥' : score >= 8 ? '🔥🔥' : score >= 7 ? '🔥' : '';
    
    let msg = `⌚ <b>WATCH DEAL</b>${fires ? ' ' + fires : ''}\n\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>\n`;
    
    // Watch-specific details
    if (deal.brand) msg += `🏷️ ${deal.brand}\n`;
    if (deal.condition) msg += `✨ Condition: ${deal.condition}\n`;
    if (deal.year) msg += `📅 Year: ${deal.year}\n`;
    
    msg += `📍 ${deal.source}\n`;
    
    if (score > 0) {
      msg += `\n<b>Deal Score:</b> ${getScoreBar(score)} ${score}/10\n`;
    }
    
    if (deal.url) msg += `\n🔗 <a href="${deal.url}">View Watch →</a>`;
    
    return msg;
  },

  // Sneaker-specific template
  sneaker: (deal) => {
    const score = deal.deal_score || 0;
    const fires = score >= 9 ? '🔥🔥🔥' : score >= 8 ? '🔥🔥' : score >= 7 ? '🔥' : '';
    
    let msg = `👟 <b>SNEAKER DEAL</b>${fires ? ' ' + fires : ''}\n\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>\n`;
    
    // Sneaker-specific details
    if (deal.size) msg += `📏 Size: ${deal.size}\n`;
    if (deal.colorway) msg += `🎨 ${deal.colorway}\n`;
    if (deal.condition) msg += `✨ ${deal.condition}\n`;
    
    msg += `📍 ${deal.source}\n`;
    
    if (score > 0) {
      msg += `\n<b>Deal Score:</b> ${getScoreBar(score)} ${score}/10\n`;
    }
    
    if (deal.url) msg += `\n🔗 <a href="${deal.url}">Cop Now →</a>`;
    
    return msg;
  },

  // Car-specific template
  car: (deal) => {
    const score = deal.deal_score || 0;
    const fires = score >= 9 ? '🔥🔥🔥' : score >= 8 ? '🔥🔥' : score >= 7 ? '🔥' : '';
    
    let msg = `🚗 <b>CAR DEAL</b>${fires ? ' ' + fires : ''}\n\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>\n`;
    
    // Car-specific details
    if (deal.year) msg += `📅 ${deal.year}\n`;
    if (deal.mileage) msg += `🛣️ ${deal.mileage.toLocaleString()} miles\n`;
    if (deal.location) msg += `📍 ${deal.location}\n`;
    
    msg += `🔗 ${deal.source}\n`;
    
    if (score > 0) {
      msg += `\n<b>Deal Score:</b> ${getScoreBar(score)} ${score}/10\n`;
    }
    
    if (deal.url) msg += `\n<a href="${deal.url}">View Listing →</a>`;
    
    return msg;
  },

  // Generic deal template
  generic: (deal) => {
    const score = deal.deal_score || 0;
    const fires = score >= 9 ? '🔥🔥🔥' : score >= 8 ? '🔥🔥' : score >= 7 ? '🔥' : '';
    
    let msg = `📦 <b>DEAL FOUND</b>${fires ? ' ' + fires : ''}\n\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>\n`;
    msg += `📍 ${deal.source}\n`;
    
    if (score > 0) {
      msg += `\n<b>Deal Score:</b> ${getScoreBar(score)} ${score}/10\n`;
    }
    
    if (deal.url) msg += `\n🔗 <a href="${deal.url}">View Deal →</a>`;
    
    return msg;
  },

  // Flash sale / time-sensitive template
  flash: (deal, expiresIn) => {
    let msg = `⚡ <b>FLASH DEAL</b> ⚡\n`;
    if (expiresIn) msg += `⏰ <i>Expires in ${expiresIn}</i>\n`;
    msg += `\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>`;
    if (deal.originalPrice) {
      const discount = Math.round((1 - deal.price / deal.originalPrice) * 100);
      msg += ` <s>${formatPrice(deal.originalPrice)}</s> (-${discount}%)`;
    }
    msg += `\n`;
    msg += `📍 ${deal.source}\n`;
    if (deal.url) msg += `\n🔗 <a href="${deal.url}">GET IT NOW →</a>`;
    
    return msg;
  },

  // Price drop alert
  priceDrop: (deal, oldPrice) => {
    const drop = oldPrice - deal.price;
    const dropPercent = Math.round((drop / oldPrice) * 100);
    
    let msg = `📉 <b>PRICE DROP ALERT</b>\n\n`;
    msg += `<b>${deal.title}</b>\n\n`;
    msg += `💰 <b>${formatPrice(deal.price)}</b>\n`;
    msg += `📉 Was: <s>${formatPrice(oldPrice)}</s>\n`;
    msg += `✅ You save: ${formatPrice(drop)} (${dropPercent}% off)\n`;
    msg += `📍 ${deal.source}\n`;
    if (deal.url) msg += `\n🔗 <a href="${deal.url}">View Deal →</a>`;
    
    return msg;
  }
};

// Helper functions
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

function getScoreBar(score) {
  const filled = Math.round(score);
  const empty = 10 - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

// Auto-detect category from deal data
function detectCategory(deal) {
  const title = (deal.title || '').toLowerCase();
  const source = (deal.source || '').toLowerCase();
  
  // Watch keywords
  if (source.includes('chrono24') || source.includes('watchuseek') ||
      title.includes('watch') || title.includes('rolex') || 
      title.includes('omega') || title.includes('seiko') ||
      title.includes('tudor') || title.includes('[wts]')) {
    return 'watch';
  }
  
  // Sneaker keywords
  if (source.includes('stockx') || source.includes('goat') ||
      title.includes('jordan') || title.includes('nike') ||
      title.includes('yeezy') || title.includes('dunk') ||
      title.includes('sneaker')) {
    return 'sneaker';
  }
  
  // Car keywords
  if (title.includes('car') || title.includes('vehicle') ||
      title.includes('miles') || title.includes('vin')) {
    return 'car';
  }
  
  return 'generic';
}

// Main formatter - auto-selects template
function formatDeal(deal, forceTemplate = null) {
  const category = forceTemplate || detectCategory(deal);
  const template = templates[category] || templates.generic;
  return template(deal);
}

module.exports = {
  templates,
  formatDeal,
  detectCategory,
  formatPrice,
  getScoreBar
};
