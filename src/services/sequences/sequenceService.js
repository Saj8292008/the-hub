/**
 * Email Sequence Service
 * Business logic for drip email sequences
 */

const sequenceQueries = require('../../db/sequenceQueries');
const resendClient = require('../email/resendClient');

class SequenceService {
  constructor() {
    this.queries = sequenceQueries;
  }

  // ============================================================================
  // SEQUENCE MANAGEMENT
  // ============================================================================

  /**
   * Get all sequences with stats
   */
  async getSequences(includeInactive = false) {
    const { data: sequences, error } = await this.queries.getSequences(includeInactive);

    if (error) {
      throw new Error(`Failed to get sequences: ${error.message}`);
    }

    // Add analytics to each sequence
    const enrichedSequences = await Promise.all(
      (sequences || []).map(async (seq) => {
        const analytics = await this.queries.getSequenceAnalytics(seq.id);
        const { data: emails } = await this.queries.getSequenceEmails(seq.id);
        return {
          ...seq,
          email_count: emails?.length || 0,
          analytics
        };
      })
    );

    return enrichedSequences;
  }

  /**
   * Get sequence with full details
   */
  async getSequence(id) {
    const { data: sequence, error } = await this.queries.getSequence(id);

    if (error) {
      throw new Error(`Sequence not found: ${error.message}`);
    }

    const { data: emails } = await this.queries.getSequenceEmails(id);
    const analytics = await this.queries.getSequenceAnalytics(id);
    const emailAnalytics = await this.queries.getEmailAnalytics(id);

    return {
      ...sequence,
      emails: emails || [],
      analytics,
      email_analytics: emailAnalytics
    };
  }

  /**
   * Create new sequence
   */
  async createSequence(data) {
    const { data: sequence, error } = await this.queries.createSequence(data);

    if (error) {
      throw new Error(`Failed to create sequence: ${error.message}`);
    }

    return sequence;
  }

  /**
   * Update sequence
   */
  async updateSequence(id, updates) {
    const { data: sequence, error } = await this.queries.updateSequence(id, updates);

    if (error) {
      throw new Error(`Failed to update sequence: ${error.message}`);
    }

    return sequence;
  }

  /**
   * Delete sequence
   */
  async deleteSequence(id) {
    const { error } = await this.queries.deleteSequence(id);

    if (error) {
      throw new Error(`Failed to delete sequence: ${error.message}`);
    }

    return true;
  }

  // ============================================================================
  // EMAIL MANAGEMENT
  // ============================================================================

  /**
   * Add email to sequence
   */
  async addEmail(sequenceId, emailData) {
    const data = {
      sequence_id: sequenceId,
      ...emailData
    };

    const { data: email, error } = await this.queries.addSequenceEmail(data);

    if (error) {
      throw new Error(`Failed to add email: ${error.message}`);
    }

    return email;
  }

  /**
   * Update sequence email
   */
  async updateEmail(emailId, updates) {
    const { data: email, error } = await this.queries.updateSequenceEmail(emailId, updates);

    if (error) {
      throw new Error(`Failed to update email: ${error.message}`);
    }

    return email;
  }

  /**
   * Delete sequence email
   */
  async deleteEmail(emailId) {
    const { error } = await this.queries.deleteSequenceEmail(emailId);

    if (error) {
      throw new Error(`Failed to delete email: ${error.message}`);
    }

    return true;
  }

  // ============================================================================
  // SUBSCRIBER ENROLLMENT
  // ============================================================================

  /**
   * Enroll subscriber in sequence(s) based on trigger event
   * Called when subscriber signs up or confirms
   */
  async enrollSubscriberByTrigger(subscriber, trigger_event) {
    console.log(`📧 Enrolling subscriber ${subscriber.email} for trigger: ${trigger_event}`);

    // Get all active sequences for this trigger
    const { data: sequences } = await this.queries.getSequencesByTrigger(trigger_event);

    if (!sequences || sequences.length === 0) {
      console.log(`   No sequences found for trigger: ${trigger_event}`);
      return [];
    }

    const enrolled = [];

    for (const sequence of sequences) {
      try {
        // Check if already enrolled
        const { data: existing } = await this.queries.getSubscriberProgress(
          subscriber.id,
          sequence.id
        );

        if (existing) {
          console.log(`   Already enrolled in: ${sequence.name}`);
          continue;
        }

        // Enroll in sequence
        const { data: progress, error } = await this.queries.startSubscriberSequence(
          subscriber.id,
          sequence.id
        );

        if (error) {
          console.error(`   Failed to enroll in ${sequence.name}:`, error);
          continue;
        }

        console.log(`   ✅ Enrolled in: ${sequence.name}`);
        enrolled.push({ sequence, progress });
      } catch (err) {
        console.error(`   Error enrolling in ${sequence.name}:`, err);
      }
    }

    return enrolled;
  }

  /**
   * Manually enroll subscriber in specific sequence
   */
  async enrollSubscriber(subscriberId, sequenceId) {
    // Check if already enrolled
    const { data: existing } = await this.queries.getSubscriberProgress(subscriberId, sequenceId);

    if (existing) {
      if (existing.status === 'active') {
        throw new Error('Subscriber already active in this sequence');
      }

      // Re-enroll if previously completed/cancelled
      const { data: progress } = await this.queries.updateProgress(existing.id, {
        status: 'active',
        current_step: 0,
        started_at: new Date().toISOString(),
        next_send_at: new Date().toISOString(),
        completed_at: null
      });

      return progress;
    }

    const { data: progress, error } = await this.queries.startSubscriberSequence(
      subscriberId,
      sequenceId
    );

    if (error) {
      throw new Error(`Failed to enroll subscriber: ${error.message}`);
    }

    return progress;
  }

  // ============================================================================
  // SEQUENCE PROCESSING (Called by scheduler)
  // ============================================================================

  /**
   * Process all due sequence emails
   * This is the main method called by the scheduler
   */
  async processDueEmails() {
    console.log('\n📧 Processing due sequence emails...');

    const { data: dueSubscribers, error } = await this.queries.getDueSubscribers(100);

    if (error) {
      console.error('Failed to get due subscribers:', error);
      return { processed: 0, errors: [] };
    }

    if (!dueSubscribers || dueSubscribers.length === 0) {
      console.log('   No emails due');
      return { processed: 0, errors: [] };
    }

    console.log(`   Found ${dueSubscribers.length} subscribers with due emails`);

    let processed = 0;
    const errors = [];

    for (const progress of dueSubscribers) {
      try {
        await this.sendNextEmail(progress);
        processed++;
      } catch (err) {
        console.error(`   Error processing subscriber ${progress.subscriber_id}:`, err.message);
        errors.push({
          subscriber_id: progress.subscriber_id,
          sequence_id: progress.sequence_id,
          error: err.message
        });
      }

      // Small delay between sends to avoid rate limiting
      await this.sleep(500);
    }

    console.log(`   ✅ Processed ${processed} emails, ${errors.length} errors`);
    return { processed, errors };
  }

  /**
   * Send the next email in sequence for a subscriber
   */
  async sendNextEmail(progress) {
    const subscriber = progress.blog_subscribers;
    const sequence = progress.email_sequences;

    // Skip if subscriber unsubscribed or not confirmed
    if (subscriber.unsubscribed) {
      console.log(`   Skipping ${subscriber.email} - unsubscribed`);
      await this.queries.cancelSequence(progress.id);
      return;
    }

    if (!subscriber.confirmed) {
      console.log(`   Skipping ${subscriber.email} - not confirmed`);
      return;
    }

    // Get the next email to send
    const nextStep = progress.current_step + 1;
    const { data: email, error } = await this.queries.getSequenceEmail(sequence.id, nextStep);

    if (error || !email) {
      // No more emails - sequence complete
      console.log(`   ✅ Sequence complete for ${subscriber.email}`);
      await this.queries.completeSequence(progress.id);
      return;
    }

    // Send the email
    console.log(`   Sending step ${nextStep} to ${subscriber.email}: "${email.subject}"`);

    // Add unsubscribe link to HTML
    const htmlWithUnsubscribe = this.addUnsubscribeLink(
      email.content_html,
      subscriber.email,
      subscriber.unsubscribe_token
    );

    const result = await resendClient.sendEmail({
      to: subscriber.email,
      subject: email.subject,
      html: htmlWithUnsubscribe,
      text: email.content_text
    });

    // Log the send
    await this.queries.logSend({
      subscriber_id: subscriber.id,
      sequence_id: sequence.id,
      sequence_email_id: email.id,
      step_number: nextStep,
      status: result.success ? 'sent' : 'failed',
      resend_email_id: result.emailId,
      error_message: result.error
    });

    if (!result.success) {
      throw new Error(`Failed to send: ${result.error}`);
    }

    // Calculate next send time
    const { data: nextEmail } = await this.queries.getSequenceEmail(sequence.id, nextStep + 1);

    if (nextEmail) {
      // There's another email - calculate when to send it
      const nextSendAt = this.calculateNextSendTime(nextEmail.delay_days, nextEmail.delay_hours);
      await this.queries.advanceSubscriber(progress.id, nextStep, nextSendAt.toISOString());
    } else {
      // No more emails - complete the sequence
      await this.queries.completeSequence(progress.id);
      console.log(`   ✅ Sequence complete for ${subscriber.email}`);
    }
  }

  /**
   * Calculate next send time based on delay
   */
  calculateNextSendTime(delayDays, delayHours) {
    const now = new Date();
    now.setDate(now.getDate() + delayDays);
    now.setHours(now.getHours() + delayHours);
    return now;
  }

  /**
   * Add unsubscribe link to email HTML
   */
  addUnsubscribeLink(html, email, token) {
    const unsubscribeUrl = `${process.env.FRONTEND_URL || 'https://thehub.deals'}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;

    const unsubscribeHtml = `
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
        <p>You're receiving this because you signed up for The Hub newsletter.</p>
        <p><a href="${unsubscribeUrl}" style="color: #666;">Unsubscribe</a></p>
      </div>
    `;

    // If html has closing body tag, insert before it
    if (html.includes('</body>')) {
      return html.replace('</body>', `${unsubscribeHtml}</body>`);
    }

    // Otherwise append
    return html + unsubscribeHtml;
  }

  /**
   * Get subscriber's status in all sequences
   */
  async getSubscriberSequenceStatus(subscriberId) {
    const { data: progress } = await this.queries.getSubscriberActiveSequences(subscriberId);

    return progress || [];
  }

  /**
   * Pause subscriber's sequence
   */
  async pauseSubscriberSequence(progressId) {
    const { data, error } = await this.queries.pauseSequence(progressId);
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Resume subscriber's sequence
   */
  async resumeSubscriberSequence(progressId) {
    const { data, error } = await this.queries.resumeSequence(progressId);
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Cancel subscriber's sequence
   */
  async cancelSubscriberSequence(progressId) {
    const { data, error } = await this.queries.cancelSequence(progressId);
    if (error) throw new Error(error.message);
    return data;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new SequenceService();
