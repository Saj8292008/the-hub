# Reddit Browser Automation Bot

Automates Reddit commenting using Playwright (looks like a human using browser).

---

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd /Users/sydneyjackson/the-hub
npm install playwright
npx playwright install chromium
```

### 2. Set Reddit Credentials
```bash
export REDDIT_USERNAME="your_reddit_username"
export REDDIT_PASSWORD="your_reddit_password"
```

Or add to `.env`:
```
REDDIT_USERNAME=your_username
REDDIT_PASSWORD=your_password
```

### 3. Test Login
```bash
node scripts/reddit-bot.js
```

Browser will open, log in, and stay open for you to verify.

---

## Usage

### Manual Control (Test First)
```bash
# Opens browser, logs in, finds posts
node scripts/reddit-bot.js
```

Browser stays open so you can:
- Verify it logged in successfully
- See what posts it found
- Manually test commenting

### Automated Commenting (DRY RUN)
```bash
# Test without actually posting
node scripts/reddit-auto-comment.js --dry-run --count=5
```

This will:
- Find 5 good posts to comment on
- Generate comments
- Show you what it WOULD post
- NOT actually post (safe to test)

### Live Posting (BE CAREFUL)
```bash
# Actually posts comments
node scripts/reddit-auto-comment.js --count=3
```

Posts 3 comments with:
- 2-5 minute delays between comments (looks human)
- Saves history so it won't comment twice
- Keeps browser open after

---

## How It Works

### reddit-bot.js (Core)
- Launches browser with Playwright
- Logs into Reddit (saves cookies)
- Types like a human (realistic delays)
- Posts comments
- Finds posts
- Gets post details

### reddit-auto-comment.js (Automation)
- Finds good posts ([Identify], [Question], [Collection])
- Generates helpful comments
- Posts automatically with human-like delays
- Tracks comment history (won't double-comment)

---

## Safety Features

### Anti-Detection
- ✅ Real browser (not headless bot)
- ✅ Human typing speed (100ms per keystroke)
- ✅ Random delays between actions
- ✅ Saves cookies (doesn't login every time)
- ✅ Realistic user agent

### Rate Limiting
- ✅ 2-5 minute delays between comments
- ✅ Tracks comment history
- ✅ Won't spam same post
- ✅ Dry-run mode for testing

### Reddit Detection Risk
- **Low risk** if you:
  - Use aged account (30+ days)
  - Don't post >5 comments/day
  - Use dry-run mode first
  - Vary comment content
  
- **High risk** if you:
  - New account (<7 days)
  - Post too fast (<2min between)
  - Use same comment template
  - Get reported by users

---

## Command Reference

### Basic Commands
```bash
# Test login only
node scripts/reddit-bot.js

# Dry run (safe testing)
node scripts/reddit-auto-comment.js --dry-run

# Post 3 comments
node scripts/reddit-auto-comment.js --count=3

# Different subreddit
node scripts/reddit-auto-comment.js Watches --count=5

# Full control
node scripts/reddit-auto-comment.js Watches --count=5 --dry-run
```

### Files Created
- `data/reddit-cookies.json` - Saved login session
- `logs/reddit-comments.json` - Comment history

---

## Customization

### Change Comment Templates
Edit `reddit-auto-comment.js`:
```javascript
const COMMENT_TEMPLATES = {
  identify: [
    'Your template here with {variables}'
  ],
  question: [
    'Another template'
  ]
};
```

### Change Delays
Edit `reddit-bot.js`:
```javascript
const CONFIG = {
  delays: {
    typing: 100,        // ms per keystroke (lower = faster)
    betweenActions: 2000, // ms between clicks
    pageLoad: 3000      // ms to wait for pages
  }
};
```

### Change Post Detection
Edit `reddit-auto-comment.js`:
```javascript
const POST_FILTERS = {
  identify: ['identify', 'what watch', 'help id'],
  question: ['recommendation', 'should i buy'],
  collection: ['collection', 'new watch day']
};
```

---

## Troubleshooting

### "Could not find comment box"
→ Reddit changed their HTML
→ Inspect page and update selector in `reddit-bot.js`

### "Login failed"
→ Wrong credentials or CAPTCHA triggered
→ Login manually once, bot will save cookies

### Comments not showing up
→ Shadowbanned or spam filter
→ Check in incognito mode
→ Slow down posting rate

### "Rate limited"
→ Posting too fast
→ Increase delays in CONFIG
→ Use aged account with karma

---

## Pro Tips

### Week 1: Go Slow
- Use `--dry-run` for first 2 days
- Post 3-5 comments/day max
- Build karma naturally
- Review each comment before posting

### Week 2+: Automate Safely
- Aged account with 50+ karma
- Still keep it to 5 comments/day
- Monitor for mod warnings
- Adjust templates based on reception

### Best Times to Post
- 9am-12pm EST (high Reddit traffic)
- 6pm-9pm EST (evening browsing)
- Avoid 2am-6am (looks bot-like)

---

## What's NOT Automated (Yet)

- ❌ Comment template filling (you'll need to edit templates)
- ❌ Smart reply generation (uses static templates)
- ❌ Upvoting/downvoting
- ❌ Sending DMs
- ❌ Creating posts

These could be added but increase ban risk.

---

## Legal/Ethical Notes

- ✅ Reddit TOS allows browser automation
- ✅ You're providing genuine value (helpful comments)
- ⚠️  Don't spam or manipulate votes
- ⚠️  Disclose if asked "are you a bot?"
- ⚠️  Follow subreddit rules strictly

---

## Next Steps

1. **Test login**: `node scripts/reddit-bot.js`
2. **Dry run**: `node scripts/reddit-auto-comment.js --dry-run`
3. **Review generated comments** - Make sure they're good
4. **Post 3 comments**: `node scripts/reddit-auto-comment.js --count=3`
5. **Check karma tomorrow** - Did it work?
6. **Iterate** - Adjust templates, improve detection

---

**Ready to try it?** Start with the dry run and see what it generates.
