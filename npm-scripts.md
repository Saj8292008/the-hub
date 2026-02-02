# The Hub - NPM Scripts Reference

## Start the App
```bash
npm start           # Start the full app (API + bots + schedulers)
npm run server      # Start only the API server
npm run bot         # Start only the Telegram bot
```

## Telegram
```bash
# Trigger content manually
curl -X POST http://localhost:3000/api/telegram/trigger/morning   # Morning Brief
curl -X POST http://localhost:3000/api/telegram/trigger/dotd      # Deal of the Day
curl -X POST http://localhost:3000/api/telegram/trigger/hot       # Hot Deals
curl -X POST http://localhost:3000/api/telegram/trigger/drops     # Price Drops
curl -X POST http://localhost:3000/api/telegram/trigger/evening   # Evening Roundup
curl -X POST http://localhost:3000/api/telegram/trigger/weekend   # Weekend Roundup
curl -X POST http://localhost:3000/api/telegram/trigger/stats     # Weekly Stats
curl -X POST http://localhost:3000/api/telegram/trigger/monday    # Market Monday

# Post custom message
curl -X POST http://localhost:3000/api/telegram/post \
  -H "Content-Type: application/json" \
  -d '{"message": "Your message here"}'

# Post poll
curl -X POST http://localhost:3000/api/telegram/poll \
  -H "Content-Type: application/json" \
  -d '{"question": "Best watch brand?", "options": ["Rolex", "Omega", "Seiko"]}'

# Get status
curl http://localhost:3000/api/telegram/status
curl http://localhost:3000/api/telegram/stats
curl http://localhost:3000/api/telegram/schedules
```

## Standalone Scripts
```bash
node scripts/post-deal-of-the-day.js      # Post deal of the day
node scripts/post-best-deals.js           # Post top deals
node scripts/post-weekend-roundup.js      # Post weekend roundup
node scripts/migrate-telegram-features.js # Run DB migration
```

## Testing
```bash
npm test                    # Run all tests
npm run test:api           # Run API tests
npm run test:scrapers      # Test scraping
```

## Database
```bash
node scripts/migrate-telegram-features.js  # Add Telegram feature tables
```
