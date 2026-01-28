/**
 * Weekly Digest Email Service
 * Sends personalized weekly roundups of tracked items to users
 */

const supabase = require('../../db/supabase');
const resendClient = require('./resendClient');

class WeeklyDigestService {
  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'digest@thehub.deals';
    this.fromName = 'The Hub Digest';
  }

  /**
   * Generate and send weekly digests to all eligible users
   * @returns {Promise<Object>} - Results summary
   */
  async sendAllDigests() {
    console.log('📬 Starting weekly digest generation...');
    
    const results = {
      total: 0,
      sent: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    try {
      // Get users who have active tracks and want email notifications
      const { data: users, error } = await supabase.client
        .from('users')
        .select('id, email, first_name, tier')
        .eq('email_notifications', true);

      if (error) throw error;

      if (!users || users.length === 0) {
        console.log('No users eligible for digest');
        return results;
      }

      results.total = users.length;

      for (const user of users) {
        try {
          const sent = await this.sendUserDigest(user);
          if (sent) {
            results.sent++;
          } else {
            results.skipped++;
          }
        } catch (err) {
          results.failed++;
          results.errors.push({ userId: user.id, error: err.message });
        }
      }

      console.log(`📬 Digest complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`);
      return results;

    } catch (error) {
      console.error('Error sending digests:', error);
      throw error;
    }
  }

  /**
   * Generate and send digest for a specific user
   * @param {Object} user - User object with id, email, first_name
   * @returns {Promise<boolean>} - Whether email was sent
   */
  async sendUserDigest(user) {
    // Get user's tracked searches
    const { data: tracks } = await supabase.client
      .from('telegram_tracks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('notify_email', true);

    if (!tracks || tracks.length === 0) {
      return false; // No tracks to report on
    }

    // Get week's date range
    const weekEnd = new Date();
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    // Get matches for each track
    const trackSummaries = [];
    let totalMatches = 0;
    let totalNewDeals = 0;

    for (const track of tracks) {
      const matches = await this.getTrackMatches(track, weekStart, weekEnd);
      if (matches.length > 0) {
        trackSummaries.push({
          query: track.search_query,
          maxPrice: track.max_price,
          matches: matches,
          bestDeal: matches[0] // Already sorted by deal_score
        });
        totalMatches += matches.length;
        totalNewDeals += matches.filter(m => m.deal_score >= 80).length;
      }
    }

    // Skip if nothing to report
    if (trackSummaries.length === 0) {
      return false;
    }

    // Generate email content
    const html = this.generateDigestHtml(user, trackSummaries, {
      totalMatches,
      totalNewDeals,
      weekStart,
      weekEnd
    });

    const subject = totalNewDeals > 0
      ? `🔥 ${totalNewDeals} hot deals matched your searches this week!`
      : `📊 Your weekly deal digest - ${totalMatches} matches`;

    // Send email
    await resendClient.send({
      to: user.email,
      from: `${this.fromName} <${this.fromEmail}>`,
      subject,
      html
    });

    return true;
  }

  /**
   * Get matching listings for a tracked search
   */
  async getTrackMatches(track, weekStart, weekEnd) {
    const matches = [];
    const tables = ['watch_listings', 'sneaker_listings', 'car_listings'];
    
    for (const table of tables) {
      try {
        let query = supabase.client
          .from(table)
          .select('id, title, model, brand, price, deal_score, url, source, created_at')
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
          .order('deal_score', { ascending: false })
          .limit(10);

        // Search by query terms
        const terms = track.search_query.split(/\s+/);
        for (const term of terms) {
          if (term.length > 2) {
            query = query.or(`title.ilike.%${term}%,model.ilike.%${term}%,brand.ilike.%${term}%`);
          }
        }

        // Apply price filter if set
        if (track.max_price) {
          query = query.lte('price', track.max_price);
        }

        const { data } = await query;
        if (data) {
          matches.push(...data.map(d => ({ ...d, category: table.replace('_listings', '') })));
        }
      } catch (e) {
        console.warn(`Error querying ${table}:`, e.message);
      }
    }

    // Sort by deal score and dedupe
    return matches
      .sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0))
      .slice(0, 5);
  }

  /**
   * Generate HTML email content
   */
  generateDigestHtml(user, trackSummaries, stats) {
    const firstName = user.first_name || 'there';
    const weekRange = `${stats.weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${stats.weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Weekly Deal Digest</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0e27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #374151;">
      <h1 style="color: #ffffff; font-size: 24px; margin: 0;">
        ⚡ The Hub Weekly Digest
      </h1>
      <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 14px;">
        ${weekRange}
      </p>
    </div>

    <!-- Summary Stats -->
    <div style="background: linear-gradient(135deg, #7c3aed22, #6366f122); border: 1px solid #7c3aed44; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center;">
      <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 18px;">
        Hey ${firstName}! Here's your week in deals:
      </h2>
      <div style="display: inline-block;">
        <div style="display: inline-block; padding: 0 20px; border-right: 1px solid #374151;">
          <div style="font-size: 32px; font-weight: bold; color: #a78bfa;">${stats.totalMatches}</div>
          <div style="font-size: 12px; color: #9ca3af;">Matches Found</div>
        </div>
        <div style="display: inline-block; padding: 0 20px;">
          <div style="font-size: 32px; font-weight: bold; color: #34d399;">${stats.totalNewDeals}</div>
          <div style="font-size: 12px; color: #9ca3af;">Hot Deals</div>
        </div>
      </div>
    </div>
`;

    // Track summaries
    for (const summary of trackSummaries) {
      const maxPriceText = summary.maxPrice ? ` (≤$${summary.maxPrice.toLocaleString()})` : '';
      
      html += `
    <!-- Track: ${summary.query} -->
    <div style="background: #1f2937; border-radius: 12px; padding: 16px; margin: 16px 0;">
      <h3 style="color: #ffffff; margin: 0 0 12px 0; font-size: 16px;">
        🔍 "${summary.query}"${maxPriceText}
        <span style="font-weight: normal; font-size: 14px; color: #9ca3af;">
          • ${summary.matches.length} matches
        </span>
      </h3>
`;

      for (const match of summary.matches.slice(0, 3)) {
        const title = match.title || match.model || 'Item';
        const truncatedTitle = title.length > 50 ? title.substring(0, 47) + '...' : title;
        const price = match.price ? `$${Number(match.price).toLocaleString()}` : 'See listing';
        const score = match.deal_score || 0;
        const scoreColor = score >= 90 ? '#ef4444' : score >= 80 ? '#f59e0b' : score >= 70 ? '#22c55e' : '#6b7280';
        const scoreBadge = score >= 90 ? '🔥' : score >= 80 ? '✨' : score >= 70 ? '👍' : '';

        html += `
      <div style="border-top: 1px solid #374151; padding: 12px 0;">
        <div style="color: #ffffff; font-weight: 500; margin-bottom: 4px;">
          ${truncatedTitle}
        </div>
        <div style="color: #9ca3af; font-size: 14px;">
          <span style="color: #a78bfa; font-weight: 600;">${price}</span>
          <span style="margin-left: 8px; padding: 2px 8px; background: ${scoreColor}22; border-radius: 4px; color: ${scoreColor};">
            ${scoreBadge} Score: ${score}
          </span>
        </div>
        <a href="${match.url}" style="color: #818cf8; font-size: 13px; text-decoration: none;">
          View on ${match.source || 'marketplace'} →
        </a>
      </div>
`;
      }

      html += `
    </div>
`;
    }

    // Footer
    html += `
    <!-- CTA -->
    <div style="text-align: center; padding: 24px 0;">
      <a href="${process.env.FRONTEND_URL || 'https://thehub.deals'}/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6366f1); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600;">
        View All Deals in Dashboard
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding: 20px 0; border-top: 1px solid #374151; color: #6b7280; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        You're receiving this because you have email notifications enabled for tracked searches.
      </p>
      <p style="margin: 0;">
        <a href="${process.env.FRONTEND_URL || 'https://thehub.deals'}/settings" style="color: #818cf8; text-decoration: none;">
          Manage preferences
        </a>
        &nbsp;•&nbsp;
        <a href="${process.env.FRONTEND_URL || 'https://thehub.deals'}/newsletter/unsubscribe?email=${encodeURIComponent(user.email)}" style="color: #818cf8; text-decoration: none;">
          Unsubscribe
        </a>
      </p>
      <p style="margin: 12px 0 0 0;">
        © ${new Date().getFullYear()} The Hub Deals
      </p>
    </div>

  </div>
</body>
</html>
`;

    return html;
  }
}

module.exports = new WeeklyDigestService();
