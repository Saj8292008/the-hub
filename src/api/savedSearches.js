/**
 * Saved Searches API
 * Manage user's tracked search queries (synced with Telegram /track)
 */

const supabase = require('../db/supabase');

class SavedSearchesAPI {
  /**
   * Get all saved searches for the authenticated user
   * GET /api/saved-searches
   */
  async list(req) {
    const userId = req.user?.id;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    try {
      const { data, error } = await supabase.client
        .from('telegram_tracks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        searches: data || [],
        count: data?.length || 0
      };
    } catch (error) {
      console.error('Error listing saved searches:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Create a new saved search
   * POST /api/saved-searches
   * Body: { search_query, category?, max_price?, min_deal_score?, notify_telegram?, notify_email? }
   */
  async create(req) {
    const userId = req.user?.id;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    const {
      search_query,
      category = 'all',
      max_price = null,
      min_deal_score = 0,
      notify_telegram = true,
      notify_email = false
    } = req.body;

    if (!search_query || search_query.trim().length < 2) {
      return { error: 'Search query is required (min 2 characters)', status: 400 };
    }

    // Check user's track limit based on tier
    const tierLimits = { free: 3, pro: 20, premium: 999999 };
    const userTier = req.user?.tier || 'free';
    const limit = tierLimits[userTier] || 3;

    try {
      // Count existing active tracks
      const { count, error: countError } = await supabase.client
        .from('telegram_tracks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (countError) throw countError;

      if (count >= limit) {
        return {
          error: `Track limit reached (${limit} for ${userTier} tier). Upgrade to add more.`,
          status: 403,
          limit,
          tier: userTier
        };
      }

      // Check for duplicate
      const { data: existing } = await supabase.client
        .from('telegram_tracks')
        .select('id')
        .eq('user_id', userId)
        .ilike('search_query', search_query.trim())
        .eq('is_active', true)
        .single();

      if (existing) {
        return { error: 'You already have an active track for this search', status: 409 };
      }

      // Get user's linked telegram chat_id if available
      const { data: userData } = await supabase.client
        .from('users')
        .select('telegram_chat_id')
        .eq('id', userId)
        .single();

      // Create the track
      const { data, error } = await supabase.client
        .from('telegram_tracks')
        .insert({
          user_id: userId,
          chat_id: userData?.telegram_chat_id || null,
          search_query: search_query.trim().toLowerCase(),
          category,
          max_price: max_price ? parseFloat(max_price) : null,
          min_deal_score: parseInt(min_deal_score) || 0,
          notify_telegram,
          notify_email,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        search: data,
        message: 'Search saved! You\'ll be notified when matching deals are found.'
      };
    } catch (error) {
      console.error('Error creating saved search:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Update a saved search
   * PUT /api/saved-searches/:id
   */
  async update(req) {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    const {
      search_query,
      category,
      max_price,
      min_deal_score,
      notify_telegram,
      notify_email,
      is_active
    } = req.body;

    try {
      // Verify ownership
      const { data: existing, error: fetchError } = await supabase.client
        .from('telegram_tracks')
        .select('id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        return { error: 'Saved search not found', status: 404 };
      }

      // Build update object
      const updates = {};
      if (search_query !== undefined) updates.search_query = search_query.trim().toLowerCase();
      if (category !== undefined) updates.category = category;
      if (max_price !== undefined) updates.max_price = max_price ? parseFloat(max_price) : null;
      if (min_deal_score !== undefined) updates.min_deal_score = parseInt(min_deal_score) || 0;
      if (notify_telegram !== undefined) updates.notify_telegram = notify_telegram;
      if (notify_email !== undefined) updates.notify_email = notify_email;
      if (is_active !== undefined) updates.is_active = is_active;

      const { data, error } = await supabase.client
        .from('telegram_tracks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        search: data
      };
    } catch (error) {
      console.error('Error updating saved search:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Delete a saved search
   * DELETE /api/saved-searches/:id
   */
  async delete(req) {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    try {
      const { error } = await supabase.client
        .from('telegram_tracks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;

      return {
        success: true,
        message: 'Saved search deleted'
      };
    } catch (error) {
      console.error('Error deleting saved search:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Toggle a saved search active/inactive
   * POST /api/saved-searches/:id/toggle
   */
  async toggle(req) {
    const userId = req.user?.id;
    const { id } = req.params;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    try {
      // Get current state
      const { data: existing, error: fetchError } = await supabase.client
        .from('telegram_tracks')
        .select('is_active')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError || !existing) {
        return { error: 'Saved search not found', status: 404 };
      }

      // Toggle
      const { data, error } = await supabase.client
        .from('telegram_tracks')
        .update({ is_active: !existing.is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        search: data,
        message: data.is_active ? 'Search activated' : 'Search paused'
      };
    } catch (error) {
      console.error('Error toggling saved search:', error);
      return { error: error.message, status: 500 };
    }
  }

  /**
   * Get user's track limits
   * GET /api/saved-searches/limits
   */
  async getLimits(req) {
    const userId = req.user?.id;
    
    if (!userId) {
      return { error: 'Authentication required', status: 401 };
    }

    const tierLimits = { free: 3, pro: 20, premium: 999999 };
    const userTier = req.user?.tier || 'free';
    const limit = tierLimits[userTier] || 3;

    try {
      const { count, error } = await supabase.client
        .from('telegram_tracks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      return {
        success: true,
        tier: userTier,
        limit: userTier === 'premium' ? 'Unlimited' : limit,
        used: count || 0,
        remaining: userTier === 'premium' ? 'Unlimited' : Math.max(0, limit - (count || 0))
      };
    } catch (error) {
      console.error('Error getting limits:', error);
      return { error: error.message, status: 500 };
    }
  }
}

module.exports = new SavedSearchesAPI();
