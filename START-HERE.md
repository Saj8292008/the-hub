# 🚀 START HERE - Quick Launch Guide

## Open Two Terminals

### Terminal 1: Backend API

```bash
npm run server
```

**What it does:** Starts the Node.js API server on port 3000 with all scraper endpoints.

**You'll see:**
```
✅ API Server is running on port 3000
📊 Dashboard API: http://localhost:3000
🔌 WebSocket server ready
```

---

### Terminal 2: Frontend Dashboard

```bash
cd the-hub
npm run dev
```

**What it does:** Starts the React dashboard with Vite dev server on port 5173.

**You'll see:**
```
VITE v5.4.21  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## Open Your Browser

Navigate to: **http://localhost:5173**

### What to Try First

1. **Check the Dashboard**
   - Look for "Recent Listings" widget at the bottom
   - Should say "No listings yet" initially

2. **Click "Watch Listings" in Sidebar**
   - New page with scraper interface
   - See scraper stats at top

3. **Click "Scrape Reddit" Button**
   - Wait 5-10 seconds
   - Live watch listings appear!
   - Check "Recent Listings" widget on dashboard

4. **Try Searching**
   - Enter "Omega" + "Speedmaster"
   - Click "Search"
   - Watch aggregated results from all sources

5. **Apply Filters**
   - Select "reddit" from Source dropdown
   - Type "Rolex" in Brand field
   - Set price range
   - Watch real-time filtering

---

## Common Commands

```bash
# Test backend scrapers only
npm run scrape

# Start just backend
npm run server

# Start just frontend
cd the-hub && npm run dev

# Build frontend for production
cd the-hub && npm run build

# Run backend tests
npm run test:new-scrapers
```

---

## Troubleshooting

**Backend won't start?**
```bash
# Check if port 3000 is in use
lsof -ti:3000

# Kill process on port 3000 if needed
kill -9 $(lsof -ti:3000)

# Try starting again
npm run server
```

**Frontend won't start?**
```bash
# Make sure you're in the right directory
cd the-hub

# Install dependencies if needed
npm install

# Try starting again
npm run dev
```

**No listings appearing?**
1. Make sure backend is running (Terminal 1)
2. Click "Scrape Reddit" button
3. Wait 10 seconds
4. Refresh page

**"Failed to load listings" error?**
- Backend might not be running
- Check Terminal 1 for errors
- Try restarting backend

---

## What You Should See

### Dashboard (http://localhost:5173)
- Stats cards at top
- Latest alerts section
- Watchlist snapshot
- **Recent Listings** widget (new!)

### Watch Listings Page (http://localhost:5173/watch-listings)
- Scraper stats (3 cards showing success rates)
- Search box (search all sources)
- Scrape buttons (Reddit, eBay, All)
- Filters (source, brand, price range)
- Listings grid (beautiful cards with images)

---

## Documentation

- `DASHBOARD-INTEGRATION-COMPLETE.md` - Full integration guide
- `SCRAPER-QUICK-START.md` - Backend setup
- `SCRAPER-FRAMEWORK.md` - Technical docs
- `SCRAPER-QUICK-REF.md` - Command reference

---

## Ready to Deploy?

See `RENDER-DEPLOYMENT.md` for production deployment guide.

---

**That's it! You're ready to go. Just open two terminals and run the commands above.** 🚀
