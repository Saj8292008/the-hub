# Email Setup Checklist

## Step 1: Purchase Domain ⏳
- [ ] Buy `thehub.deals` from Cloudflare or Namecheap
- [ ] Verify ownership
- [ ] Configure nameservers

## Step 2: Choose Email Provider ⏳
**Recommended: Google Workspace**
- [ ] Sign up at workspace.google.com
- [ ] Select "Business Starter" plan ($6/user/month)
- [ ] Enter domain: thehub.deals

## Step 3: Create Email Accounts ⏳

### Leadership
- [ ] `syd@thehub.deals` - Syd Jackson (CEO)
- [ ] `jay@thehub.deals` - Jay (AI Co-Founder/CTO)

### Growth Team
- [ ] `marcus@thehub.deals` - Marcus (Head of Growth)
- [ ] `nina@thehub.deals` - Nina (Content Manager)

### Engineering Team
- [ ] `dev@thehub.deals` - Dev (Lead Engineer)
- [ ] `data@thehub.deals` - Data (Data Analyst)

### Operations Team
- [ ] `ops@thehub.deals` - Ops (Operations Manager)

### Shared Resources
- [ ] `deals@thehub.deals` - Newsletter sender
- [ ] `hello@thehub.deals` - General inquiries
- [ ] `support@thehub.deals` - User support

**Total accounts needed:** 10  
**Monthly cost:** $60 (or start with 3 and add more later)

## Step 4: DNS Configuration ⏳
- [ ] Add MX records from Google Workspace
- [ ] Add SPF record: `v=spf1 include:_spf.google.com ~all`
- [ ] Add DKIM record (Google provides this)
- [ ] Add DMARC record: `v=DMARC1; p=quarantine; rua=mailto:dmarc@thehub.deals`
- [ ] Wait for DNS propagation (up to 48 hours, usually 1-2 hours)

## Step 5: Test Email ⏳
- [ ] Send test email from `syd@thehub.deals`
- [ ] Send test email from `deals@thehub.deals`
- [ ] Verify emails arrive in inbox (not spam)
- [ ] Check mail-tester.com score (aim for 10/10)

## Step 6: Configure Email Signatures ⏳

### Syd's Signature
```
---
Sydney Jackson
Founder & CEO, The Hub
syd@thehub.deals | thehub.deals
```

### Jay's Signature
```
---
Jay
AI Co-Founder & CTO, The Hub
jay@thehub.deals | thehub.deals
Built by humans, powered by AI 🤖
```

### Team Signatures (Template)
```
---
[Name]
[Role], The Hub
[email]@thehub.deals | thehub.deals
```

## Step 7: Update The Hub Backend ⏳
- [ ] Update newsletter sender: `deals@thehub.deals`
- [ ] Configure SMTP settings in environment variables
- [ ] Test newsletter send
- [ ] Update contact forms to send to `hello@thehub.deals`

## Step 8: Update Marketing Materials ⏳
- [ ] Website footer (add email links)
- [ ] Social media bios
- [ ] Newsletter templates
- [ ] Email signatures everywhere

## Budget Consideration

### Option 1: Full Team (Recommended)
- 10 email accounts @ $6/month = **$60/month**
- All team members can send/receive
- Full Google Workspace features

### Option 2: Starter (Budget)
- 3 accounts @ $6/month = **$18/month**
  - `syd@thehub.deals`
  - `jay@thehub.deals`
  - `deals@thehub.deals`
- Add team emails later as needed
- Use email aliases for others (free)

### Option 3: Ultra Budget
- Cloudflare Email Routing (FREE)
- Forward all emails to existing Gmail
- Can't send FROM these addresses (only receive)

**Recommendation:** Start with Option 2 (3 accounts), expand to Option 1 when revenue comes in.

## Timeline

**Day 1 (Today):**
- [ ] Purchase domain (10 min)
- [ ] Sign up for Google Workspace (15 min)
- [ ] Create initial 3 accounts (15 min)

**Day 2:**
- [ ] DNS propagation complete (wait)
- [ ] Test emails (30 min)
- [ ] Set up signatures (15 min)

**Day 3:**
- [ ] Update The Hub backend (1-2 hours)
- [ ] Send first newsletter from new domain (15 min)
- [ ] Celebrate! 🎉

## Who's Doing What

**Syd:** Purchase domain, approve expenses
**Ops (Jay):** Configure DNS, set up accounts
**Dev (Jay):** Update backend code
**Nina (Jay):** Write email signatures, update marketing

---

**Status:** Ready to execute  
**Next step:** Syd approves domain purchase → Ops starts setup
