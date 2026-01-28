/**
 * Newsletter API Endpoints
 * Handles subscriptions, campaigns, tracking, and admin operations
 */

const express = require('express');
const router = express.Router();
const newsletterQueries = require('../db/newsletterQueries');
const resendClient = require('../services/email/resendClient');
const emailTemplates = require('../services/email/emailTemplates');

// ============================================================================
// PUBLIC ENDPOINTS
// ============================================================================

/**
 * Subscribe to newsletter
 * POST /api/newsletter/subscribe
 */
async function subscribe(req) {
  const { email, name, source, preferences } = req.body;

  if (!email || !email.includes('@')) {
    throw new Error('Valid email address is required');
  }

  // Check if already subscribed
  try {
    const { data: existing } = await newsletterQueries.getSubscriberByEmail(email);

    if (existing) {
      // If unsubscribed, allow resubscribe
      if (existing.unsubscribed) {
        const crypto = require('crypto');
        const newConfirmToken = crypto.randomBytes(32).toString('hex');

        await newsletterQueries.updateSubscriber(existing.id, {
          unsubscribed: false,
          unsubscribe_reason: null,
          unsubscribed_at: null,
          confirmed: false,
          confirmation_token: newConfirmToken,
          subscribed_at: new Date().toISOString()
        });

        // Send confirmation email
        const emailData = emailTemplates.generateConfirmationEmail({
          ...existing,
          confirmation_token: newConfirmToken,
          name: name || existing.name
        });

        await resendClient.sendEmail({
          to: email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });

        return {
          success: true,
          message: 'Re-subscribed successfully! Check your email to confirm.',
          requiresConfirmation: true
        };
      }

      // Already subscribed
      if (existing.confirmed) {
        return {
          success: false,
          message: 'This email is already subscribed to our newsletter.',
          error: 'ALREADY_SUBSCRIBED'
        };
      }

      // Pending confirmation - resend
      const emailData = emailTemplates.generateConfirmationEmail(existing);
      await resendClient.sendEmail({
        to: email,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text
      });

      return {
        success: true,
        message: 'Confirmation email resent! Please check your inbox.',
        requiresConfirmation: true
      };
    }
  } catch (error) {
    // Subscriber doesn't exist, continue with creation
  }

  // Create new subscriber
  const { data: subscriber, error } = await newsletterQueries.createSubscriber({
    email,
    name,
    source: source || 'unknown',
    category_preferences: preferences?.categories || []
  });

  if (error) {
    throw new Error(`Failed to create subscriber: ${error.message}`);
  }

  // Send confirmation email
  const emailData = emailTemplates.generateConfirmationEmail(subscriber);

  const sendResult = await resendClient.sendEmail({
    to: email,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  });

  if (!sendResult.success) {
    console.error('Failed to send confirmation email:', sendResult.error);
    // Don't fail the subscription, just log the error
  }

  return {
    success: true,
    message: 'Subscription successful! Check your email to confirm.',
    requiresConfirmation: true,
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name
    }
  };
}

/**
 * Confirm email subscription
 * GET /api/newsletter/confirm?token=xxx
 */
async function confirm(req) {
  const { token } = req.query;

  if (!token) {
    throw new Error('Confirmation token is required');
  }

  // Confirm subscriber
  const { data: subscriber, error } = await newsletterQueries.confirmSubscriber(token);

  if (error || !subscriber) {
    throw new Error('Invalid or expired confirmation token');
  }

  // Send welcome email
  const emailData = emailTemplates.generateWelcomeEmail(subscriber);

  await resendClient.sendEmail({
    to: subscriber.email,
    subject: emailData.subject,
    html: emailData.html,
    text: emailData.text
  });

  return {
    success: true,
    message: 'Email confirmed! Welcome to The Hub newsletter.',
    subscriber: {
      id: subscriber.id,
      email: subscriber.email,
      name: subscriber.name
    }
  };
}

/**
 * Unsubscribe from newsletter
 * GET /api/newsletter/unsubscribe?email=xxx&token=xxx
 */
async function unsubscribe(req) {
  const { email, token } = req.query;

  if (!email || !token) {
    throw new Error('Email and token are required');
  }

  const { data: subscriber, error } = await newsletterQueries.unsubscribeByToken(email, token);

  if (error || !subscriber) {
    throw new Error('Invalid unsubscribe link');
  }

  return {
    success: true,
    message: 'You have been unsubscribed from The Hub newsletter.',
    subscriber: {
      email: subscriber.email
    }
  };
}

/**
 * Unsubscribe with reason
 * POST /api/newsletter/unsubscribe
 */
async function unsubscribeWithReason(req) {
  const { email, token, reason } = req.body;

  if (!email || !token) {
    throw new Error('Email and token are required');
  }

  const { data: subscriber, error } = await newsletterQueries.unsubscribeWithReason(
    email,
    token,
    reason
  );

  if (error || !subscriber) {
    throw new Error('Invalid unsubscribe request');
  }

  return {
    success: true,
    message: 'You have been unsubscribed. We\'re sorry to see you go!'
  };
}

/**
 * Track email open (tracking pixel)
 * GET /api/newsletter/track/open/:trackingId
 */
async function trackOpen(req, res) {
  const { trackingId } = req.params;

  try {
    // Parse tracking ID: campaignId_subscriberId
    const [campaignId, subscriberId] = trackingId.split('_');

    if (campaignId && subscriberId) {
      // Get send ID
      const { data: send } = await newsletterQueries.getSend(campaignId, subscriberId);

      // Log open event
      await newsletterQueries.logEvent({
        send_id: send?.id,
        campaign_id: campaignId,
        subscriber_id: subscriberId,
        event_type: 'open',
        user_agent: req.get('user-agent'),
        ip_address: req.ip
      });
    }
  } catch (error) {
    console.error('Error tracking open:', error);
    // Don't fail, just log
  }

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Expires': '0'
  });
  res.end(pixel);
}

/**
 * Track link click and redirect
 * GET /api/newsletter/track/click/:linkId
 */
async function trackClick(req, res) {
  const { linkId } = req.params;

  try {
    // Parse link ID: campaignId_linkNumber
    const [campaignId, linkNumber] = linkId.split('_');

    if (campaignId) {
      // Get original URL from campaign content
      const { data: campaign } = await newsletterQueries.getCampaign(campaignId);

      // Extract original URL from data-original-url attribute
      const urlMatch = campaign?.content_html?.match(
        new RegExp(`data-original-url="([^"]+)"[^>]*>`, 'i')
      );
      const originalUrl = urlMatch ? urlMatch[1] : null;

      // Log click event
      await newsletterQueries.logEvent({
        campaign_id: campaignId,
        event_type: 'click',
        link_url: originalUrl,
        link_id: linkId,
        user_agent: req.get('user-agent'),
        ip_address: req.ip
      });

      // Redirect to original URL
      if (originalUrl) {
        return res.redirect(302, originalUrl);
      }
    }
  } catch (error) {
    console.error('Error tracking click:', error);
  }

  // Fallback redirect
  res.redirect(302, process.env.FRONTEND_URL || 'http://localhost:5173');
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Get all subscribers
 * GET /api/newsletter/subscribers
 */
async function getSubscribers(req) {
  const { confirmed, unsubscribed, page = 1, limit = 100 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data: subscribers, count, error } = await newsletterQueries.getSubscribers({
    confirmed: confirmed !== undefined ? confirmed === 'true' : undefined,
    unsubscribed: unsubscribed !== undefined ? unsubscribed === 'true' : undefined,
    limit: parseInt(limit),
    offset
  });

  if (error) {
    throw new Error(`Failed to fetch subscribers: ${error.message}`);
  }

  return {
    subscribers: subscribers || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit))
    }
  };
}

/**
 * Export subscribers to CSV
 * POST /api/newsletter/subscribers/export
 */
async function exportSubscribers(req) {
  const { data: subscribers } = await newsletterQueries.getSubscribers({ limit: 10000 });

  if (!subscribers) {
    throw new Error('No subscribers found');
  }

  // Generate CSV
  const headers = ['Email', 'Name', 'Confirmed', 'Subscribed At', 'Unsubscribed'];
  const rows = subscribers.map(s => [
    s.email,
    s.name || '',
    s.confirmed ? 'Yes' : 'No',
    s.subscribed_at,
    s.unsubscribed ? 'Yes' : 'No'
  ]);

  const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

  return {
    success: true,
    csv,
    count: subscribers.length
  };
}

/**
 * Get all campaigns
 * GET /api/newsletter/campaigns
 */
async function getCampaigns(req) {
  const { status, campaign_type, page = 1, limit = 50 } = req.query;

  const offset = (parseInt(page) - 1) * parseInt(limit);

  const { data: campaigns, count, error } = await newsletterQueries.getCampaigns({
    status,
    campaign_type,
    limit: parseInt(limit),
    offset
  });

  if (error) {
    throw new Error(`Failed to fetch campaigns: ${error.message}`);
  }

  return {
    campaigns: campaigns || [],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: count || 0,
      pages: Math.ceil((count || 0) / parseInt(limit))
    }
  };
}

/**
 * Get single campaign with analytics
 * GET /api/newsletter/campaigns/:id
 */
async function getCampaign(req) {
  const { id } = req.params;

  const { data: campaign, error } = await newsletterQueries.getCampaign(id);

  if (error || !campaign) {
    throw new Error('Campaign not found');
  }

  // Get analytics
  const analytics = await newsletterQueries.getCampaignAnalytics(id);

  return {
    campaign,
    analytics
  };
}

/**
 * Create campaign
 * POST /api/newsletter/campaigns
 */
async function createCampaign(req) {
  const campaignData = req.body;

  const { data: campaign, error } = await newsletterQueries.createCampaign(campaignData);

  if (error) {
    throw new Error(`Failed to create campaign: ${error.message}`);
  }

  return {
    success: true,
    campaign
  };
}

/**
 * Update campaign
 * PUT /api/newsletter/campaigns/:id
 */
async function updateCampaign(req) {
  const { id } = req.params;
  const updates = req.body;

  const { data: campaign, error } = await newsletterQueries.updateCampaign(id, updates);

  if (error) {
    throw new Error(`Failed to update campaign: ${error.message}`);
  }

  return {
    success: true,
    campaign
  };
}

/**
 * Delete campaign
 * DELETE /api/newsletter/campaigns/:id
 */
async function deleteCampaign(req) {
  const { id } = req.params;

  const { error } = await newsletterQueries.deleteCampaign(id);

  if (error) {
    throw new Error(`Failed to delete campaign: ${error.message}`);
  }

  return {
    success: true,
    message: 'Campaign deleted successfully'
  };
}

/**
 * Send test email
 * POST /api/newsletter/campaigns/:id/send-test
 */
async function sendTestEmail(req) {
  const { id } = req.params;
  const { recipients } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    throw new Error('Recipients array is required');
  }

  const { data: campaign } = await newsletterQueries.getCampaign(id);

  if (!campaign) {
    throw new Error('Campaign not found');
  }

  // Send to each test recipient
  const results = [];

  for (const email of recipients) {
    const testSubscriber = {
      email,
      name: 'Test User',
      unsubscribe_token: 'test-token'
    };

    const emailData = emailTemplates.generateNewsletterEmail(campaign, testSubscriber);

    const result = await resendClient.sendEmail({
      to: email,
      subject: `[TEST] ${emailData.subject}`,
      html: emailData.html,
      text: emailData.text
    });

    results.push({
      email,
      success: result.success,
      error: result.error
    });
  }

  return {
    success: true,
    results,
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length
  };
}

/**
 * Schedule campaign
 * POST /api/newsletter/campaigns/:id/schedule
 */
async function scheduleCampaign(req) {
  const { id } = req.params;
  const { scheduled_for } = req.body;

  if (!scheduled_for) {
    throw new Error('scheduled_for timestamp is required');
  }

  const { data: campaign, error } = await newsletterQueries.updateCampaign(id, {
    status: 'scheduled',
    scheduled_for
  });

  if (error) {
    throw new Error(`Failed to schedule campaign: ${error.message}`);
  }

  return {
    success: true,
    campaign
  };
}

/**
 * Send campaign now
 * POST /api/newsletter/campaigns/:id/send-now
 */
async function sendCampaignNow(req) {
  const { id } = req.params;

  // This will be handled by the newsletter scheduler
  // For now, just update status
  await newsletterQueries.updateCampaign(id, {
    status: 'sending',
    send_started_at: new Date().toISOString()
  });

  return {
    success: true,
    message: 'Campaign send initiated',
    campaign_id: id
  };
}

/**
 * Generate newsletter content with AI
 * POST /api/newsletter/generate
 */
async function generateNewsletter(req) {
  const contentGenerator = require('../services/newsletter/contentGenerator');

  const { week_start, week_end, custom_prompt } = req.body;

  const content = await contentGenerator.generateWeeklyNewsletter({
    weekStart: week_start,
    weekEnd: week_end,
    customPrompt: custom_prompt
  });

  return {
    success: true,
    ...content
  };
}

/**
 * Get analytics overview
 * GET /api/newsletter/analytics/overview
 */
async function getAnalyticsOverview(req) {
  const overview = await newsletterQueries.getAnalyticsOverview();

  return {
    success: true,
    ...overview
  };
}

/**
 * Get growth analytics
 * GET /api/newsletter/analytics/growth
 */
async function getGrowthAnalytics(req) {
  const { days = 30 } = req.query;

  const growth = await newsletterQueries.getGrowthAnalytics(parseInt(days));

  return {
    success: true,
    growth,
    days: parseInt(days)
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Public
  subscribe,
  confirm,
  unsubscribe,
  unsubscribeWithReason,
  trackOpen,
  trackClick,

  // Admin
  getSubscribers,
  exportSubscribers,
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendTestEmail,
  scheduleCampaign,
  sendCampaignNow,
  generateNewsletter,
  getAnalyticsOverview,
  getGrowthAnalytics
};
