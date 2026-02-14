/**
 * Instagram Caption & Hashtag Generator
 * Creates engaging captions with optimized hashtags for each deal
 */

/**
 * Generate engaging Instagram caption for a deal
 */
function generateCaption(deal) {
  const hook = generateHook(deal);
  const details = generateDetails(deal);
  const value = generateValueProp(deal);
  const cta = "🔗 Link in bio for more deals like this!";
  const hashtags = generateHashtags(deal.category, deal);
  
  return `${hook}

${details}

${value}

${cta}

${hashtags}`;
}

/**
 * Generate attention-grabbing hook line
 */
function generateHook(deal) {
  const category = (deal.category || '').toLowerCase();
  const discount = calculateDiscount(deal);
  
  const hooks = {
    watches: [
      `⌚ ${discount}% OFF this stunning ${extractBrand(deal.title) || 'timepiece'}!`,
      `🔥 Watch collectors, don't sleep on this deal!`,
      `⌚ Luxury for less: ${extractBrand(deal.title) || 'Premium watch'} alert!`,
      `💎 Grey market gem: ${discount}% below retail!`
    ],
    sneakers: [
      `👟 Sneakerheads: ${discount}% OFF ${extractBrand(deal.title) || 'these kicks'}!`,
      `🔥 DROP ALERT: ${extractBrand(deal.title) || 'Heat'} below market!`,
      `👟 Your grail just got ${discount}% cheaper!`,
      `💰 Steal alert: ${extractBrand(deal.title) || 'Premium sneakers'} on sale!`
    ],
    cars: [
      `🚗 ${discount}% below market: ${extractBrand(deal.title) || 'Dream car'} deal!`,
      `🔥 Car enthusiasts: This won't last long!`,
      `🚗 ${extractBrand(deal.title) || 'Luxury'} at a steal price!`,
      `💎 Clean title, cleaner price: ${discount}% OFF!`
    ]
  };
  
  const categoryHooks = hooks[category] || [
    `🔥 ${discount}% OFF this incredible find!`,
    `💰 Deal alert: ${discount}% below market!`,
    `⚡ Limited time: ${discount}% discount!`
  ];
  
  // Pick random hook for variety
  return categoryHooks[Math.floor(Math.random() * categoryHooks.length)];
}

/**
 * Generate deal details section
 */
function generateDetails(deal) {
  const title = deal.title || 'Amazing Deal';
  const price = formatPrice(deal.price);
  const originalPrice = deal.original_price ? formatPrice(deal.original_price) : null;
  const discount = calculateDiscount(deal);
  
  let details = `📦 ${title}\n💵 ${price}`;
  
  if (originalPrice) {
    details += ` (was ${originalPrice})`;
  }
  
  if (discount) {
    details += `\n💚 ${discount}% savings = $${Math.round(deal.original_price - deal.price).toLocaleString()} in your pocket`;
  }
  
  if (deal.source) {
    details += `\n🏪 Source: ${deal.source}`;
  }
  
  return details;
}

/**
 * Generate value proposition (why it's a good deal)
 */
function generateValueProp(deal) {
  const category = (deal.category || '').toLowerCase();
  const score = deal.score || 0;
  const discount = calculateDiscount(deal);
  
  const valuePros = {
    watches: [
      `This is ${discount}% below typical grey market pricing. Verified seller, authentic guarantee.`,
      `Grey market pricing at its finest. Same watch, ${discount}% less than authorized dealers.`,
      `Perfect condition, authentic papers. This is how smart collectors buy luxury watches.`
    ],
    sneakers: [
      `Below StockX average by ${discount}%. Authenticated and ready to ship.`,
      `Market price is trending up, but this seller is motivated. Don't miss this.`,
      `Deadstock condition, below market pricing. Size matters—check availability fast.`
    ],
    cars: [
      `Clean CarFax, well-maintained, ${discount}% below KBB value. This is rare.`,
      `Low mileage for the year, private seller motivated. Serious buyers only.`,
      `Market is competitive, but this price won't last. Inspections welcome.`
    ]
  };
  
  const categoryValues = valuePros[category] || [
    `Deal score: ${score}/20. We track prices 24/7 so you don't have to.`,
    `This is ${discount}% below typical market pricing. Act fast!`,
    `Our algorithm flagged this as exceptional value. Don't sleep on it.`
  ];
  
  return categoryValues[Math.floor(Math.random() * categoryValues.length)];
}

/**
 * Generate optimized hashtags by category
 */
function generateHashtags(category, deal) {
  const baseHashtags = [
    '#thehubdeals',
    '#deals',
    '#sale',
    '#discount',
    '#shopping',
    '#savemoney',
    '#dealoftheday',
    '#bargain'
  ];
  
  const categoryHashtags = {
    watches: [
      '#watches',
      '#watchdeals',
      '#luxurywatch',
      '#watchcollector',
      '#rolex',
      '#omega',
      '#greymarket',
      '#watchfam',
      '#wristwatch',
      '#horology',
      '#watchesofinstagram',
      '#watchaddict',
      '#watchcommunity',
      '#watchgeek',
      '#timepiece',
      '#luxurywatches',
      '#watchdeal',
      '#watchsale',
      '#rolexdeals',
      '#omegadeals',
      '#watchmarket',
      '#chrono24'
    ],
    sneakers: [
      '#sneakers',
      '#sneakerdeals',
      '#sneakerhead',
      '#jordan',
      '#nike',
      '#kicksdeals',
      '#sneakercommunity',
      '#sneakerculture',
      '#jordans',
      '#nikedunks',
      '#yeezy',
      '#sneakersale',
      '#kicks',
      '#sneakerholics',
      '#solecollector',
      '#hypebeast',
      '#stockx',
      '#goat',
      '#sneakernews',
      '#nicekicks',
      '#kotd',
      '#wdywt'
    ],
    cars: [
      '#cars',
      '#cardeals',
      '#usedcars',
      '#carsofinstagram',
      '#porsche',
      '#bmw',
      '#mercedes',
      '#audi',
      '#carsale',
      '#carsforsale',
      '#luxurycars',
      '#carmarket',
      '#carenthusiast',
      '#carporn',
      '#autotrader',
      '#cargram',
      '#carlifestyle',
      '#carspotting',
      '#supercar',
      '#exoticcars',
      '#bmwm',
      '#porsche911'
    ],
    sports: [
      '#sports',
      '#sportsdeals',
      '#sportscards',
      '#nba',
      '#nfl',
      '#trading cards',
      '#sportsmemorabilia',
      '#collectibles',
      '#cardcollector'
    ],
    tech: [
      '#tech',
      '#techdeals',
      '#electronics',
      '#gadgets',
      '#smartphone',
      '#laptop',
      '#gaming',
      '#technews',
      '#techsale'
    ]
  };
  
  // Get category-specific hashtags
  const catHashtags = categoryHashtags[category?.toLowerCase()] || [];
  
  // Combine: 8 base + 22 category-specific = 30 total
  const allHashtags = [...baseHashtags, ...catHashtags.slice(0, 22)];
  
  return allHashtags.join(' ');
}

/**
 * Calculate discount percentage
 */
function calculateDiscount(deal) {
  if (!deal.original_price || !deal.price) return 0;
  return Math.round(((deal.original_price - deal.price) / deal.original_price) * 100);
}

/**
 * Format price nicely
 */
function formatPrice(price) {
  if (!price) return '$??';
  const num = parseFloat(price);
  if (isNaN(num)) return '$' + price;
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Extract brand name from title
 */
function extractBrand(title) {
  if (!title) return null;
  
  const brands = {
    watches: ['Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Patek Philippe', 'Audemars Piguet', 'Seiko', 'Tudor', 'Cartier', 'IWC'],
    sneakers: ['Nike', 'Jordan', 'Adidas', 'Yeezy', 'New Balance', 'Asics', 'Puma', 'Reebok', 'Vans', 'Converse'],
    cars: ['Porsche', 'BMW', 'Mercedes', 'Audi', 'Ferrari', 'Lamborghini', 'Tesla', 'Lexus', 'Toyota', 'Honda']
  };
  
  const allBrands = Object.values(brands).flat();
  
  for (const brand of allBrands) {
    if (title.includes(brand)) {
      return brand;
    }
  }
  
  return null;
}

/**
 * Generate story caption (shorter, more casual)
 */
function generateStoryCaption(deal) {
  const discount = calculateDiscount(deal);
  const emoji = getCategoryEmoji(deal.category);
  
  return `${emoji} ${discount}% OFF!
  
${deal.title}

${formatPrice(deal.price)} ${deal.original_price ? `(was ${formatPrice(deal.original_price)})` : ''}

Swipe up for details! 🔗`;
}

/**
 * Get category emoji
 */
function getCategoryEmoji(category) {
  const map = {
    watches: '⌚',
    sneakers: '👟',
    cars: '🚗',
    sports: '⚽',
    tech: '💻'
  };
  return map[category?.toLowerCase()] || '🔥';
}

// Export functions
module.exports = {
  generateCaption,
  generateStoryCaption,
  generateHashtags
};

// CLI usage for testing
if (require.main === module) {
  const testDeal = {
    title: "Rolex Submariner Date 41mm",
    price: 8500,
    original_price: 13000,
    score: 18,
    category: "watches",
    source: "Chrono24"
  };
  
  console.log('=== INSTAGRAM CAPTION ===\n');
  console.log(generateCaption(testDeal));
  console.log('\n\n=== STORY CAPTION ===\n');
  console.log(generateStoryCaption(testDeal));
}
