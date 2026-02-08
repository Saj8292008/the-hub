# Reddit Bot - Quick Start (5 Minutes)

Browser automation that posts Reddit comments for you.

---

## Step 1: Set Credentials (1 min)

```bash
export REDDIT_USERNAME="your_reddit_username"
export REDDIT_PASSWORD="your_reddit_password"
```

Or create `.env` file:
```bash
cd /Users/sydneyjackson/the-hub
cp .env.example .env
# Edit .env and add your credentials
```

---

## Step 2: Test It (Interactive)

```bash
./scripts/test-reddit-bot.sh
```

This gives you 3 options:
1. **Test login** - Just logs in, shows you it works
2. **Dry run** - Finds posts, generates comments, DOESN'T post
3. **Live posting** - Actually posts (be careful!)

**Start with option 1 to test login!**

---

## Step 3: Dry Run First (Safe)

```bash
node scripts/reddit-auto-comment.js --dry-run --count=5
```

This will:
- Find 5 good posts in r/Watches
- Generate helpful comments
- Show you what it WOULD post
- NOT actually post anything

**Review the comments it generates. If they look good, proceed.**

---

## Step 4: Post For Real (3-5 comments/day)

```bash
node scripts/reddit-auto-comment.js --count=3
```

This will:
- Find good posts
- Generate comments
- Actually post them
- Wait 2-5 minutes between comments (looks human)
- Save history so it won't double-comment

Browser stays open so you can watch it work.

---

## Safety Settings

**Built-in protection:**
- ✅ 2-5 minute delays between comments
- ✅ Tracks history (won't comment twice)
- ✅ Realistic typing speed
- ✅ Saves cookies (doesn't spam logins)

**Your responsibility:**
- ⚠️ Don't post >5 comments/day (looks bot-like)
- ⚠️ Use aged Reddit account (30+ days, some karma)
- ⚠️ Start with dry-run mode
- ⚠️ Review generated comments before going live

---

## What It Does

### Finds Good Posts
Looks for:
- [Identify] posts - "What watch is this?"
- [Question] posts - "Which watch should I buy?"
- [Collection] posts - "Just got this watch!"

### Generates Helpful Comments
Uses templates like:
```
Based on the dial style, this looks like a Seiko 5 from the 1970s.
Check the caseback for a 6119-xxxx reference number to confirm.
These typically sell for $75-150 depending on condition.

Beautiful piece! The patina on that dial is great.
```

### Posts Like a Human
- Types slowly (100ms per keystroke)
- Random delays between actions
- Waits 2-5 minutes between comments
- Uses real browser (not headless bot)

---

## Files Created

- `data/reddit-cookies.json` - Saved login (so you don't login every time)
- `logs/reddit-comments.json` - History of what you've commented on

---

## Troubleshooting

**"Could not find comment box"**
→ Reddit changed their UI
→ Open an issue or update selectors in `reddit-bot.js`

**"Login failed"**
→ Wrong credentials or CAPTCHA
→ Check username/password
→ Try logging in manually once

**Comments not showing up**
→ Check in incognito mode (are you shadowbanned?)
→ Post slower (increase delays)
→ Use account with more karma

---

## Recommended Schedule

### Day 1-2: Test Mode
- Dry run only
- Review all generated comments
- Don't post anything yet

### Day 3-4: Go Live (Slowly)
- Post 3 comments/day max
- Monitor karma/responses
- Adjust templates if needed

### Day 5+: Automate
- Post 5 comments/day
- Run once in morning, once in evening
- Check results daily

---

## Commands Cheat Sheet

```bash
# Interactive menu
./scripts/test-reddit-bot.sh

# Test login
node scripts/reddit-bot.js

# Dry run (safe)
node scripts/reddit-auto-comment.js --dry-run

# Post 3 comments
node scripts/reddit-auto-comment.js --count=3

# Different subreddit
node scripts/reddit-auto-comment.js Watches --count=5
```

---

## Next Steps

1. ✅ Set credentials (export REDDIT_USERNAME/PASSWORD)
2. ✅ Test login: `./scripts/test-reddit-bot.sh` → option 1
3. ✅ Dry run: option 2 or `--dry-run` flag
4. ✅ Review generated comments
5. ✅ If good, post 3 comments: option 3
6. ✅ Check karma tomorrow
7. ✅ Repeat daily (3-5 comments/day)

---

**Ready?** Run `./scripts/test-reddit-bot.sh` and choose option 1 to test login!
