/**
 * Email Sequence Database Queries
 * All database operations for drip email sequences
 */

const supabase = require('./supabase');

class SequenceQueries {
  constructor() {
    this.supabase = supabase;
  }

  // ============================================================================
  // SEQUENCE OPERATIONS
  // ============================================================================

  /**
   * Create a new sequence
   */
  async createSequence(data) {
    const { name, description, trigger_event = 'signup', is_active = true } = data;

    return await this.supabase.query(async (client) => {
      return await client
        .from('email_sequences')
        .insert([{ name, description, trigger_event, is_active }])
        .select()
        .single();
    });
  }

  /**
   * Get sequence by ID
   */
  async getSequence(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('email_sequences')
        .select('*')
        .eq('id', id)
        .single();
    });
  }

  /**
   * Get all sequences
   */
  async getSequences(includeInactive = false) {
    return await this.supabase.query(async (client) => {
      let query = client
        .from('email_sequences')
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      return await query;
    });
  }

  /**
   * Get sequences by trigger event
   */
  async getSequencesByTrigger(trigger_event) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('email_sequences')
        .select('*')
        .eq('trigger_event', trigger_event)
        .eq('is_active', true);
    });
  }

  /**
   * Update sequence
   */
  async updateSequence(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('email_sequences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  /**
   * Delete sequence (cascades to emails and progress)
   */
  async deleteSequence(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('email_sequences')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // SEQUENCE EMAIL OPERATIONS
  // ============================================================================

  /**
   * Add email to sequence
   */
  async addSequenceEmail(data) {
    const {
      sequence_id,
      step_number,
      delay_days = 0,
      delay_hours = 0,
      subject,
      subject_variant,
      content_html,
      content_text,
      is_active = true
    } = data;

    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_emails')
        .insert([{
          sequence_id,
          step_number,
          delay_days,
          delay_hours,
          subject,
          subject_variant,
          content_html,
          content_text,
          is_active
        }])
        .select()
        .single();
    });
  }

  /**
   * Get all emails for a sequence
   */
  async getSequenceEmails(sequence_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_emails')
        .select('*')
        .eq('sequence_id', sequence_id)
        .eq('is_active', true)
        .order('step_number', { ascending: true });
    });
  }

  /**
   * Get specific email by sequence and step
   */
  async getSequenceEmail(sequence_id, step_number) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_emails')
        .select('*')
        .eq('sequence_id', sequence_id)
        .eq('step_number', step_number)
        .single();
    });
  }

  /**
   * Update sequence email
   */
  async updateSequenceEmail(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_emails')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  /**
   * Delete sequence email
   */
  async deleteSequenceEmail(id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_emails')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // SUBSCRIBER PROGRESS OPERATIONS
  // ============================================================================

  /**
   * Start a subscriber on a sequence
   */
  async startSubscriberSequence(subscriber_id, sequence_id) {
    // Calculate when first email should be sent
    const now = new Date();

    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .insert([{
          subscriber_id,
          sequence_id,
          current_step: 0,
          status: 'active',
          started_at: now.toISOString(),
          next_send_at: now.toISOString() // First email sends immediately
        }])
        .select()
        .single();
    });
  }

  /**
   * Get subscriber's progress in a sequence
   */
  async getSubscriberProgress(subscriber_id, sequence_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .select('*')
        .eq('subscriber_id', subscriber_id)
        .eq('sequence_id', sequence_id)
        .maybeSingle();
    });
  }

  /**
   * Get all active sequences for a subscriber
   */
  async getSubscriberActiveSequences(subscriber_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .select(`
          *,
          email_sequences (*)
        `)
        .eq('subscriber_id', subscriber_id)
        .eq('status', 'active');
    });
  }

  /**
   * Get all subscribers due for next email
   * Returns subscribers where next_send_at is in the past and status is active
   */
  async getDueSubscribers(limit = 100) {
    const now = new Date().toISOString();

    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .select(`
          *,
          email_sequences (*),
          blog_subscribers (*)
        `)
        .eq('status', 'active')
        .lte('next_send_at', now)
        .order('next_send_at', { ascending: true })
        .limit(limit);
    });
  }

  /**
   * Update subscriber progress after sending email
   */
  async updateProgress(id, updates) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    });
  }

  /**
   * Advance subscriber to next step
   */
  async advanceSubscriber(progress_id, next_step, next_send_at) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update({
          current_step: next_step,
          last_sent_at: new Date().toISOString(),
          next_send_at: next_send_at
        })
        .eq('id', progress_id)
        .select()
        .single();
    });
  }

  /**
   * Complete a subscriber's sequence
   */
  async completeSequence(progress_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          next_send_at: null
        })
        .eq('id', progress_id)
        .select()
        .single();
    });
  }

  /**
   * Pause a subscriber's sequence
   */
  async pauseSequence(progress_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update({
          status: 'paused'
        })
        .eq('id', progress_id)
        .select()
        .single();
    });
  }

  /**
   * Resume a subscriber's sequence
   */
  async resumeSequence(progress_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update({
          status: 'active',
          next_send_at: new Date().toISOString() // Send next email now
        })
        .eq('id', progress_id)
        .select()
        .single();
    });
  }

  /**
   * Cancel a subscriber's sequence
   */
  async cancelSequence(progress_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('subscriber_sequence_progress')
        .update({
          status: 'cancelled',
          next_send_at: null
        })
        .eq('id', progress_id)
        .select()
        .single();
    });
  }

  // ============================================================================
  // SEND LOG OPERATIONS
  // ============================================================================

  /**
   * Log a sequence email send
   */
  async logSend(data) {
    const {
      subscriber_id,
      sequence_id,
      sequence_email_id,
      step_number,
      status = 'sent',
      resend_email_id,
      error_message
    } = data;

    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_sends')
        .insert([{
          subscriber_id,
          sequence_id,
          sequence_email_id,
          step_number,
          status,
          resend_email_id,
          error_message
        }])
        .select()
        .single();
    });
  }

  /**
   * Get send history for subscriber in sequence
   */
  async getSubscriberSendHistory(subscriber_id, sequence_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_sends')
        .select('*')
        .eq('subscriber_id', subscriber_id)
        .eq('sequence_id', sequence_id)
        .order('sent_at', { ascending: true });
    });
  }

  /**
   * Track email open
   */
  async trackOpen(send_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_sends')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', send_id)
        .select()
        .single();
    });
  }

  /**
   * Track email click
   */
  async trackClick(send_id) {
    return await this.supabase.query(async (client) => {
      return await client
        .from('sequence_sends')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('id', send_id)
        .select()
        .single();
    });
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  /**
   * Get sequence analytics
   */
  async getSequenceAnalytics(sequence_id) {
    try {
      // Get total subscribers in sequence
      const { data: progress } = await this.supabase.query(async (client) => {
        return await client
          .from('subscriber_sequence_progress')
          .select('status, current_step')
          .eq('sequence_id', sequence_id);
      });

      const totalStarted = progress?.length || 0;
      const active = progress?.filter(p => p.status === 'active').length || 0;
      const completed = progress?.filter(p => p.status === 'completed').length || 0;
      const paused = progress?.filter(p => p.status === 'paused').length || 0;
      const cancelled = progress?.filter(p => p.status === 'cancelled').length || 0;

      // Get send stats
      const { data: sends } = await this.supabase.query(async (client) => {
        return await client
          .from('sequence_sends')
          .select('status, step_number')
          .eq('sequence_id', sequence_id);
      });

      const totalSent = sends?.length || 0;
      const totalOpened = sends?.filter(s => s.status === 'opened' || s.status === 'clicked').length || 0;
      const totalClicked = sends?.filter(s => s.status === 'clicked').length || 0;

      const openRate = totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(2) : 0;
      const clickRate = totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(2) : 0;
      const completionRate = totalStarted > 0 ? ((completed / totalStarted) * 100).toFixed(2) : 0;

      return {
        total_started: totalStarted,
        active,
        completed,
        paused,
        cancelled,
        total_sent: totalSent,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        open_rate: parseFloat(openRate),
        click_rate: parseFloat(clickRate),
        completion_rate: parseFloat(completionRate)
      };
    } catch (error) {
      console.error('Error getting sequence analytics:', error);
      return null;
    }
  }

  /**
   * Get per-email analytics for a sequence
   */
  async getEmailAnalytics(sequence_id) {
    try {
      const { data: emails } = await this.getSequenceEmails(sequence_id);
      const analytics = [];

      for (const email of emails || []) {
        const { data: sends } = await this.supabase.query(async (client) => {
          return await client
            .from('sequence_sends')
            .select('status')
            .eq('sequence_email_id', email.id);
        });

        const totalSent = sends?.length || 0;
        const opened = sends?.filter(s => s.status === 'opened' || s.status === 'clicked').length || 0;
        const clicked = sends?.filter(s => s.status === 'clicked').length || 0;

        analytics.push({
          step: email.step_number,
          subject: email.subject,
          sent: totalSent,
          opened,
          clicked,
          open_rate: totalSent > 0 ? ((opened / totalSent) * 100).toFixed(2) : 0,
          click_rate: totalSent > 0 ? ((clicked / totalSent) * 100).toFixed(2) : 0
        });
      }

      return analytics;
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new SequenceQueries();
