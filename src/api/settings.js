const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/auth');
const supabaseWrapper = require('../db/supabase');
const supabase = supabaseWrapper.client;
const logger = require('../utils/logger');

// GET /api/settings - Load user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get user data from users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (userError) {
      logger.error('Error fetching user:', userError);
      return res.status(500).json({ error: 'Failed to load user data' });
    }

    // Check newsletter subscription
    const { data: newsletterData } = await supabase
      .from('blog_subscribers')
      .select('status, confirmed')
      .eq('email', userData.email)
      .single();

    // Parse preferences from JSONB
    const preferences = userData.preferences || {};
    const telegramPreferences = userData.telegram_preferences || {
      categories: ['watches', 'cars', 'sneakers', 'sports'],
      minScore: 8.0,
      maxPrice: null
    };

    res.json({
      email: userData.email,
      firstName: userData.first_name || '',
      lastName: userData.last_name || '',
      tier: userData.tier || 'free',
      stripeCustomerId: userData.stripe_customer_id,
      subscriptionEndsAt: userData.subscription_ends_at,
      telegramConnected: !!userData.telegram_chat_id,
      telegramChatId: userData.telegram_chat_id,
      telegramUsername: userData.telegram_username,
      telegramPreferences: telegramPreferences,
      newsletter: newsletterData?.status === 'confirmed' && newsletterData?.confirmed,
      emailNotifications: preferences.emailNotifications ?? true,
      priceAlerts: preferences.priceAlerts ?? true,
      dealScoreThreshold: preferences.dealScoreThreshold ?? 8.0,
      emailFrequency: preferences.emailFrequency ?? 'daily',
      watchlistAlertThreshold: preferences.watchlistAlertThreshold ?? 10,
      interests: preferences.interests ?? ['watches', 'cars', 'sneakers', 'sports']
    });
  } catch (error) {
    console.error('Failed to load settings:', error);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PUT /api/settings - Update user settings
router.put('/', authenticateToken, async (req, res) => {
  const {
    email,
    firstName,
    lastName,
    newsletter,
    emailNotifications,
    priceAlerts,
    dealScoreThreshold,
    emailFrequency,
    watchlistAlertThreshold,
    interests,
    telegramPreferences
  } = req.body;

  try {
    // Build preferences object
    const preferences = {
      emailNotifications,
      priceAlerts,
      dealScoreThreshold,
      emailFrequency,
      watchlistAlertThreshold,
      interests
    };

    // Update user table
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email,
        first_name: firstName,
        last_name: lastName,
        telegram_preferences: telegramPreferences,
        preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);

    if (updateError) {
      console.error('Error updating user:', updateError);
      return res.status(500).json({ error: 'Failed to update settings' });
    }

    // Update newsletter subscription
    if (newsletter) {
      await supabase
        .from('blog_subscribers')
        .upsert({
          email: email,
          status: 'confirmed',
          confirmed: true,
          subscribed_at: new Date().toISOString()
        }, {
          onConflict: 'email'
        });
    } else {
      await supabase
        .from('blog_subscribers')
        .update({ status: 'unsubscribed' })
        .eq('email', email);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/settings/change-password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    // Get current user's password hash
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.userId)
      .single();

    if (userError) {
      logger.error('Error fetching user for password change:', userError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    // Verify current password
    const isValidPassword = await verifyPassword(currentPassword, userData.password_hash);

    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);

    if (updateError) {
      logger.error('Error updating password:', updateError);
      return res.status(500).json({ error: 'Failed to update password' });
    }

    logger.info(`User ${req.userId} changed password successfully`);
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to change password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/settings/disconnect-telegram
router.post('/disconnect-telegram', authenticateToken, async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.userId);

    if (error) {
      console.error('Error disconnecting Telegram:', error);
      return res.status(500).json({ error: 'Failed to disconnect Telegram' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Failed to disconnect Telegram:', error);
    res.status(500).json({ error: 'Failed to disconnect Telegram' });
  }
});

// GET /api/settings/export-data
router.get('/export-data', authenticateToken, async (req, res) => {
  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.userId)
      .single();

    if (userError) throw userError;

    // Get watchlist (if table exists)
    const { data: watchlistData } = await supabase
      .from('watchlist')
      .select('*')
      .eq('user_id', req.userId);

    // Get price alerts (if table exists)
    const { data: alertsData } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', req.userId);

    // Remove sensitive data
    delete userData.password_hash;
    delete userData.stripe_customer_id;

    res.json({
      user: userData,
      watchlist: watchlistData || [],
      price_alerts: alertsData || [],
      exported_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to export data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

// DELETE /api/settings/delete-account
router.delete('/delete-account', authenticateToken, async (req, res) => {
  try {
    // Get user to check for Stripe customer
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', req.userId)
      .single();

    // TODO: Cancel Stripe subscription if exists
    if (userData?.stripe_customer_id) {
      logger.warn('TODO: Cancel Stripe subscription for customer:', userData.stripe_customer_id);
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // await stripe.subscriptions.cancel(subscriptionId);
    }

    // Delete user from users table (CASCADE should handle related records)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', req.userId);

    if (deleteError) {
      logger.error('Error deleting user:', deleteError);
      return res.status(500).json({ error: 'Failed to delete account' });
    }

    logger.info(`User ${req.userId} account deleted successfully`);

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
