/**
 * Email Templates Generator
 * Creates HTML emails for newsletters, confirmations, and welcome messages
 * Uses The Hub's dark theme brand styling
 */

const marked = require('marked');

class EmailTemplates {
  constructor() {
    this.brandColor = '#9333ea'; // Purple-600
    this.backgroundColor = '#0f172a'; // Slate-950
    this.cardBackground = '#1e293b'; // Slate-800
  }

  /**
   * Generate confirmation email (double opt-in)
   * @param {Object} subscriber - Subscriber data
   * @returns {Object} - { subject, html, text }
   */
  generateConfirmationEmail(subscriber) {
    const { email, name, confirmation_token } = subscriber;
    const firstName = this.getFirstName(name);
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/newsletter/confirm?token=${confirmation_token}`;

    const html = this.wrapInLayout(`
      <h1 style="color: white; font-size: 28px; margin: 0 0 16px 0;">Welcome to The Hub Newsletter! 👋</h1>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${firstName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Thanks for subscribing to The Hub newsletter! To complete your subscription and start receiving weekly deal alerts, market insights, and exclusive content, please confirm your email address by clicking the button below:
      </p>
      <p style="text-align: center; margin: 32px 0;">
        <a href="${confirmUrl}"
           style="background: ${this.brandColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          Confirm My Subscription
        </a>
      </p>
      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0;">
        Or copy and paste this link into your browser:<br/>
        <a href="${confirmUrl}" style="color: ${this.brandColor}; text-decoration: underline; word-break: break-all;">${confirmUrl}</a>
      </p>
      <div style="background: #334155; border-left: 4px solid ${this.brandColor}; padding: 16px; margin: 32px 0; border-radius: 4px;">
        <p style="color: #e2e8f0; font-size: 14px; margin: 0;">
          <strong>What to Expect:</strong><br/>
          📬 Weekly newsletters every Friday at 9am EST<br/>
          🔥 Top 5 deals across watches, cars, sneakers & sports<br/>
          📊 Market insights and price trend analysis<br/>
          📝 Featured articles and buying guides
        </p>
      </div>
    `);

    return {
      subject: '📬 Confirm your newsletter subscription',
      html,
      text: `Welcome to The Hub Newsletter!\n\nConfirm your subscription: ${confirmUrl}\n\nWhat to expect:\n- Weekly newsletters every Friday at 9am EST\n- Top 5 deals across watches, cars, sneakers & sports\n- Market insights and price trends\n- Featured articles and guides`
    };
  }

  /**
   * Generate welcome email (after confirmation)
   * @param {Object} subscriber - Subscriber data
   * @returns {Object} - { subject, html, text }
   */
  generateWelcomeEmail(subscriber) {
    const { name } = subscriber;
    const firstName = this.getFirstName(name);
    const blogUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/blog`;

    const html = this.wrapInLayout(`
      <h1 style="color: white; font-size: 28px; margin: 0 0 16px 0;">You're In! 🎉</h1>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${firstName},
      </p>
      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Your email is confirmed! Welcome to The Hub community of smart shoppers and market enthusiasts.
      </p>

      <h2 style="color: white; font-size: 22px; margin: 32px 0 16px 0;">What You'll Get:</h2>
      <table cellpadding="0" cellspacing="0" border="0" style="width: 100%; margin: 0 0 24px 0;">
        <tr>
          <td style="padding: 16px 0;">
            <div style="font-size: 32px; margin-bottom: 8px;">🔥</div>
            <strong style="color: white; font-size: 16px;">Hot Deals</strong><br/>
            <span style="color: #94a3b8; font-size: 14px;">Top 5 deals every week with our AI deal scoring</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-top: 1px solid #334155;">
            <div style="font-size: 32px; margin-bottom: 8px;">📊</div>
            <strong style="color: white; font-size: 16px;">Market Insights</strong><br/>
            <span style="color: #94a3b8; font-size: 14px;">Price trends, market analysis, and data-driven recommendations</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-top: 1px solid #334155;">
            <div style="font-size: 32px; margin-bottom: 8px;">📝</div>
            <strong style="color: white; font-size: 16px;">Featured Content</strong><br/>
            <span style="color: #94a3b8; font-size: 14px;">Expert guides, authentication tips, and investment strategies</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-top: 1px solid #334155;">
            <div style="font-size: 32px; margin-bottom: 8px;">🚀</div>
            <strong style="color: white; font-size: 16px;">Product Updates</strong><br/>
            <span style="color: #94a3b8; font-size: 14px;">New features, platform improvements, and exclusive previews</span>
          </td>
        </tr>
      </table>

      <p style="color: #e2e8f0; font-size: 16px; line-height: 1.6; margin: 24px 0;">
        <strong>Your first newsletter arrives this Friday at 9am EST!</strong>
      </p>

      <p style="text-align: center; margin: 32px 0;">
        <a href="${blogUrl}"
           style="background: ${this.brandColor}; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          Explore Our Blog
        </a>
      </p>

      <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 32px 0 0 0; text-align: center;">
        Have questions? Just reply to this email – we'd love to hear from you!
      </p>
    `, subscriber);

    return {
      subject: '🎉 Welcome to The Hub Newsletter!',
      html,
      text: `You're In!\n\nYour email is confirmed! Welcome to The Hub community.\n\nWhat you'll get:\n- 🔥 Hot Deals: Top 5 deals every week\n- 📊 Market Insights: Price trends and analysis\n- 📝 Featured Content: Expert guides and tips\n- 🚀 Product Updates: New features and improvements\n\nYour first newsletter arrives this Friday at 9am EST!\n\nExplore our blog: ${blogUrl}`
    };
  }

  /**
   * Generate weekly newsletter email
   * @param {Object} campaign - Campaign data
   * @param {Object} subscriber - Subscriber data
   * @returns {Object} - { subject, html, text }
   */
  generateNewsletterEmail(campaign, subscriber) {
    const { subject_line, content_html, content_markdown } = campaign;
    const { name } = subscriber;
    const firstName = this.getFirstName(name);

    // Get HTML content (prefer content_html, fallback to markdown)
    let contentHtml = content_html;
    if (!contentHtml && content_markdown) {
      contentHtml = marked.parse(content_markdown);
    }

    // Personalize content
    let personalizedHtml = this.personalizeContent(contentHtml, subscriber);

    // Add tracking pixel
    const trackingPixelUrl = this.getTrackingPixelUrl(campaign.id, subscriber.id);
    personalizedHtml += `<img src="${trackingPixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

    // Wrap in layout
    const html = this.wrapInLayout(personalizedHtml, subscriber);

    // Personalize subject line
    const personalizedSubject = subject_line.replace(/\{\{firstName\}\}/g, firstName);

    return {
      subject: personalizedSubject,
      html,
      text: this.htmlToText(personalizedHtml)
    };
  }

  /**
   * Wrap content in email layout with header and footer
   * @param {string} content - HTML content
   * @param {Object} subscriber - Subscriber data (optional, for unsubscribe link)
   * @returns {string} - Complete HTML email
   */
  wrapInLayout(content, subscriber = null) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const unsubscribeUrl = subscriber && subscriber.email && subscriber.unsubscribe_token
      ? `${frontendUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${subscriber.unsubscribe_token}`
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>The Hub Newsletter</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
    img { max-width: 100%; height: auto; }
    a { color: ${this.brandColor}; }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${this.backgroundColor};">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${this.backgroundColor};">
    <tr>
      <td align="center" style="padding: 20px 15px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: ${this.cardBackground}; border-radius: 16px; overflow: hidden;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 32px 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">The Hub</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px; font-weight: 500;">Your Market Intelligence Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 32px 40px; color: #e2e8f0;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: ${this.backgroundColor}; padding: 32px 40px; text-align: center; border-top: 1px solid #334155;">
              <p style="color: #94a3b8; font-size: 14px; margin: 0 0 12px 0; line-height: 1.5;">
                © ${new Date().getFullYear()} The Hub. All rights reserved.
              </p>
              ${subscriber ? `
              <p style="color: #64748b; font-size: 12px; margin: 12px 0 0 0; line-height: 1.5;">
                <a href="${unsubscribeUrl}" style="color: #94a3b8; text-decoration: underline;">Unsubscribe</a>
                <span style="color: #475569; margin: 0 8px;">•</span>
                <a href="${frontendUrl}/blog" style="color: #94a3b8; text-decoration: underline;">Visit Blog</a>
                <span style="color: #475569; margin: 0 8px;">•</span>
                <a href="${frontendUrl}" style="color: #94a3b8; text-decoration: underline;">View Dashboard</a>
              </p>
              ` : ''}
              <p style="color: #64748b; font-size: 11px; margin: 16px 0 0 0; line-height: 1.4;">
                You're receiving this email because you subscribed to The Hub newsletter.<br/>
                The Hub • Market Intelligence Platform
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Personalize content with subscriber data
   * @param {string} content - HTML content
   * @param {Object} subscriber - Subscriber data
   * @returns {string} - Personalized HTML
   */
  personalizeContent(content, subscriber) {
    const { name, email } = subscriber;
    const firstName = this.getFirstName(name);

    return content
      .replace(/\{\{firstName\}\}/g, firstName)
      .replace(/\{\{email\}\}/g, email || '')
      .replace(/\{\{name\}\}/g, name || firstName);
  }

  /**
   * Track links in HTML content by wrapping them with tracking URLs
   * @param {string} html - HTML content
   * @param {string} campaignId - Campaign ID
   * @returns {string} - HTML with tracked links
   */
  trackLinks(html, campaignId) {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    let linkId = 0;

    return html.replace(/<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi, (match, attrs, url) => {
      // Skip if already a tracking link
      if (url.includes('/api/newsletter/track/click/')) {
        return match;
      }

      // Skip anchor links
      if (url.startsWith('#')) {
        return match;
      }

      linkId++;
      const trackingUrl = `${apiUrl}/api/newsletter/track/click/${campaignId}_${linkId}`;

      // Replace href but keep other attributes
      const newAttrs = attrs.replace(/href=["'][^"']+["']/i, `href="${trackingUrl}" data-original-url="${url}"`);
      return `<a ${newAttrs}>`;
    });
  }

  /**
   * Get tracking pixel URL
   * @param {string} campaignId - Campaign ID
   * @param {string} subscriberId - Subscriber ID
   * @returns {string} - Tracking pixel URL
   */
  getTrackingPixelUrl(campaignId, subscriberId) {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    return `${apiUrl}/api/newsletter/track/open/${campaignId}_${subscriberId}`;
  }

  /**
   * Convert HTML to plain text
   * @param {string} html - HTML content
   * @returns {string} - Plain text
   */
  htmlToText(html) {
    if (!html) return '';

    return html
      // Remove style and script tags with content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Convert headers to uppercase with newlines
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, (_, text) => `\n\n${text.toUpperCase()}\n`)
      // Convert paragraphs to text with newlines
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      // Convert line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Convert links to text with URL
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, '$2 ($1)')
      // Remove all other HTML tags
      .replace(/<[^>]+>/g, '')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up excessive whitespace
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }

  /**
   * Get first name from full name
   * @param {string} name - Full name
   * @returns {string} - First name or 'there' as fallback
   */
  getFirstName(name) {
    if (!name) return 'there';
    const parts = name.trim().split(/\s+/);
    return parts[0] || 'there';
  }
}

// Export singleton instance
module.exports = new EmailTemplates();
