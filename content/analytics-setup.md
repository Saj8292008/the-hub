# Google Analytics Setup Guide for The Hub

## Quick Start

Your site is ready for Google Analytics! All HTML files have GA4 tracking code with a placeholder ID. Just follow these steps to activate it.

## Step 1: Create Google Analytics Property

1. Go to [https://analytics.google.com](https://analytics.google.com)
2. Sign in with your Google account (pythoncoding0829@gmail.com)
3. Click **Admin** (gear icon in bottom left)
4. Click **+ Create Property**
5. Fill in property details:
   - **Property name:** The Hub Deals
   - **Reporting time zone:** America/Chicago (or your timezone)
   - **Currency:** USD
6. Click **Next**
7. Select business details (optional, can skip)
8. Click **Create**

## Step 2: Set Up Web Data Stream

1. After creating property, you'll see "Set up a data stream"
2. Click **Web**
3. Enter website details:
   - **Website URL:** https://thehubdeals.com
   - **Stream name:** The Hub Main Site
4. Click **Create stream**
5. **Copy your Measurement ID** - it looks like: `G-XXXXXXXXXX`

## Step 3: Replace Placeholder ID

Your GA4 tracking code is already installed in all HTML files with placeholder ID `G-XXXXXXXXXX`.

Find and replace this placeholder with your real Measurement ID:

```bash
# Quick replace (run from The Hub directory):
cd /Users/sydneyjackson/the-hub/the-hub

# Replace in public files (source)
grep -rl "G-XXXXXXXXXX" public/ | xargs sed -i '' 's/G-XXXXXXXXXX/G-YOUR-REAL-ID/g'

# Replace in dist files (built)
grep -rl "G-XXXXXXXXXX" dist/ | xargs sed -i '' 's/G-XXXXXXXXXX/G-YOUR-REAL-ID/g'
```

**Or manually:** Search for `G-XXXXXXXXXX` in all HTML files and replace with your ID.

## Step 4: Verify Installation

1. Visit your site: https://thehubdeals.com
2. Open Google Analytics
3. Go to **Reports** → **Realtime**
4. You should see your visit appear within ~10 seconds

## Custom Events Tracked

The Hub automatically tracks these custom events:

### 1. Newsletter Signup
**Event:** `newsletter_signup`
- Triggers when user submits email on landing page
- Parameters: `location` (hero/mid/footer)

### 2. Price Check
**Event:** `price_check`
- Triggers when user checks watch price
- Parameters: `brand`, `model`

### 3. Telegram Link Click
**Event:** `telegram_click`
- Triggers when user clicks Telegram link
- Parameters: `location` (nav/footer/cta)

### 4. Deal Click
**Event:** `deal_click`
- Triggers when user clicks on a deal card
- Parameters: `category`, `deal_name`

## View Events in GA4

1. Go to **Reports** → **Engagement** → **Events**
2. You'll see all custom events listed
3. Click any event to see parameters and details

## Conversion Setup (Optional)

Mark important events as conversions:

1. Go to **Admin** → **Events** (under Data display)
2. Toggle "Mark as conversion" for:
   - `newsletter_signup`
   - `telegram_click`

## Files Modified

✅ All public HTML files have GA4 tracking:
- `/the-hub/public/index.html`
- `/the-hub/public/tools/price-checker.html`
- `/the-hub/dist/index.html` 
- `/the-hub/dist/tools/price-checker.html`
- All blog posts in `/the-hub/dist/blog/*.html`

## Need Help?

- **GA4 Documentation:** https://support.google.com/analytics/answer/9304153
- **Event Reference:** https://developers.google.com/analytics/devguides/collection/ga4/events

---

**Last Updated:** 2026-02-12
