# Instagram Auto-Poster - Quick Start

## ✅ What's Built

I just created an **Instagram auto-posting system** that safely posts hot deals using the official Instagram Graph API.

### Files Created:
1. **`scripts/generate-deal-card.js`** - Generates Instagram-ready 1080x1080 images
2. **`scripts/instagram-auto-poster.js`** - Posts to Instagram via official API
3. **`scripts/INSTAGRAM-SETUP-GUIDE.md`** - Complete setup walkthrough
4. **`scripts/test-instagram-card.sh`** - Quick test script

### Test Image Generated:
`test-instagram-card.png` - Check it out! This is what your Instagram posts will look like.

---

## 🚀 Next Steps (You Need to Do These):

### 1. Set Up Instagram Business Account
- Switch your Instagram to Business/Creator account (in app settings)

### 2. Create Facebook Page
- Go to facebook.com/pages/create
- Name it "The Hub"

### 3. Link Instagram to Facebook Page
- Instagram Settings → Linked Accounts → Facebook

### 4. Create Facebook App & Get API Access
- Go to developers.facebook.com/apps
- Create app, add Instagram permissions
- Get your access token and account ID

**📖 Full step-by-step guide:** `scripts/INSTAGRAM-SETUP-GUIDE.md`

### 5. Add Credentials to .env
```env
INSTAGRAM_ACCESS_TOKEN=your_token_here
INSTAGRAM_ACCOUNT_ID=your_account_id_here
INSTAGRAM_SCORE_THRESHOLD=12
```

---

## 🧪 Testing

### Test card generation (works now):
```bash
bash scripts/test-instagram-card.sh
```

### Test posting (after setup):
```bash
# Dry run (doesn't actually post)
DRY_RUN=true node scripts/instagram-auto-poster.js

# Post for real
node scripts/instagram-auto-poster.js
```

---

## 🎯 How It Works

1. Queries Supabase for deals with `score >= 12`
2. Generates branded Instagram image with:
   - Deal title & price
   - Original price (crossed out)
   - Discount percentage badge
   - Deal score
   - Category emoji
3. Creates caption with hashtags
4. Posts via official Instagram Graph API
5. Marks deal as posted (won't post again)
6. Waits 60s between posts (rate limit safety)

---

## 🎨 Card Design

The generated cards have:
- **The Hub** branding at top
- Deal score badge (top right)
- Big price display
- Original price (crossed out)
- Discount % badge
- Source & category

Colors: Orange/Blue/Yellow brand theme

---

## ⚙️ Automation Ideas

Once working, you can:

### Run manually when needed:
```bash
node scripts/instagram-auto-poster.js
```

### Schedule with cron (twice daily):
```bash
crontab -e
# Add:
0 10,18 * * * cd /Users/sydneyjackson/the-hub && node scripts/instagram-auto-poster.js >> logs/instagram.log 2>&1
```

### Or trigger from The Hub dashboard
Add a button to run the script on-demand

---

## 🛡️ Safety Features

- ✅ **Official API** - No risk of ban (unlike bots)
- ✅ **Rate limiting** - Waits 60s between posts
- ✅ **Dry run mode** - Test without posting
- ✅ **Database tracking** - Won't post the same deal twice
- ✅ **Error handling** - Continues on failure

---

## 📊 Limits

- **25 posts per day** (Instagram's limit)
- **200 API calls per hour** (Graph API limit)
- Script posts 1 deal at a time with 60s delay (safe)

---

## 🔧 Dependencies Installed

- `sharp` - Image generation library ✅ installed

---

## 📞 When You're Ready

1. Read the full setup guide: `scripts/INSTAGRAM-SETUP-GUIDE.md`
2. Do the Facebook/Instagram setup steps (takes ~15 min)
3. Add credentials to `.env`
4. Test with: `DRY_RUN=true node scripts/instagram-auto-poster.js`
5. Go live! 🚀

Let me know if you get stuck on any step. I can help debug or walk you through it.

---

## 🎉 What This Gets You

- **Automated Instagram presence** - Posts hot deals automatically
- **Professional looking cards** - Branded, clean design
- **Growth potential** - Instagram's algorithm loves consistent posting
- **SEO juice** - More backlinks to The Hub
- **Traffic** - Drive followers to Telegram/newsletter
- **Credibility** - Active social presence builds trust

Time to grow The Hub on Instagram! 📈
