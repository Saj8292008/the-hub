# Instagram Auto-Poster Setup Guide

Complete guide to set up Instagram Graph API posting for The Hub.

## Prerequisites
- Instagram Business or Creator account
- Facebook Page (required for API access)
- Node.js installed

## Step 1: Convert Instagram to Business Account

1. Open Instagram app
2. Go to **Settings → Account**
3. Tap **Switch to Professional Account**
4. Choose **Business** (or Creator works too)
5. Complete the setup

✅ **Done!** Your Instagram is now a Business account.

---

## Step 2: Create Facebook Page

1. Go to [facebook.com/pages/create](https://facebook.com/pages/create)
2. Name it "The Hub" (or your brand name)
3. Choose category: **Product/Service** or **Brand**
4. Fill in basic info
5. **Publish the page** (doesn't need to be fancy, just public)

✅ **Done!** You have a Facebook Page.

---

## Step 3: Link Instagram to Facebook Page

1. Open Instagram app
2. Go to **Settings → Account → Linked Accounts**
3. Tap **Facebook**
4. Log in and select your "The Hub" page
5. Grant permissions

Or via Facebook:
1. Go to your Facebook Page
2. Click **Settings → Instagram**
3. Click **Connect Account**
4. Log in to Instagram and link

✅ **Done!** Instagram is linked to your Facebook Page.

---

## Step 4: Create Facebook App (for API access)

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click **Create App**
3. Choose **Business** as app type
4. Fill in:
   - **App name:** "The Hub Poster" (or anything)
   - **Contact email:** Your email
   - **Business account:** (optional, can skip)
5. Click **Create App**

✅ **Done!** You have a Facebook App.

---

## Step 5: Add Instagram Basic Display

1. In your app dashboard, scroll down
2. Find **Instagram Basic Display** → Click **Set Up**
3. Fill in:
   - **Valid OAuth Redirect URIs:** `https://localhost/`
   - **Deauthorize Callback URL:** `https://localhost/`
   - **Data Deletion Request URL:** `https://localhost/`
4. Click **Save Changes**

✅ **Done!** Instagram Basic Display is added.

---

## Step 6: Get Your Access Token

### Option A: Using Graph API Explorer (Recommended)

1. Go to [developers.facebook.com/tools/explorer](https://developers.facebook.com/tools/explorer)
2. Select your app in the dropdown
3. In **Permissions** dropdown, add:
   - `instagram_basic`
   - `instagram_content_publish`
   - `pages_read_engagement`
   - `pages_show_list`
4. Click **Generate Access Token**
5. Log in and grant permissions
6. **Copy the access token** (looks like: `EAABsbCS1iHgBO...`)

### Option B: Manual OAuth Flow

If Option A doesn't work, I can help you with the manual OAuth flow.

---

## Step 7: Get Your Instagram Account ID

1. Still in Graph API Explorer
2. In the query box, enter: `me/accounts`
3. Click **Submit**
4. Find your page and copy its `id`
5. Now query: `<PAGE_ID>?fields=instagram_business_account`
6. Copy the `instagram_business_account.id` (this is your Instagram Account ID)

**Example:**
```json
{
  "instagram_business_account": {
    "id": "17841405309211844"  // ← This is what you need
  }
}
```

---

## Step 8: Add Credentials to .env

Add these to `/Users/sydneyjackson/the-hub/.env`:

```env
# Instagram API
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
INSTAGRAM_SCORE_THRESHOLD=12

# Optional
DRY_RUN=false  # Set to true to test without actually posting
```

---

## Step 9: Install Dependencies

```bash
cd /Users/sydneyjackson/the-hub
npm install sharp
```

---

## Step 10: Test the Setup

### Test image generation:
```bash
node scripts/generate-deal-card.js '{"title":"Test Watch","price":499,"original_price":999,"score":15,"category":"watches","source":"amazon"}' test-card.png
```

Should create `test-card.png` ✅

### Test Instagram posting (dry run):
```bash
cd /Users/sydneyjackson/the-hub
DRY_RUN=true node scripts/instagram-auto-poster.js
```

Should show what it would post without actually posting ✅

### Post for real:
```bash
node scripts/instagram-auto-poster.js
```

Should post to your Instagram! 🎉

---

## Troubleshooting

### "Invalid Access Token"
- Token expired (they last 60 days by default)
- Generate a new one from Graph API Explorer
- Consider getting a long-lived token (lasts 60 days)

### "Invalid OAuth access token"
- Wrong permissions granted
- Re-generate token with correct permissions

### "Media processing failed"
- Image format issue
- Make sure sharp is installed: `npm install sharp`

### "Rate limit exceeded"
- Instagram limits: ~25 posts/day
- Script waits 60s between posts automatically
- Don't run the script multiple times quickly

### Image not generating
```bash
npm install sharp
```

---

## Getting a Long-Lived Token (60 days)

Short tokens expire in hours. Get a long-lived one:

1. Get your short-lived token from Graph API Explorer
2. Run this (replace values):
```bash
curl -i -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```

3. Response has your long-lived token
4. Update `.env` with the new token

Find APP_ID and APP_SECRET in your app dashboard under Settings → Basic.

---

## Automation with Cron

Once working, add to crontab to post automatically:

```bash
# Post hot deals twice daily (10am and 6pm)
0 10,18 * * * cd /Users/sydneyjackson/the-hub && /usr/local/bin/node scripts/instagram-auto-poster.js >> logs/instagram.log 2>&1
```

Or use a system-level cron job.

---

## API Limits

- **25 posts per day** (Instagram limit)
- **200 requests per hour** (Graph API limit)
- Script automatically waits 60s between posts

---

## Security Notes

- **Never commit .env** (already in .gitignore)
- Access tokens are sensitive - treat like passwords
- Use environment variables in production
- Consider using Facebook's long-lived tokens

---

## What the Script Does

1. Queries Supabase for deals with `score >= 12` that haven't been posted
2. Generates Instagram-ready 1080x1080 image for each deal
3. Creates caption with emojis, price, discount, hashtags
4. Uploads image to Instagram via Graph API
5. Publishes the post
6. Marks deal as posted in database (won't post again)
7. Waits 60s between posts to respect rate limits

---

## Need Help?

If you get stuck:
1. Show me the error message
2. Tell me which step you're on
3. I'll help debug

Let's get this automated! 🚀
