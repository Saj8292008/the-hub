# Newsletter System Setup Guide

Complete setup and testing guide for The Hub newsletter system.

## ✅ Completed Setup

- [x] Backend services implemented
- [x] Frontend components created
- [x] Routes and navigation integrated
- [x] Resend API key configured (`re_LwqJPi5k_2sNqph4WLrNd6LX9hpNHQMvY`)
- [x] Environment variables set

## 🗄️ Step 1: Run Database Migration

The newsletter system needs 4 new tables in your Supabase database.

### Option A: Supabase Dashboard (Recommended)

1. Open Supabase SQL Editor:
   ```
   https://supabase.com/dashboard/project/sysvawxchniqelifyenl/sql
   ```

2. Click "New Query"

3. Copy the entire contents of:
   ```
   supabase/migrations/20260126000000_newsletter_system.sql
   ```

4. Paste into the SQL Editor

5. Click "Run" or press `Cmd/Ctrl + Enter`

6. You should see: "Success. No rows returned"

### Option B: Display Migration (for easy copy/paste)

```bash
./scripts/runNewsletterMigration.sh
```

This will display the SQL migration for easy copying.

### Verify Migration

After running, verify the tables exist:

```bash
node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('newsletter_campaigns').select('id').limit(1).then(({error}) => console.log(error ? '❌ Migration needed' : '✅ Tables exist!'));
"
```

## 📧 Step 2: Test Email Service

Send a test email to verify Resend integration works:

```bash
node scripts/testNewsletterEmail.js your-email@example.com
```

This will:
- ✅ Verify API key is configured
- ✅ Send a test confirmation email
- ✅ Display the Resend email ID
- ✅ Confirm email service is working

**Expected Output:**
```
✅ Email sent successfully!
   Email ID: abc123...
📬 Check your inbox at your-email@example.com
🎉 Newsletter email service is working!
```

## 🚀 Step 3: Start the Application

Start both frontend and backend:

```bash
# Terminal 1: Backend
cd /Users/sydneyjackson/the-hub
npm run dev

# Terminal 2: Frontend
cd /Users/sydneyjackson/the-hub/the-hub
npm run dev
```

## 🧪 Step 4: End-to-End Testing

### Test 1: Email Subscription Flow

1. Go to `http://localhost:5173/blog`
2. Click on any blog post
3. Scroll to bottom and find the email capture form
4. Enter your email and name
5. Click "Subscribe"
6. ✅ Should see success message
7. ✅ Check your inbox for confirmation email
8. Click "Confirm Subscription" in the email
9. ✅ Should see confirmation page
10. ✅ Check inbox for welcome email

### Test 2: Exit Intent Popup

1. Go to any blog post: `http://localhost:5173/blog/[any-post]`
2. Move mouse to top of browser (like you're leaving)
3. ✅ Popup should appear
4. Subscribe via popup
5. ✅ Should receive confirmation email

### Test 3: Admin Dashboard

1. Go to `http://localhost:5173/admin`
2. Click "Newsletter" tab
3. Click "Newsletter Admin Dashboard" link
4. ✅ Should see 4 tabs: Monitor, Campaigns, Subscribers, Analytics

### Test 4: AI Newsletter Generation

1. In Newsletter Admin, click "Campaigns" tab
2. Click "Generate with AI" button
3. ✅ Should show "Generating newsletter with AI..." toast
4. ✅ Wait 10-30 seconds for GPT-4 to generate content
5. ✅ New campaign should appear in the list
6. Click "Preview" icon to view the newsletter
7. ✅ Should show HTML-rendered newsletter

### Test 5: Send Test Email

1. In the campaign you just generated
2. Enter your email in the test email field
3. Click "Send Test"
4. ✅ Should receive newsletter email
5. ✅ Email should have tracking pixel and wrapped links

### Test 6: Newsletter Scheduler

1. Click "Monitor" tab in Newsletter Admin
2. ✅ Should see scheduler status (Running/Stopped)
3. ✅ Should see stats: Total Runs, Total Sent, Average Per Run
4. Click "Run Now" button
5. Confirm the dialog
6. ✅ Should generate and send newsletter to all active subscribers
7. ✅ Check your email for the newsletter

### Test 7: Subscriber Management

1. Click "Subscribers" tab
2. ✅ Should see list of all subscribers
3. Try the filters: All, Confirmed, Unsubscribed
4. Try the search by email
5. Click "Export CSV" button
6. ✅ Should download CSV file with subscriber data

### Test 8: Analytics

1. Click "Analytics" tab
2. ✅ Should see metrics: Total Subscribers, Active, Campaigns Sent, Avg Open Rate
3. ✅ Should see engagement rate bars
4. ✅ Should see recent campaigns list

### Test 9: Unsubscribe Flow

1. Open a newsletter email you received
2. Scroll to bottom and click "Unsubscribe" link
3. ✅ Should go to `http://localhost:5173/newsletter/unsubscribe?email=...&token=...`
4. Select a reason (optional)
5. Click "Unsubscribe"
6. ✅ Should see success message
7. Go back to Subscribers in admin
8. ✅ Your email should show "Unsubscribed" status

## 📊 Monitoring

### Check Scheduler Status

```bash
curl http://localhost:3000/api/newsletter/scheduler/status
```

### View Recent Campaigns

```bash
curl http://localhost:3000/api/newsletter/campaigns | json_pp
```

### View Subscribers

```bash
curl http://localhost:3000/api/newsletter/subscribers?limit=10 | json_pp
```

### View Analytics

```bash
curl http://localhost:3000/api/newsletter/analytics/overview | json_pp
```

## 🎯 Production Checklist

Before deploying to production:

- [ ] Verify Resend domain (for better deliverability)
  - Go to https://resend.com/domains
  - Add your domain
  - Add DNS records (SPF, DKIM, DMARC)
  - Verify domain

- [ ] Update environment variables for production:
  ```bash
  NEWSLETTER_FROM_EMAIL=newsletter@yourdomain.com
  FRONTEND_URL=https://yourdomain.com
  API_URL=https://api.yourdomain.com
  ```

- [ ] Test scheduler in production:
  - Set test schedule: `NEWSLETTER_SCHEDULE=*/5 * * * *` (every 5 min)
  - Monitor first few sends
  - Reset to production: `NEWSLETTER_SCHEDULE=0 9 * * 5` (Fridays 9am)

- [ ] Set up monitoring alerts:
  - Bounce rate > 5%
  - Unsubscribe rate > 0.5%
  - Scheduler downtime
  - Failed email sends

- [ ] Backup subscriber list weekly:
  ```bash
  curl http://localhost:3000/api/newsletter/subscribers/export > subscribers-backup-$(date +%Y%m%d).csv
  ```

## 🔧 Troubleshooting

### Emails not sending

1. Check API key is set: `echo $RESEND_API_KEY`
2. Check Resend dashboard for errors: https://resend.com/emails
3. Check server logs: `tail -f logs/newsletter.log`
4. Verify domain is verified in Resend (production only)

### Scheduler not running

1. Check scheduler status: `curl http://localhost:3000/api/newsletter/scheduler/status`
2. Check environment: `echo $ENABLE_NEWSLETTER_SCHEDULER` (should be "true")
3. Check server logs for errors
4. Restart server

### Database errors

1. Verify migration ran successfully
2. Check Supabase logs
3. Verify RLS policies allow service role access

### Email deliverability issues

1. Verify sender domain in Resend
2. Add SPF/DKIM/DMARC records
3. Monitor bounce rate
4. Check spam scores with mail-tester.com

## 📈 Success Metrics

**Week 1 Goals:**
- 10+ subscribers
- 1 newsletter sent
- 15%+ open rate

**Month 1 Goals:**
- 100+ subscribers
- 4 newsletters sent
- 20%+ open rate
- 2%+ click rate
- <0.5% unsubscribe rate

## 🎉 You're Done!

Your newsletter system is fully set up and ready to convert blog readers into engaged subscribers!

**Key Features:**
- ✅ AI-generated newsletters with GPT-4
- ✅ Automated weekly sending (Fridays 9am)
- ✅ Email tracking (opens, clicks, unsubscribes)
- ✅ A/B testing for subject lines
- ✅ Subscriber management
- ✅ Analytics dashboard
- ✅ 5 email capture placements
- ✅ Professional email templates

**Next Steps:**
1. Run database migration
2. Test email sending
3. Subscribe yourself and test full flow
4. Generate first AI newsletter
5. Schedule first automated send

Happy newsletter sending! 📬
