/**
 * Resend Email Client
 * Wrapper for Resend API with error handling and batch sending support
 */

const { Resend } = require('resend');
require('dotenv').config();

class ResendClient {
  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;

    if (!this.apiKey || this.apiKey === 'your_resend_api_key_here') {
      console.warn('⚠️  RESEND_API_KEY not configured. Email sending disabled.');
      console.warn('   Get your API key from: https://resend.com');
      this.client = null;
      return;
    }

    try {
      this.client = new Resend(this.apiKey);
      this.fromEmail = process.env.NEWSLETTER_FROM_EMAIL || 'newsletter@thehub.com';
      this.fromName = process.env.NEWSLETTER_FROM_NAME || 'The Hub';
      console.log('✅ Resend client initialized');
      console.log(`   From: ${this.fromName} <${this.fromEmail}>`);
    } catch (error) {
      console.warn(`❌ Resend client init failed: ${error.message}`);
      this.client = null;
    }
  }

  /**
   * Check if Resend is available
   */
  isAvailable() {
    return this.client !== null;
  }

  /**
   * Send single email
   * @param {Object} options - Email options
   * @param {string|string[]} options.to - Recipient email(s)
   * @param {string} options.subject - Email subject
   * @param {string} options.html - HTML content
   * @param {string} [options.text] - Plain text content (optional)
   * @param {string} [options.replyTo] - Reply-to address (optional)
   * @param {Object} [options.headers] - Custom headers (optional)
   * @returns {Promise<Object>} - { success, emailId, data, error }
   */
  async sendEmail({ to, subject, html, text, replyTo, headers }) {
    if (!this.isAvailable()) {
      throw new Error('Resend client not available. Check RESEND_API_KEY.');
    }

    if (!to || !subject || !html) {
      throw new Error('Missing required fields: to, subject, html');
    }

    try {
      console.log(`📧 Sending email to ${Array.isArray(to) ? to.join(', ') : to}`);

      const response = await this.client.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text: text || this.htmlToText(html),
        reply_to: replyTo || this.fromEmail,
        headers: headers || {}
      });

      console.log(`✅ Email sent successfully. ID: ${response.id || response.data?.id}`);

      return {
        success: true,
        emailId: response.id || response.data?.id,
        data: response
      };
    } catch (error) {
      console.error('❌ Resend send error:', error.message);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Send batch of emails
   * Note: Resend supports batch.send() for up to 100 emails
   * @param {Array<Object>} emails - Array of email objects
   * @returns {Promise<Object>} - { success, results, errors }
   */
  async sendBatch(emails) {
    if (!this.isAvailable()) {
      throw new Error('Resend client not available. Check RESEND_API_KEY.');
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      throw new Error('emails must be a non-empty array');
    }

    if (emails.length > 100) {
      console.warn(`⚠️  Batch size ${emails.length} exceeds Resend limit (100). Splitting into chunks.`);
      return await this.sendBatchChunked(emails, 100);
    }

    try {
      console.log(`📧 Sending batch of ${emails.length} emails...`);

      // Format emails for Resend batch API
      const formattedEmails = emails.map(email => ({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: Array.isArray(email.to) ? email.to : [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text || this.htmlToText(email.html),
        reply_to: email.replyTo || this.fromEmail,
        headers: email.headers || {}
      }));

      const response = await this.client.batch.send(formattedEmails);

      console.log(`✅ Batch sent successfully`);

      return {
        success: true,
        results: response.data || response,
        count: emails.length
      };
    } catch (error) {
      console.error('❌ Batch send error:', error.message);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
  }

  /**
   * Send batch in chunks (for batches > 100 emails)
   * @param {Array<Object>} emails - Array of email objects
   * @param {number} chunkSize - Size of each chunk (default 100)
   * @returns {Promise<Object>} - { success, results, errors }
   */
  async sendBatchChunked(emails, chunkSize = 100) {
    const chunks = [];
    for (let i = 0; i < emails.length; i += chunkSize) {
      chunks.push(emails.slice(i, i + chunkSize));
    }

    console.log(`📧 Sending ${emails.length} emails in ${chunks.length} chunks...`);

    const results = [];
    const errors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   Processing chunk ${i + 1}/${chunks.length} (${chunk.length} emails)...`);

      const result = await this.sendBatch(chunk);

      if (result.success) {
        results.push(...(result.results || []));
      } else {
        errors.push({ chunk: i + 1, error: result.error });
      }

      // Delay between chunks to avoid rate limiting (2 seconds)
      if (i < chunks.length - 1) {
        await this.sleep(2000);
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors,
      totalSent: results.length,
      totalFailed: errors.length
    };
  }

  /**
   * Get email status from Resend
   * @param {string} emailId - Email ID from Resend
   * @returns {Promise<Object>} - Email status
   */
  async getEmailStatus(emailId) {
    if (!this.isAvailable()) {
      throw new Error('Resend client not available');
    }

    try {
      const response = await this.client.emails.get(emailId);
      return {
        success: true,
        data: response
      };
    } catch (error) {
      console.error('Get email status error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert HTML to plain text (simple version)
   * @param {string} html - HTML content
   * @returns {string} - Plain text
   */
  htmlToText(html) {
    if (!html) return '';

    return html
      // Remove style and script tags with their content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      // Clean up whitespace
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Test connection and send a test email
   * @param {string} to - Test recipient email
   * @returns {Promise<Object>} - Test result
   */
  async sendTestEmail(to) {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'Resend client not available'
      };
    }

    try {
      const result = await this.sendEmail({
        to,
        subject: 'Test Email from The Hub',
        html: `
          <h1>Test Email</h1>
          <p>This is a test email from The Hub newsletter system.</p>
          <p>If you received this, Resend is configured correctly!</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        `
      });

      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new ResendClient();
