# Content Multiplier 🚀

Generate 20+ unique social media post variations from a single deal.

## Features

✅ **20+ variations per deal** across 4 formats:
- 5 Instagram captions (full-length with hashtags)
- 5 Stories/short-form posts (<100 chars)
- 5 Engagement posts (polls, questions, CTAs)
- 5 Educational posts (market context, insights)

✅ **Multiple angles** for each deal:
- Price drop alerts
- FOMO/urgency messaging
- Educational market context
- Price comparisons
- Deal score breakdowns
- Engagement questions
- Price history insights

✅ **Category-specific hashtags** for watches, sneakers, and cars

✅ **Character counts** for each post variation

## Usage

### Single Deal (Command Line)

```bash
# Basic usage
node content-multiplier.js --title "Rolex Submariner" --price 8500 --original 12000 --category watches --source chrono24 --score 18

# Output is JSON (pipe to jq for formatting)
node content-multiplier.js --title "Nike Dunk Low Panda" --price 140 --original 220 --category sneakers --source stockx --score 16 | jq '.[0:3]'
```

**Parameters:**
- `--title` - Product name (required)
- `--price` - Current price (required)
- `--original` - Original/retail price (required)
- `--category` - watches | sneakers | cars (default: watches)
- `--source` - Deal source (default: unknown)
- `--score` - Deal quality score 1-20 (default: 10)
- `--url` - Product URL (optional)

### Batch Processing (Database)

```bash
# Dry run (preview without saving)
node content-multiplier-batch.js --dry-run

# Generate content for top 5 deals
node content-multiplier-batch.js

# Generate content for top 10 deals
node content-multiplier-batch.js --limit=10
```

**Output:**
- Saves to: `/Users/sydneyjackson/the-hub/content/social/multiplied-{date}.json`
- Includes summary stats and all generated posts

### Programmatic Usage

```javascript
const { multiplyContent } = require('./content-multiplier');

const deal = {
  title: 'Rolex Submariner Date 116610LN',
  price: 8500,
  original_price: 12000,
  category: 'watches',
  source: 'chrono24',
  score: 18,
  url: 'https://...'
};

const variations = multiplyContent(deal);
// Returns array of 20 post objects with format, angle, text, hashtags, charCount
```

## Testing

Run the test script to see sample output:

```bash
node test-with-sample-data.js
```

This will generate example posts for both a watch deal and a sneaker deal.

## Output Format

Each variation includes:

```json
{
  "text": "Full post text with emojis and hashtags...",
  "format": "instagram_caption",
  "angle": "price_drop",
  "hashtags": "#luxurywatches #watchfam...",
  "charCount": 225
}
```

## Post Types

### Instagram Captions (5 variations)
- Price drop angle
- FOMO/urgency angle
- Educational angle
- Comparison angle
- Deal score angle

### Story Short-Form (5 variations)
All under 100 characters:
- Price alert
- Savings focus
- Score focus
- Discount percentage
- Price comparison

### Engagement Posts (5 variations)
- Poll questions
- Value polls
- Hot takes
- Either/or choices
- Community challenges

### Educational Posts (5 variations)
- Market context
- Deal breakdowns
- Price history insights
- Scoring system explanations
- Market analysis

## Hashtag Strategy

**Watches:**
- Broad: #luxurywatches #watchfam #watchesofinstagram
- Niche: #watchaddict #horology #greymarket
- Deal-focused: #watchdeal #watchsale #luxuryforless

**Sneakers:**
- Broad: #sneakerhead #sneakers #kicks
- Niche: #complexsneakers #sneakeraddict #hypebeasts
- Deal-focused: #sneakerdeals #kicksdeals #sneakersale

**Cars:**
- Broad: #carsofinstagram #carsforsale
- Niche: #exoticcars #classiccars #carcollector
- Deal-focused: #cardeals #autodeals #autosales

## Integration with The Hub

### Daily Workflow

1. **Morning**: Run batch processor to generate content from overnight deals
   ```bash
   node content-multiplier-batch.js
   ```

2. **Review**: Check generated posts in `content/social/multiplied-{date}.json`

3. **Schedule**: Use scheduling tool to queue posts throughout the day

4. **Track**: Monitor engagement by format/angle to optimize future posts

### Automation Ideas

- Cron job to run batch processor daily
- Webhook to trigger on new high-score deals
- Integration with social media scheduling tools
- A/B testing different angles for same deal
- Performance tracking by format/angle

## Customization

Edit `content-multiplier.js` to customize:
- **HASHTAG_SETS** - Add/modify category-specific hashtags
- **EMOJIS** - Change emoji sets used in posts
- **Post templates** - Modify text templates for different angles
- **Character limits** - Adjust for different platforms

## Requirements

- Node.js v14+
- For batch processing: Supabase database configured (see `.env`)

## Files

- `content-multiplier.js` - Main content generation engine
- `content-multiplier-batch.js` - Batch processor with database integration
- `test-with-sample-data.js` - Test script with sample data

## Example Output

See the test output for live examples:
```bash
node test-with-sample-data.js
```

---

Built for The Hub Deals by Sydney Jackson
