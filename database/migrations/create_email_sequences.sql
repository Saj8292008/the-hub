-- Email Sequences Migration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- EMAIL SEQUENCES TABLE
-- Defines a sequence (e.g., "Welcome Sequence", "Onboarding Sequence")
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_event VARCHAR(100) NOT NULL DEFAULT 'signup', -- 'signup', 'confirmation', 'manual'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEQUENCE EMAILS TABLE
-- Individual emails within a sequence
-- ============================================================================
CREATE TABLE IF NOT EXISTS sequence_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  delay_days INTEGER NOT NULL DEFAULT 0, -- Days after previous email (or signup for step 1)
  delay_hours INTEGER NOT NULL DEFAULT 0, -- Additional hours (for same-day sends)
  subject VARCHAR(500) NOT NULL,
  subject_variant VARCHAR(500), -- For A/B testing
  content_html TEXT NOT NULL,
  content_text TEXT, -- Plain text version
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(sequence_id, step_number)
);

-- ============================================================================
-- SUBSCRIBER SEQUENCE PROGRESS TABLE
-- Tracks where each subscriber is in each sequence
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriber_sequence_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0, -- 0 = not started, 1+ = completed that step
  status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ, -- Pre-calculated next send time
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subscriber_id, sequence_id)
);

-- ============================================================================
-- SEQUENCE SEND LOG TABLE
-- Records each email sent from a sequence
-- ============================================================================
CREATE TABLE IF NOT EXISTS sequence_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id UUID NOT NULL REFERENCES blog_subscribers(id) ON DELETE CASCADE,
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  sequence_email_id UUID NOT NULL REFERENCES sequence_emails(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'opened', 'clicked'
  resend_email_id VARCHAR(255), -- ID from Resend
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_sequence_emails_sequence ON sequence_emails(sequence_id, step_number);
CREATE INDEX IF NOT EXISTS idx_progress_subscriber ON subscriber_sequence_progress(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_progress_sequence ON subscriber_sequence_progress(sequence_id);
CREATE INDEX IF NOT EXISTS idx_progress_status ON subscriber_sequence_progress(status);
CREATE INDEX IF NOT EXISTS idx_progress_next_send ON subscriber_sequence_progress(next_send_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sends_subscriber ON sequence_sends(subscriber_id);
CREATE INDEX IF NOT EXISTS idx_sends_sequence ON sequence_sends(sequence_id);

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_sequences_updated ON email_sequences;
CREATE TRIGGER email_sequences_updated
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS sequence_emails_updated ON sequence_emails;
CREATE TRIGGER sequence_emails_updated
  BEFORE UPDATE ON sequence_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subscriber_sequence_progress_updated ON subscriber_sequence_progress;
CREATE TRIGGER subscriber_sequence_progress_updated
  BEFORE UPDATE ON subscriber_sequence_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- RLS POLICIES (if using Row Level Security)
-- ============================================================================
-- Enable RLS
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_sequence_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_sends ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to email_sequences"
  ON email_sequences FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to sequence_emails"
  ON sequence_emails FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to subscriber_sequence_progress"
  ON subscriber_sequence_progress FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to sequence_sends"
  ON sequence_sends FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SEED: Welcome Sequence
-- ============================================================================
INSERT INTO email_sequences (id, name, description, trigger_event, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Welcome Sequence',
  '7-email welcome sequence for new newsletter subscribers',
  'signup',
  true
) ON CONFLICT DO NOTHING;

-- Insert the 7 welcome emails
INSERT INTO sequence_emails (sequence_id, step_number, delay_days, delay_hours, subject, content_html, content_text) VALUES
-- Email 1: Immediate (0 days)
('a0000000-0000-0000-0000-000000000001', 1, 0, 0, 
 'You''re in. Here''s what you missed this week.',
 '<p>Welcome to The Hub.</p>
<p>While you were signing up, here''s what our members caught:</p>
<p>🔥 Rolex Submariner - $2,400 under retail (sold in 4 min)<br>
👟 Travis Scott Jordan 1 Low - $89 below StockX (42 pairs available)<br>
🚗 2019 GT3 Touring - $38K under market (dealer didn''t know)</p>
<p>This is what we do. Every day.</p>
<p><strong>One place. Every deal. No noise.</strong></p>
<p>Reply with what you''re hunting - watches, sneakers, or cars - and I''ll make sure you see the right alerts.</p>
<p>— The Hub</p>',
 'Welcome to The Hub.

While you were signing up, here''s what our members caught:

🔥 Rolex Submariner - $2,400 under retail (sold in 4 min)
👟 Travis Scott Jordan 1 Low - $89 below StockX (42 pairs available)
🚗 2019 GT3 Touring - $38K under market (dealer didn''t know)

This is what we do. Every day.

One place. Every deal. No noise.

Reply with what you''re hunting - watches, sneakers, or cars - and I''ll make sure you see the right alerts.

— The Hub'),

-- Email 2: Day 1
('a0000000-0000-0000-0000-000000000001', 2, 1, 0,
 'Why you keep missing deals',
 '<p>Here''s the math that''s costing you money:</p>
<p>The average reseller checks 12+ sources daily:</p>
<ul>
<li>eBay, Chrono24, StockX, GOAT, Facebook groups, Discord servers, Reddit, dealer sites, auction houses...</li>
</ul>
<p>That''s 2-3 hours. Every. Single. Day.</p>
<p>And you''re STILL missing the best deals because:</p>
<p>→ You checked Chrono24 at 9am<br>
→ The Submariner posted at 8:47am<br>
→ Sold by 8:52am</p>
<p>The Hub watches everything. 24/7.<br>
We alert you in seconds, not hours.</p>
<p><strong>Time you get back:</strong> 2-3 hours/day<br>
<strong>Deals you stop missing:</strong> All of them</p>
<p>That''s the pitch. Stick around and I''ll show you exactly how it works.</p>
<p>— The Hub</p>',
 'Here''s the math that''s costing you money:

The average reseller checks 12+ sources daily:
- eBay, Chrono24, StockX, GOAT, Facebook groups, Discord servers, Reddit, dealer sites, auction houses...

That''s 2-3 hours. Every. Single. Day.

And you''re STILL missing the best deals because:
→ You checked Chrono24 at 9am
→ The Submariner posted at 8:47am
→ Sold by 8:52am

The Hub watches everything. 24/7.
We alert you in seconds, not hours.

Time you get back: 2-3 hours/day
Deals you stop missing: All of them

That''s the pitch. Stick around and I''ll show you exactly how it works.

— The Hub'),

-- Email 3: Day 2
('a0000000-0000-0000-0000-000000000001', 3, 2, 0,
 'The 60-second setup that changes everything',
 '<p>Here''s exactly how The Hub works:</p>
<p><strong>Step 1:</strong> Pick your categories<br>
Sneakers? Watches? Cars? All three? You decide.</p>
<p><strong>Step 2:</strong> Set your alerts<br>
"Rolex under $8K" or "Jordan 1 under retail" — get specific.</p>
<p><strong>Step 3:</strong> Get pinged<br>
Telegram. Email. SMS. However you want it.</p>
<p><strong>Step 4:</strong> Buy before everyone else</p>
<p>That''s it. No courses. No Discord drama. No "GM" posts.</p>
<p>Just deals, delivered.</p>
<p><a href="https://thehub.deals">→ Set up your first alert</a></p>
<p>— The Hub</p>',
 'Here''s exactly how The Hub works:

Step 1: Pick your categories
Sneakers? Watches? Cars? All three? You decide.

Step 2: Set your alerts
"Rolex under $8K" or "Jordan 1 under retail" — get specific.

Step 3: Get pinged
Telegram. Email. SMS. However you want it.

Step 4: Buy before everyone else

That''s it. No courses. No Discord drama. No "GM" posts.

Just deals, delivered.

→ Set up your first alert: https://thehub.deals

— The Hub'),

-- Email 4: Day 4
('a0000000-0000-0000-0000-000000000001', 4, 4, 0,
 'He made $4,200 on one alert',
 '<p>Last Tuesday at 6:43am, The Hub pinged Marcus in Atlanta.</p>
<p>A dealer in Ohio listed a 2022 Porsche 992 GT3.<br>
Price: $189,000<br>
Market value: $215,000+</p>
<p>Marcus called. Put down a deposit. Flew out Thursday.</p>
<p><strong>Profit after fees: ~$22,000</strong></p>
<p>His words: "I was still in bed when the alert hit. By the time most people saw it, I already had the title."</p>
<p>This isn''t luck. This is information advantage.</p>
<p>The same alerts go to every Hub member.<br>
The ones who act fast, win.</p>
<p><a href="https://thehub.deals">→ Ready to catch your first one?</a></p>
<p>— The Hub</p>',
 'Last Tuesday at 6:43am, The Hub pinged Marcus in Atlanta.

A dealer in Ohio listed a 2022 Porsche 992 GT3.
Price: $189,000
Market value: $215,000+

Marcus called. Put down a deposit. Flew out Thursday.

Profit after fees: ~$22,000

His words: "I was still in bed when the alert hit. By the time most people saw it, I already had the title."

This isn''t luck. This is information advantage.

The same alerts go to every Hub member.
The ones who act fast, win.

→ Ready to catch your first one? https://thehub.deals

— The Hub'),

-- Email 5: Day 6
('a0000000-0000-0000-0000-000000000001', 5, 6, 0,
 '"I already use [other tool]..."',
 '<p>I hear this a lot:</p>
<p><em>"I already use StockX / WatchCharts / Slickdeals"</em></p>
<p>Cool. So do we. We pull from them.</p>
<p>The difference:</p>
<p><strong>StockX</strong> = marketplace (you buy at their price)<br>
<strong>WatchCharts</strong> = data (tells you what things are worth)<br>
<strong>Slickdeals</strong> = consumer deals (TVs, not Rolexes)</p>
<p><strong>The Hub</strong> = aggregator + alerts (finds underpriced items across ALL sources and pings you before they sell)</p>
<p>We''re not replacing your tools. We''re the layer on top that makes them useful.</p>
<p>One dashboard. Real-time alerts. Reseller-grade deals.</p>
<p><a href="https://thehub.deals">→ See the difference yourself</a></p>
<p>— The Hub</p>',
 'I hear this a lot:

"I already use StockX / WatchCharts / Slickdeals"

Cool. So do we. We pull from them.

The difference:

StockX = marketplace (you buy at their price)
WatchCharts = data (tells you what things are worth)
Slickdeals = consumer deals (TVs, not Rolexes)

The Hub = aggregator + alerts (finds underpriced items across ALL sources and pings you before they sell)

We''re not replacing your tools. We''re the layer on top that makes them useful.

One dashboard. Real-time alerts. Reseller-grade deals.

→ See the difference yourself: https://thehub.deals

— The Hub'),

-- Email 6: Day 8
('a0000000-0000-0000-0000-000000000001', 6, 8, 0,
 'The deal that got away',
 '<p>Quick story.</p>
<p>Last month, a member emailed me frustrated.</p>
<p>He''d been "thinking about" setting up alerts for 2 weeks.<br>
During those 2 weeks, The Hub surfaced:</p>
<ul>
<li>3 Submariners under $9K</li>
<li>7 pairs of Travis Scott dunks under $200</li>
<li>1 GT4 RS at MSRP (dealer allocation)</li>
</ul>
<p>All sold. All gone. All while he was "thinking about it."</p>
<p>His email: <em>"I need to stop waiting."</em></p>
<p>Look — I''m not here to pressure you. The Hub will be here tomorrow.</p>
<p><strong>But the deals won''t.</strong></p>
<p><a href="https://thehub.deals">→ Stop thinking, start catching</a></p>
<p>— The Hub</p>',
 'Quick story.

Last month, a member emailed me frustrated.

He''d been "thinking about" setting up alerts for 2 weeks.
During those 2 weeks, The Hub surfaced:

- 3 Submariners under $9K
- 7 pairs of Travis Scott dunks under $200
- 1 GT4 RS at MSRP (dealer allocation)

All sold. All gone. All while he was "thinking about it."

His email: "I need to stop waiting."

Look — I''m not here to pressure you. The Hub will be here tomorrow.

But the deals won''t.

→ Stop thinking, start catching: https://thehub.deals

— The Hub'),

-- Email 7: Day 10
('a0000000-0000-0000-0000-000000000001', 7, 10, 0,
 'Last one from me (for now)',
 '<p>This is my last "welcome" email.</p>
<p>Here''s where we stand:</p>
<p>You signed up because you''re tired of missing deals.<br>
I''ve shown you what The Hub does and why it works.</p>
<p>Now it''s on you.</p>
<p><strong>Option A:</strong> Keep doing what you''re doing<br>
(Manually checking 12 sources, missing deals, wasting hours)</p>
<p><strong>Option B:</strong> Let The Hub do the work<br>
(Automated alerts, faster than anyone, more deals caught)</p>
<p>No signup calls. No enterprise sales pitch.<br>
Just a tool that works.</p>
<p><a href="https://thehub.deals">→ Get started with The Hub</a></p>
<p>If it''s not for you, no hard feelings. You''ll still get our weekly newsletter with the best deals we found.</p>
<p>But if you''re serious about this game?</p>
<p><strong>Stop spectating. Start catching.</strong></p>
<p>— The Hub</p>
<p><em>P.S. Reply to this email anytime. I read everything.</em></p>',
 'This is my last "welcome" email.

Here''s where we stand:

You signed up because you''re tired of missing deals.
I''ve shown you what The Hub does and why it works.

Now it''s on you.

Option A: Keep doing what you''re doing
(Manually checking 12 sources, missing deals, wasting hours)

Option B: Let The Hub do the work
(Automated alerts, faster than anyone, more deals caught)

No signup calls. No enterprise sales pitch.
Just a tool that works.

→ Get started with The Hub: https://thehub.deals

If it''s not for you, no hard feelings. You''ll still get our weekly newsletter with the best deals we found.

But if you''re serious about this game?

Stop spectating. Start catching.

— The Hub

P.S. Reply to this email anytime. I read everything.')

ON CONFLICT DO NOTHING;

-- Done!
SELECT 'Email sequences tables created successfully!' as status;
