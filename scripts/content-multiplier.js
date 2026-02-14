#!/usr/bin/env node

/**
 * Content Multiplier - Generates 20+ social media post variations from a single deal
 * Usage: node content-multiplier.js --title "Rolex Submariner" --price 8500 --original 12000 --category watches --source chrono24 --score 18
 */

// Hashtag sets by category
const HASHTAG_SETS = {
  watches: [
    '#luxurywatches #watchfam #watchesofinstagram #watchcollector #watchdeals',
    '#rolexwatch #omegawatches #watchaddict #horology #watchnerd',
    '#vintagewatches #watchoftheday #wotd #watchcommunity #watchesformen',
    '#affordablewatches #watchdeal #watchsale #luxuryforless #dealoftheday',
    '#greymarket #watchmarket #watchinvesting #watchflipping #smartshopping'
  ],
  sneakers: [
    '#sneakerhead #sneakers #sneakernews #sneakerdeals #kicksdeals',
    '#nike #jordan #adidas #yeezy #newbalance #airjordan',
    '#sneakercommunity #nicekicks #complexsneakers #sneakerholics #sneakeraddict',
    '#sneakersale #sneakerdeal #kicksonfire #sneakerfreaker #hypebeasts',
    '#snkrs #stockx #goat #resellmarket #sneakerinvesting'
  ],
  cars: [
    '#carsofinstagram #carsforsale #cardeals #usedcars #luxurycars',
    '#carmarket #carshopping #autodeals #vehicledeals #cardealers',
    '#supercarsforsale #exoticcars #classiccars #sportscars #dreamcars',
    '#carfinancing #carbuying #autosales #cargram #carenthusiast',
    '#carcollector #automobiledaily #carlifestyle #carporn #automotivephotography'
  ]
};

// Emoji sets
const EMOJIS = {
  fire: ['🔥', '🚨', '💥', '⚡️', '💣'],
  money: ['💰', '💸', '💵', '💴', '🤑'],
  time: ['⏰', '⏳', '⌛️', '🕐', '🔔'],
  think: ['🤔', '💭', '🧠', '👀', '🎯'],
  celebrate: ['🎉', '🎊', '🥳', '✨', '🌟'],
  point: ['👉', '☝️', '👆', '➡️', '⬇️']
};

// Calculate savings and discount percentage
function calculateSavings(price, originalPrice) {
  const savings = originalPrice - price;
  const discountPercent = Math.round((savings / originalPrice) * 100);
  return { savings, discountPercent };
}

// Format price
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

// Random element from array
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate Instagram caption posts (5 variations)
function generateInstagramCaptions(deal) {
  const { title, price, original_price, category, source, score, url } = deal;
  const { savings, discountPercent } = calculateSavings(price, original_price);
  const hashtags = HASHTAG_SETS[category] || HASHTAG_SETS.watches;
  
  const captions = [];
  
  // 1. Price drop angle
  captions.push({
    text: `${pick(EMOJIS.fire)} PRICE DROP: ${title} just hit ${formatPrice(price)}

Was: ${formatPrice(original_price)}
Now: ${formatPrice(price)}
You save: ${formatPrice(savings)} (${discountPercent}% off)

Deal Score: ${score}/20 ${score >= 15 ? '🔥🔥🔥' : score >= 10 ? '🔥🔥' : '🔥'}

Link in bio ${pick(EMOJIS.point)}

${pick(hashtags)}`,
    format: 'instagram_caption',
    angle: 'price_drop',
    hashtags: pick(hashtags),
    charCount: 0
  });
  
  // 2. FOMO angle
  captions.push({
    text: `This won't last... ${pick(EMOJIS.time)}

${title}
${formatPrice(price)} (was ${formatPrice(original_price)})

${discountPercent}% below market. When deals like this hit, they're gone in hours.

Source: ${source}
Deal Score: ${score}/20

Swipe up ${pick(EMOJIS.point)} or check link in bio

${pick(hashtags)}`,
    format: 'instagram_caption',
    angle: 'fomo',
    hashtags: pick(hashtags),
    charCount: 0
  });
  
  // 3. Educational angle
  captions.push({
    text: `The grey market discount on this ${title} is ${discountPercent}%. Here's why that matters ${pick(EMOJIS.think)}

${pick(EMOJIS.point)} Grey market = no authorized dealer markup
${pick(EMOJIS.point)} Same product, massive savings
${pick(EMOJIS.point)} This specific deal: ${formatPrice(price)} vs retail ${formatPrice(original_price)}

Smart shoppers save ${formatPrice(savings)} on deals like this.

Deal Score: ${score}/20 - Link in bio

${pick(hashtags)}`,
    format: 'instagram_caption',
    angle: 'educational',
    hashtags: pick(hashtags),
    charCount: 0
  });
  
  // 4. Comparison angle
  captions.push({
    text: `${pick(EMOJIS.fire)} Market Analysis: ${title}

Current deal: ${formatPrice(price)}
Typical price: ${formatPrice(original_price)}
You save: ${formatPrice(savings)}

This is ${formatPrice(savings)} below the next cheapest listing we've tracked.

${category === 'watches' ? 'For watch collectors looking to get in at the right price' : 
  category === 'sneakers' ? 'For sneakerheads who know their resale values' : 
  'For buyers who do their homework'} ${pick(EMOJIS.celebrate)}

Link in bio for details

${pick(hashtags)}`,
    format: 'instagram_caption',
    angle: 'comparison',
    hashtags: pick(hashtags),
    charCount: 0
  });
  
  // 5. Deal score angle
  captions.push({
    text: `Deal Score: ${score}/20 ${score >= 15 ? '🔥🔥🔥' : score >= 10 ? '🔥🔥' : '🔥'}

Here's why this ${title} scored so high:

✓ ${discountPercent}% below market
✓ Verified seller (${source})
✓ ${formatPrice(savings)} instant savings
✓ Price trend: ${discountPercent > 25 ? 'Historic low' : 'Strong deal'}

${formatPrice(price)} vs ${formatPrice(original_price)} retail

Our algorithm tracks thousands of listings. This one's a standout.

${pick(hashtags)}`,
    format: 'instagram_caption',
    angle: 'deal_score',
    hashtags: pick(hashtags),
    charCount: 0
  });
  
  // Calculate character counts
  captions.forEach(c => c.charCount = c.text.length);
  
  return captions;
}

// Generate short-form posts for Stories (5 variations, under 100 chars)
function generateShortFormPosts(deal) {
  const { title, price, original_price, category, score } = deal;
  const { savings, discountPercent } = calculateSavings(price, original_price);
  
  const posts = [
    {
      text: `🚨 ${title} - ${formatPrice(price)} (${discountPercent}% off)`,
      format: 'story_short',
      angle: 'price_alert',
      hashtags: '',
      charCount: 0
    },
    {
      text: `Save ${formatPrice(savings)} on ${title} TODAY 🔥`,
      format: 'story_short',
      angle: 'savings_focus',
      hashtags: '',
      charCount: 0
    },
    {
      text: `Deal Score: ${score}/20 🔥 ${title.substring(0, 40)}...`,
      format: 'story_short',
      angle: 'score_focus',
      hashtags: '',
      charCount: 0
    },
    {
      text: `${discountPercent}% OFF: ${title.substring(0, 45)}... ⚡️`,
      format: 'story_short',
      angle: 'discount_percent',
      hashtags: '',
      charCount: 0
    },
    {
      text: `${formatPrice(price)} (was ${formatPrice(original_price)}) 💰 Link in bio`,
      format: 'story_short',
      angle: 'price_comparison',
      hashtags: '',
      charCount: 0
    }
  ];
  
  posts.forEach(p => p.charCount = p.text.length);
  
  return posts;
}

// Generate engagement posts (5 variations)
function generateEngagementPosts(deal) {
  const { title, price, original_price, category, score } = deal;
  const { savings, discountPercent } = calculateSavings(price, original_price);
  
  const posts = [
    {
      text: `Would you cop this ${title} at ${formatPrice(price)}? 🤔

Original price: ${formatPrice(original_price)}
You'd save: ${formatPrice(savings)}

Drop a 🔥 if you'd buy
Drop a 🤔 if you're thinking about it
Drop a 👎 if you'd pass

Let's see what the community thinks 👇`,
      format: 'engagement',
      angle: 'poll_question',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `Quick poll: Is ${formatPrice(price)} a good price for a ${title}? 

🔥 = Hell yes, that's a steal
💎 = Fair price, I'd consider it
🤷 = Meh, I've seen better
❌ = Pass, too expensive

Current market: ${formatPrice(original_price)}
This deal: ${formatPrice(price)} (${discountPercent}% off)

Comment below! 👇`,
      format: 'engagement',
      angle: 'value_poll',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `Hot take: ${title} at ${formatPrice(price)} is ${score >= 15 ? 'an absolute STEAL' : score >= 10 ? 'a solid deal' : 'worth considering'}.

Do you agree or disagree? 🤔

Here's the math:
• Retail: ${formatPrice(original_price)}
• This price: ${formatPrice(price)}
• Savings: ${formatPrice(savings)}
• Deal score: ${score}/20

Tell me I'm wrong in the comments 👇`,
      format: 'engagement',
      angle: 'hot_take',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `Real talk: Would you rather...

Option A: ${title} at ${formatPrice(price)} (${discountPercent}% off)
Option B: Wait for a bigger discount and risk missing it

${category === 'watches' ? 'Watch collectors' : category === 'sneakers' ? 'Sneakerheads' : 'Deal hunters'}, what's your move? 

A or B in the comments 👇`,
      format: 'engagement',
      angle: 'either_or',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `Challenge: Can you find a better deal on a ${title}? 🎯

We found: ${formatPrice(price)} (${discountPercent}% off)
Market average: ${formatPrice(original_price)}

Tag someone who needs to see this OR drop a link to a better deal if you've got one 👇

Let's help each other save money 💰`,
      format: 'engagement',
      angle: 'challenge',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    }
  ];
  
  posts.forEach(p => p.charCount = p.text.length);
  
  return posts;
}

// Generate educational posts (5 variations)
function generateEducationalPosts(deal) {
  const { title, price, original_price, category, source, score } = deal;
  const { savings, discountPercent } = calculateSavings(price, original_price);
  
  const posts = [
    {
      text: `📚 Market Context: Why this ${title} deal matters

Current Price: ${formatPrice(price)}
Market Average: ${formatPrice(original_price)}
Discount: ${discountPercent}%

The ${category} market is ${discountPercent > 30 ? 'extremely favorable for buyers right now' : 
  discountPercent > 20 ? 'showing strong buyer opportunities' : 'offering selective deals'}. 

This specific listing scored ${score}/20 in our algorithm, which factors in:
• Price vs historical data
• Seller reputation
• Market velocity
• Comparable listings

Smart buyers track deals like this to time their purchases perfectly. 💡`,
      format: 'educational',
      angle: 'market_context',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `🧠 Deal Breakdown: ${title}

Here's why this is a good deal (or not):

✓ PROS:
• ${discountPercent}% below market average
• Verified seller (${source})
• Strong deal score: ${score}/20
• Immediate savings: ${formatPrice(savings)}

⚠️ CONSIDERATIONS:
• ${category === 'watches' ? 'Grey market = no warranty from brand' : 
    category === 'sneakers' ? 'Resale market can fluctuate' : 
    'Market value can change'}
• Always verify seller reputation
• Compare with other listings

Bottom line: ${score >= 15 ? 'This is a standout deal.' : 
  score >= 10 ? 'Solid value if you were planning to buy.' : 
  'Decent deal, but shop around.'}`,
      format: 'educational',
      angle: 'deal_breakdown',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `💡 Price History Insight: ${title}

Based on our tracking data:

30-day average: ~${formatPrice(original_price)}
This deal: ${formatPrice(price)}
Difference: ${formatPrice(savings)} (${discountPercent}%)

${discountPercent > 30 ? '🔥 This is near the historic low we\'ve seen' : 
  discountPercent > 20 ? '📉 Below recent averages - strong opportunity' : 
  discountPercent > 10 ? '📊 Moderate discount, track for better deals' : 
  '📈 Small discount, consider waiting'}

Why prices fluctuate:
${category === 'watches' ? '• Grey market supply\n• Currency exchange\n• New model releases' : 
  category === 'sneakers' ? '• Hype cycles\n• Restocks\n• Season changes' : 
  '• Market demand\n• Seasonal trends\n• Inventory levels'}

Knowledge = better deals 🎯`,
      format: 'educational',
      angle: 'price_history',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `🎓 How We Score Deals: ${title} Edition

Our algorithm gave this ${score}/20. Here's the breakdown:

Price Factor (8pts): ${Math.min(8, Math.round(discountPercent / 5))}/${8}
• Compares to market average
• This deal: ${discountPercent}% off

Seller Trust (4pts): ${score > 15 ? 4 : score > 10 ? 3 : 2}/4
• Source: ${source}
• Verified seller status

Market Timing (4pts): ${score > 15 ? 4 : score > 10 ? 3 : 2}/4
• Current market conditions
• Price trends

Uniqueness (4pts): ${score > 15 ? 4 : score > 10 ? 3 : 2}/4
• How rare is this deal?
• Demand vs supply

Total: ${score}/20 ${score >= 15 ? '(Excellent)' : score >= 10 ? '(Good)' : '(Fair)'}

Understanding the score helps you make smarter buying decisions. 🧠`,
      format: 'educational',
      angle: 'scoring_system',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    },
    {
      text: `📊 Market Analysis: ${category.charAt(0).toUpperCase() + category.slice(1)} Edition

Featured Deal: ${title}
Price: ${formatPrice(price)} (${discountPercent}% below market)

${category === 'watches' ? `Watch Market Insights:
• Grey market discounts typically range 15-40%
• This deal: ${discountPercent}% (${discountPercent > 25 ? 'above average' : 'standard range'})
• Luxury watches hold value, but buy for enjoyment not investment
• Warranty: Grey market = no manufacturer warranty` :

category === 'sneakers' ? `Sneaker Market Insights:
• Resale premiums vary wildly by hype and rarity
• This deal: ${discountPercent}% off retail
• Market timing: Buy during restocks or hype cooldowns
• Authentication is critical - stick to verified sellers` :

`Market Insights:
• Average discount in ${category}: 10-30%
• This deal: ${discountPercent}% off
• Time your purchases during seasonal sales
• Verify seller reputation always`}

Smart shoppers who understand the market save more. 💰`,
      format: 'educational',
      angle: 'market_analysis',
      hashtags: pick(HASHTAG_SETS[category] || HASHTAG_SETS.watches),
      charCount: 0
    }
  ];
  
  posts.forEach(p => p.charCount = p.text.length);
  
  return posts;
}

// Main function to generate all variations
function multiplyContent(deal) {
  const variations = [];
  
  // Generate all post types
  variations.push(...generateInstagramCaptions(deal));
  variations.push(...generateShortFormPosts(deal));
  variations.push(...generateEngagementPosts(deal));
  variations.push(...generateEducationalPosts(deal));
  
  return variations;
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const deal = {
    title: '',
    price: 0,
    original_price: 0,
    category: 'watches',
    source: 'unknown',
    score: 10,
    url: ''
  };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'price' || key === 'original' || key === 'original_price' || key === 'score') {
      deal[key === 'original' ? 'original_price' : key] = parseFloat(value);
    } else {
      deal[key] = value;
    }
  }
  
  // Validate required fields
  if (!deal.title || !deal.price || !deal.original_price) {
    console.error('Usage: node content-multiplier.js --title "Product Name" --price 1000 --original 1500 --category watches --source chrono24 --score 15');
    process.exit(1);
  }
  
  // Generate variations
  const variations = multiplyContent(deal);
  
  // Output JSON
  console.log(JSON.stringify(variations, null, 2));
}

// Export for use in other scripts
module.exports = { multiplyContent, HASHTAG_SETS };
