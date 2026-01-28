const supabaseWrapper = require('./supabase');

/**
 * Coding sessions database queries
 * Manages persistent storage of mobile coding sessions
 */

/**
 * Get a coding session by chat ID
 * @param {number|string} chatId - Telegram chat ID
 * @returns {Promise<Object|null>} - Session data or null
 */
async function getCodingSession(chatId) {
  if (!supabaseWrapper.isAvailable()) {
    return null;
  }

  try {
    const { data, error } = await supabaseWrapper.client
      .from('coding_sessions')
      .select('*')
      .eq('chat_id', chatId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting coding session:', error);
    return null;
  }
}

/**
 * Upsert (create or update) a coding session
 * @param {number|string} chatId - Telegram chat ID
 * @param {Object} sessionData - Session data to store
 * @returns {Promise<Object|null>} - Updated session data
 */
async function upsertCodingSession(chatId, sessionData) {
  if (!supabaseWrapper.isAvailable()) {
    return null;
  }

  try {
    const data = {
      chat_id: chatId,
      active_repo: sessionData.activeRepo || null,
      repo_name: sessionData.repoName || null,
      github_token_encrypted: sessionData.githubToken || null,
      preferences: sessionData.preferences || {},
      last_activity: new Date().toISOString()
    };

    // Include user_id if provided
    if (sessionData.userId) {
      data.user_id = sessionData.userId;
    }

    const { data: result, error } = await supabaseWrapper.client
      .from('coding_sessions')
      .upsert(data, {
        onConflict: 'chat_id'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Error upserting coding session:', error);
    return null;
  }
}

/**
 * Delete a coding session
 * @param {number|string} chatId - Telegram chat ID
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async function deleteCodingSession(chatId) {
  if (!supabaseWrapper.isAvailable()) {
    return false;
  }

  try {
    const { error } = await supabaseWrapper.client
      .from('coding_sessions')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting coding session:', error);
    return false;
  }
}

/**
 * Update last activity timestamp
 * @param {number|string} chatId - Telegram chat ID
 * @returns {Promise<boolean>} - True if updated successfully
 */
async function updateLastActivity(chatId) {
  if (!supabaseWrapper.isAvailable()) {
    return false;
  }

  try {
    const { error } = await supabaseWrapper.client
      .from('coding_sessions')
      .update({ last_activity: new Date().toISOString() })
      .eq('chat_id', chatId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error updating last activity:', error);
    return false;
  }
}

/**
 * Get all active coding sessions
 * @param {number} hours - Consider sessions active within this many hours (default: 24)
 * @returns {Promise<Array>} - Array of active sessions
 */
async function getActiveSessions(hours = 24) {
  if (!supabaseWrapper.isAvailable()) {
    return [];
  }

  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseWrapper.client
      .from('coding_sessions')
      .select('*')
      .gte('last_activity', since)
      .order('last_activity', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return [];
  }
}

module.exports = {
  getCodingSession,
  upsertCodingSession,
  deleteCodingSession,
  updateLastActivity,
  getActiveSessions
};
