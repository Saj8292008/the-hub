# Affiliate Tracking Link Setup

How to use your tracking links effectively.

---

## 🔗 Your Unique Affiliate Link

### Basic Format
```
https://thehub.deals/ref/YOUR_AFFILIATE_ID
```

Your affiliate ID is assigned when you join the program. Find it in your affiliate dashboard.

**Example:**
```
https://thehub.deals/ref/sarah123
```

---

## 🎯 Deep Linking

Link directly to specific pages for better conversions.

### Homepage (Default)
```
https://thehub.deals/ref/YOUR_ID
```

### Pricing Page
```
https://thehub.deals/pricing?ref=YOUR_ID
```

### Category Pages
```
https://thehub.deals/deals/restaurants?ref=YOUR_ID
https://thehub.deals/deals/spas?ref=YOUR_ID
https://thehub.deals/deals/entertainment?ref=YOUR_ID
```

### Specific City
```
https://thehub.deals/austin?ref=YOUR_ID
https://thehub.deals/denver?ref=YOUR_ID
```

### Signup Page (Direct)
```
https://thehub.deals/signup?ref=YOUR_ID
```

---

## 📊 UTM Parameters for Campaign Tracking

Add UTM parameters to track which campaigns perform best.

### UTM Format
```
https://thehub.deals/ref/YOUR_ID?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN
```

### Parameter Definitions

| Parameter | Purpose | Examples |
|-----------|---------|----------|
| `utm_source` | Where traffic comes from | youtube, instagram, newsletter |
| `utm_medium` | Type of link/traffic | video, post, email, bio |
| `utm_campaign` | Specific campaign name | summer2024, restaurant-review |
| `utm_content` | A/B test variants | cta-red, headline-v2 |

### Examples by Platform

**YouTube Video:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=youtube&utm_medium=video&utm_campaign=restaurant-review-march
```

**Instagram Bio:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=instagram&utm_medium=bio
```

**Instagram Story:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=instagram&utm_medium=story&utm_campaign=deal-spotlight
```

**Newsletter:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=newsletter&utm_medium=email&utm_campaign=weekly-digest-march12
```

**Blog Post:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=blog&utm_medium=post&utm_campaign=hub-review
```

**TikTok:**
```
https://thehub.deals/ref/YOUR_ID?utm_source=tiktok&utm_medium=bio
```

---

## 🔧 Link Shortening

Long URLs with UTM parameters can look ugly. Use these options:

### Option 1: Bitly (Free)
1. Go to bitly.com
2. Paste your full tracking URL
3. Get shortened link like `bit.ly/3xYzAbc`
4. Track clicks in Bitly dashboard

### Option 2: Custom Domain (Pro)
If you have your own domain:
```
yourdomain.com/hub → redirects to full tracking URL
```

### Option 3: Pretty Links (WordPress)
Use Pretty Links plugin to create:
```
yourblog.com/recommends/the-hub
```

### ⚠️ Important
- Always test shortened links before publishing
- Never edit the base tracking URL when shortening
- Some platforms (Instagram) may flag certain shorteners

---

## 📱 Link in Bio Setup

### Linktree / Beacons / Stan Store
Add your tracking link as one of your buttons:
- Button text: "Save 50% on Local Deals" or "Try The Hub Free"
- URL: Your full tracking link

### Direct Instagram Bio
If you have 1 link only:
```
https://thehub.deals/ref/YOUR_ID?utm_source=instagram&utm_medium=bio
```

---

## 🖥️ Banner & Creative Tracking

When using banner ads, the tracking is built into the link:

```html
<a href="https://thehub.deals/ref/YOUR_ID?utm_source=website&utm_medium=banner&utm_campaign=sidebar-300x250">
  <img src="banner-300x250.png" alt="The Hub - Save on Local Deals">
</a>
```

---

## 📈 Tracking Dashboard Features

Your affiliate dashboard shows:

### Real-Time Metrics
- **Clicks:** Total link clicks
- **Uniques:** Unique visitors
- **Signups:** Trial starts
- **Conversions:** Paid subscriptions
- **Revenue:** Your earnings

### By Campaign
- Filter by UTM parameters
- See which sources convert best
- Identify top-performing content

### Historical Data
- Daily/weekly/monthly views
- Trend analysis
- Payout history

---

## 🍪 Cookie Information

### How It Works
1. User clicks your link
2. 90-day cookie is placed
3. If they sign up within 90 days, you get credit
4. Cookie persists through free trial

### Cookie Behavior
- **First touch attribution:** First affiliate to refer gets credit
- **Cross-device:** Limited (cookie-based)
- **Incognito/cleared cookies:** Tracking lost

### Tips to Maximize Attribution
- Encourage immediate signups ("Try free now")
- Remind your audience about the free trial
- Follow up with additional content

---

## ❓ Troubleshooting

### "My clicks aren't showing"
- Wait 24 hours (some delay is normal)
- Check link formatting (no typos in affiliate ID)
- Test link yourself (in incognito)
- Contact support if persistent

### "Conversion didn't track"
- User may have cleared cookies
- User may have used different device
- User may have existing account
- 30-day holdback period before commission shows

### "Link isn't working"
- Check for extra spaces in URL
- Ensure proper URL encoding for special characters
- Test in incognito browser
- Verify affiliate account is active

---

## 📞 Support

**Email:** affiliates@thehub.deals
**Dashboard:** affiliates.thehub.deals
**Response Time:** Within 24 hours

---

## ✅ Quick Checklist

Before going live:
- [ ] Copied affiliate ID correctly
- [ ] Tested link in incognito browser
- [ ] Added UTM parameters for tracking
- [ ] Link goes to intended page
- [ ] Shortened link works (if using)
- [ ] Disclosure is included with link
