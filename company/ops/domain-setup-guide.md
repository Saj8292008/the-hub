# Domain & Email Setup Guide

## Step 1: Purchase Domain

### Recommended Options
1. **thehub.deals** (Best option - on brand)
2. **hub.deals** (Shorter, premium pricing)
3. **thehub.io** (Tech vibe, $39/year)
4. **thehubdeals.com** (Fallback, $12/year)

### Where to Buy
- **Cloudflare** ($8-12/year, best for email forwarding)
- **Namecheap** ($10-15/year, easy to use)
- **Google Domains** → Squarespace now ($12/year)

**Recommendation:** Buy via Cloudflare for cost + free email routing

## Step 2: Email Setup

### Option A: Google Workspace (Recommended)
**Cost:** $6/month per user  
**Pros:** Professional, reliable, integrates with everything  
**Setup time:** 30 minutes

**Emails to create:**
- `syd@thehub.deals` - Main email
- `jay@thehub.deals` - AI co-founder email (just for fun)
- `deals@thehub.deals` - Newsletter sender
- `hello@thehub.deals` - General inquiries

**Steps:**
1. Sign up at workspace.google.com
2. Verify domain ownership (add TXT record)
3. Configure MX records
4. Set up users
5. Configure SPF/DKIM/DMARC for deliverability

### Option B: Cloudflare Email Routing (Free!)
**Cost:** FREE  
**Pros:** Free, simple forwarding  
**Cons:** Can't send FROM these emails (only receive)

**Best for:** Forwarding emails to existing Gmail

**Steps:**
1. Enable Email Routing in Cloudflare dashboard
2. Add email addresses to forward
3. Verify ownership
4. Test it

### Option C: Zoho Mail (Budget Option)
**Cost:** $1/month per user  
**Pros:** Cheap, full features  
**Cons:** Less polish than Google

## Step 3: DNS Configuration

### Required Records

```dns
# MX Records (for receiving email)
Priority 10: mx1.provider.com
Priority 20: mx2.provider.com

# SPF Record (prevents spoofing)
TXT: v=spf1 include:_spf.provider.com ~all

# DKIM Record (email authentication)
TXT: [Provider will give you this]

# DMARC Record (email policy)
TXT: v=DMARC1; p=quarantine; rua=mailto:dmarc@thehub.deals
```

## Step 4: Newsletter Configuration

### Update The Hub to send from custom domain

**In Supabase/Backend:**
```javascript
// Update email sender
const sender = 'deals@thehub.deals'
const senderName = 'The Hub Deals'

// Configure SMTP
smtp: {
  host: 'smtp.gmail.com', // or other provider
  port: 587,
  secure: false,
  auth: {
    user: 'deals@thehub.deals',
    pass: process.env.EMAIL_PASSWORD
  }
}
```

### Test sending
```bash
# Send test email
curl -X POST http://localhost:3000/api/newsletter/send-test \
  -H "Content-Type: application/json" \
  -d '{"to": "syd@thehub.deals", "subject": "Test"}'
```

## Step 5: Email Signatures

### Syd's Signature
```html
---
Sydney Jackson
Founder & CEO, The Hub
syd@thehub.deals | thehub.deals
```

### Jay's Signature (for the memes)
```html
---
Jay
AI Co-Founder & CTO, The Hub
jay@thehub.deals | thehub.deals
Built by humans, powered by AI 🤖
```

## Step 6: Brand Assets

### Create for email use
- Logo (200x50px for email headers)
- Favicon
- Social media images
- Email banner (600x200px)

## Timeline

**Day 1:**
- Purchase domain: 10 minutes
- Set up Cloudflare: 20 minutes
- Configure email forwarding: 15 minutes

**Day 2:**
- Sign up for Google Workspace: 30 minutes
- Verify domain: 15 minutes
- Create email accounts: 15 minutes

**Day 3:**
- Configure SPF/DKIM/DMARC: 30 minutes
- Test email sending: 30 minutes
- Update The Hub config: 1 hour

**Total time:** ~4-5 hours spread over 3 days

## Cost Breakdown

### Option 1: Full Professional (Recommended)
- Domain: $12/year
- Google Workspace (2 users): $144/year
- **Total: $156/year ($13/month)**

### Option 2: Budget
- Domain: $12/year
- Cloudflare Email (free): $0/year
- **Total: $12/year ($1/month)**

## Next Steps

1. **Buy the domain** (Do this today!)
2. Choose email provider (Google Workspace recommended)
3. Configure DNS records
4. Test email sending
5. Update newsletter system
6. Send first email from branded domain 🎉

---

**Ready to pull the trigger?** Let Syd know which option you want and we'll get it done today.
