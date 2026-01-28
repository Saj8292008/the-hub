# Start The Hub Server - Quick Steps ⚡

**Follow these 3 commands in order:**

---

## ✅ Step 1: Fix NPM Permissions

**Copy and run this command (will ask for your password):**

```bash
sudo chown -R $(id -u):$(id -g) "/Users/sydneyjackson/.npm"
```

**Expected:** Prompt for password, then completes silently

---

## ✅ Step 2: Install Dependencies

**Copy and run this command:**

```bash
npm install
```

**Expected output:**
```
added XXX packages in Xs
```

This will install:
- bcrypt (password hashing)
- jsonwebtoken (authentication)
- nodemailer (email sending)
- express-rate-limit (API rate limiting)
- All other required packages

**Time:** ~1-2 minutes

---

## ✅ Step 3: Start Backend Server

**Copy and run this command:**

```bash
npm run dev
```

**Expected output:**
```
[dotenv] injecting env from .env
info: Starting The Hub API Server...
info: Server started on port 3000
✅ Watch scraper scheduler started
   ENABLE_SCRAPER_SCHEDULER: true
📧 Starting Newsletter Scheduler
   Schedule: 0 9 * * 5 (Every Friday at 9:00 AM)
✅ Newsletter scheduler started
```

**Server will be running on:** http://localhost:3000

Leave this terminal window open - the server is running here.

---

## ✅ Step 4: Start Frontend (New Terminal)

**Open a NEW terminal window and run:**

```bash
cd /Users/sydneyjackson/the-hub/the-hub
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXXms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Frontend will be running on:** http://localhost:5173

---

## ✅ Step 5: Verify Everything Works

**In a third terminal (or browser), test:**

```bash
# Test backend
curl http://localhost:3000/health

# Test scraper status
curl http://localhost:3000/api/scraper-debug/scheduler/status

# Test newsletter status
curl http://localhost:3000/api/newsletter/scheduler/status
```

**Or run automated verification:**
```bash
./scripts/verify-setup.sh
```

**Expected:** All systems operational! 🚀

---

## 🌐 Access Your Platform

Once both servers are running:

**Main Dashboard:**
- http://localhost:5173

**Admin Dashboards:**
- http://localhost:5173/admin - Admin settings
- http://localhost:5173/admin/scraper-debug - Scraper monitoring
- http://localhost:5173/newsletter/admin - Newsletter management

**Category Pages:**
- http://localhost:5173/watches - Watch listings
- http://localhost:5173/cars - Car listings
- http://localhost:5173/sneakers - Sneaker listings
- http://localhost:5173/sports - Sports scores
- http://localhost:5173/blog - Blog posts

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'bcrypt'"
**Solution:** You skipped Step 2. Run `npm install` first.

### Error: "Port 3000 already in use"
**Solution:** Kill existing process:
```bash
lsof -ti:3000 | xargs kill
```
Then run `npm run dev` again.

### Error: "EACCES" or permission errors
**Solution:** Run Step 1 again (fix npm permissions).

### Server starts but shows warnings
**Solution:** Some warnings are normal (like STRIPE_SECRET_KEY not configured). As long as you see "Server started on port 3000", you're good!

---

## 📊 What Happens Automatically

Once servers are running:

**Every 15 minutes:**
- Reddit scraper runs → adds new watch listings

**Every 30 minutes:**
- eBay scraper runs → adds more listings

**Every hour:**
- WatchUSeek scraper runs → adds forum listings

**Every Friday at 9:00 AM EST:**
- AI generates newsletter content
- Sends to all active subscribers
- Tracks opens and clicks

**Every 6 hours:**
- Deal scoring runs on all listings
- Updates deal scores (0-10 rating)

---

## 🎉 You're All Set!

Your Hub platform is now:
- ✅ Scraping listings automatically
- ✅ Ready to send newsletters
- ✅ Monitoring everything
- ✅ Fully operational

**Next steps:**
1. Subscribe to newsletter: http://localhost:5173/blog (scroll down)
2. Check scrapers: http://localhost:5173/admin/scraper-debug
3. Test newsletter generation: http://localhost:5173/newsletter/admin
4. Add watches to watchlist for better scraping

---

**Need help?** Check `QUICK_START_GUIDE.md` for detailed instructions.
