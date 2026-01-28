/**
 * Newsletter Scheduler
 * Automatically generates and sends weekly newsletters
 * Pattern: Follows dealScoringScheduler.js structure
 */

const cron = require('node-cron');
const newsletterQueries = require('../db/newsletterQueries');
const contentGenerator = require('../services/newsletter/contentGenerator');
const resendClient = require('../services/email/resendClient');
const emailTemplates = require('../services/email/emailTemplates');

class NewsletterScheduler {
  constructor(io) {
    this.io = io; // Socket.IO instance for real-time updates
    this.isRunning = false;
    this.job = null;

    this.stats = {
      totalRuns: 0,
      totalSent: 0,
      totalFailed: 0,
      lastRunStats: null
    };

    this.lastRun = null;
  }

  /**
   * Start newsletter scheduler
   * @param {string} schedule - Cron expression (default: Fridays 9am EST)
   */
  start(schedule = '0 9 * * 5') {
    if (this.isRunning) {
      console.log('⚠️  Newsletter scheduler already running');
      return;
    }

    if (!cron.validate(schedule)) {
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    console.log(`\n📧 Starting Newsletter Scheduler`);
    console.log(`   Schedule: ${schedule} (${this.cronToHuman(schedule)})`);

    this.job = cron.schedule(schedule, async () => {
      await this.runNewsletter();
    }, {
      timezone: "America/Chicago"
    });

    this.isRunning = true;
    console.log('✅ Newsletter scheduler started\n');

    // Emit Socket.IO event
    if (this.io) {
      this.io.emit('newsletter-scheduler-started', {
        schedule,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Stop newsletter scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️  Newsletter scheduler not running');
      return;
    }

    if (this.job) {
      this.job.stop();
      this.job = null;
    }

    this.isRunning = false;
    console.log('🛑 Newsletter scheduler stopped');

    // Emit Socket.IO event
    if (this.io) {
      this.io.emit('newsletter-scheduler-stopped', {
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Main newsletter workflow
   */
  async runNewsletter() {
    console.log('\n' + '='.repeat(60));
    console.log('📧 NEWSLETTER RUN STARTED');
    console.log('='.repeat(60));

    const startTime = Date.now();
    const runStats = {
      startTime: new Date().toISOString(),
      generated: false,
      campaignId: null,
      sent: 0,
      failed: 0,
      errors: [],
      duration: 0
    };

    try {
      // Step 1: Check if Resend is available
      if (!resendClient.isAvailable()) {
        throw new Error('Resend email client not available. Check RESEND_API_KEY.');
      }

      // Step 2: Generate newsletter content
      console.log('\n🤖 Step 1: Generating newsletter content...');
      const content = await contentGenerator.generateWeeklyNewsletter();

      runStats.generated = true;
      console.log('✅ Content generated successfully');
      console.log(`   Subject: ${content.subject_lines[0]}`);
      console.log(`   Deals featured: ${content.deals.length}`);

      // Step 3: Create campaign in database
      console.log('\n💾 Step 2: Creating campaign...');
      const { data: campaign, error: campaignError } = await newsletterQueries.createCampaign({
        name: `Weekly Newsletter - ${new Date().toLocaleDateString()}`,
        subject_line: content.subject_lines[0],
        subject_line_variant: content.subject_lines[1] || content.subject_lines[0],
        content_markdown: content.content_markdown,
        content_html: content.content_html,
        status: 'sending',
        campaign_type: 'weekly',
        ai_generated: true,
        ai_model: 'gpt-4-turbo-preview',
        send_started_at: new Date().toISOString(),
        ab_test_enabled: true
      });

      if (campaignError || !campaign) {
        throw new Error(`Failed to create campaign: ${campaignError?.message}`);
      }

      runStats.campaignId = campaign.id;
      console.log(`✅ Campaign created (ID: ${campaign.id})`);

      // Step 4: Get active subscribers
      console.log('\n👥 Step 3: Fetching subscribers...');
      const { data: subscribers, error: subscribersError } = await newsletterQueries.getActiveSubscribers();

      if (subscribersError) {
        throw new Error(`Failed to get subscribers: ${subscribersError.message}`);
      }

      const activeSubscribers = subscribers || [];
      console.log(`✅ Found ${activeSubscribers.length} active subscribers`);

      if (activeSubscribers.length === 0) {
        console.log('⚠️  No active subscribers. Marking campaign as sent.');
        await newsletterQueries.updateCampaign(campaign.id, {
          status: 'sent',
          total_recipients: 0,
          total_sent: 0,
          send_completed_at: new Date().toISOString()
        });
        runStats.sent = 0;
        return runStats;
      }

      // Update campaign with recipient count
      await newsletterQueries.updateCampaign(campaign.id, {
        total_recipients: activeSubscribers.length
      });

      // Step 5: Send emails in batches
      console.log('\n📬 Step 4: Sending emails...');
      const sendResults = await this.sendCampaign(campaign, activeSubscribers);

      runStats.sent = sendResults.sent;
      runStats.failed = sendResults.failed;
      runStats.errors = sendResults.errors;

      // Step 6: Update campaign status
      console.log('\n📊 Step 5: Updating campaign status...');
      await newsletterQueries.updateCampaign(campaign.id, {
        status: 'sent',
        total_sent: sendResults.sent,
        total_failed: sendResults.failed,
        send_completed_at: new Date().toISOString()
      });

      // Calculate duration
      const duration = Date.now() - startTime;
      runStats.duration = duration;

      // Update scheduler stats
      this.stats.totalRuns++;
      this.stats.totalSent += sendResults.sent;
      this.stats.totalFailed += sendResults.failed;
      this.stats.lastRunStats = runStats;
      this.lastRun = new Date().toISOString();

      // Log summary
      console.log('\n' + '='.repeat(60));
      console.log('✅ NEWSLETTER RUN COMPLETED');
      console.log('='.repeat(60));
      console.log(`   Sent: ${sendResults.sent}`);
      console.log(`   Failed: ${sendResults.failed}`);
      console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);
      console.log('='.repeat(60) + '\n');

      // Emit Socket.IO event
      if (this.io) {
        this.io.emit('newsletter-sent', {
          runStats,
          campaign: {
            id: campaign.id,
            name: campaign.name,
            subject_line: campaign.subject_line
          }
        });
      }

      return runStats;
    } catch (error) {
      console.error('\n❌ Newsletter run failed:', error.message);
      console.error(error.stack);

      runStats.errors.push(error.message);
      this.stats.totalFailed++;

      // Emit Socket.IO error event
      if (this.io) {
        this.io.emit('newsletter-error', {
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }

      throw error;
    }
  }

  /**
   * Send campaign to all subscribers
   * @param {Object} campaign - Campaign data
   * @param {Array} subscribers - Subscriber list
   * @returns {Promise<Object>} - { sent, failed, errors }
   */
  async sendCampaign(campaign, subscribers) {
    const batchSize = 100; // Resend limit
    const batchDelay = 2000; // 2 seconds between batches

    let sent = 0;
    let failed = 0;
    const errors = [];

    // Determine A/B split
    const abTestEnabled = campaign.ab_test_enabled !== false && subscribers.length >= 10;
    const splitIndex = Math.floor(subscribers.length / 2);

    // Process in batches
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(subscribers.length / batchSize);

      console.log(`   Batch ${batchNum}/${totalBatches}: Sending to ${batch.length} subscribers...`);

      // Send emails in parallel within batch
      const results = await Promise.allSettled(
        batch.map(async (subscriber, idx) => {
          try {
            // Check if already sent (prevent duplicates)
            const { data: existingSend } = await newsletterQueries.getSend(
              campaign.id,
              subscriber.id
            );

            if (existingSend && existingSend.status === 'sent') {
              console.log(`   ⏭️  Already sent to ${subscriber.email}, skipping`);
              return { success: true, skipped: true };
            }

            // Determine A/B variant
            const globalIdx = i + idx;
            const variant = abTestEnabled && globalIdx < splitIndex ? 'A' : 'B';
            const subjectLine = variant === 'A'
              ? campaign.subject_line
              : (campaign.subject_line_variant || campaign.subject_line);

            // Generate personalized email
            const emailData = emailTemplates.generateNewsletterEmail(
              { ...campaign, subject_line: subjectLine },
              subscriber
            );

            // Track links in HTML
            const trackedHtml = emailTemplates.trackLinks(emailData.html, campaign.id);

            // Send via Resend
            const result = await resendClient.sendEmail({
              to: subscriber.email,
              subject: emailData.subject,
              html: trackedHtml,
              text: emailData.text
            });

            if (result.success) {
              // Log successful send
              await newsletterQueries.logSend({
                campaign_id: campaign.id,
                subscriber_id: subscriber.id,
                personalized_subject: emailData.subject,
                ab_variant: variant,
                status: 'sent',
                sent_at: new Date().toISOString(),
                resend_email_id: result.emailId
              });

              // Update subscriber last_sent_at
              await newsletterQueries.updateSubscriber(subscriber.id, {
                last_sent_at: new Date().toISOString(),
                send_count: (subscriber.send_count || 0) + 1
              });

              return { success: true };
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            // Log failed send
            await newsletterQueries.logSend({
              campaign_id: campaign.id,
              subscriber_id: subscriber.id,
              status: 'failed',
              error_message: error.message
            }).catch(e => console.error('Failed to log error:', e));

            throw error;
          }
        })
      );

      // Count results
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          if (!result.value.skipped) {
            sent++;
          }
        } else {
          failed++;
          const subscriberEmail = batch[idx].email;
          errors.push(`${subscriberEmail}: ${result.reason.message}`);
          console.error(`   ❌ Failed: ${subscriberEmail} - ${result.reason.message}`);
        }
      });

      console.log(`   ✅ Batch ${batchNum} complete (Sent: ${sent}, Failed: ${failed})`);

      // Delay between batches (except for last batch)
      if (i + batchSize < subscribers.length) {
        console.log(`   ⏳ Waiting ${batchDelay / 1000}s before next batch...`);
        await this.sleep(batchDelay);
      }
    }

    return { sent, failed, errors };
  }

  /**
   * Get scheduler status
   * @returns {Object} - Status info
   */
  getStatus() {
    const nextRun = this.isRunning && this.lastRun
      ? this.getNextRun()
      : null;

    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      nextRun,
      stats: {
        ...this.stats,
        averagePerRun: this.stats.totalRuns > 0
          ? Math.round(this.stats.totalSent / this.stats.totalRuns)
          : 0
      }
    };
  }

  /**
   * Manual trigger (force run)
   * @returns {Promise<Object>} - Run stats
   */
  async forceRun() {
    console.log('⚡ Manual newsletter run triggered');
    return await this.runNewsletter();
  }

  /**
   * Get next scheduled run time
   * @returns {string|null} - ISO date string
   */
  getNextRun() {
    if (!this.lastRun) return null;

    // Assuming weekly schedule (Fridays 9am)
    const lastRunDate = new Date(this.lastRun);
    const nextRun = new Date(lastRunDate);
    nextRun.setDate(nextRun.getDate() + 7); // Add 7 days

    return nextRun.toISOString();
  }

  /**
   * Convert cron expression to human-readable string
   * @param {string} cron - Cron expression
   * @returns {string} - Human-readable description
   */
  cronToHuman(cron) {
    const parts = cron.split(' ');

    if (cron === '0 9 * * 5') {
      return 'Every Friday at 9:00 AM';
    }

    if (cron === '0 9 * * 1') {
      return 'Every Monday at 9:00 AM';
    }

    // Generic fallback
    return `Cron: ${cron}`;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = NewsletterScheduler;
