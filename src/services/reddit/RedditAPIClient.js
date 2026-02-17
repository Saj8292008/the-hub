const axios = require('axios');
const logger = require('../../utils/logger');

/**
 * Reddit API Client - OAuth2-based
 * Handles authentication and API calls to post comments
 * Uses script-type OAuth with refresh tokens
 */
class RedditAPIClient {
  constructor(config = {}) {
    this.clientId = config.clientId || process.env.REDDIT_CLIENT_ID;
    this.clientSecret = config.clientSecret || process.env.REDDIT_CLIENT_SECRET;
    this.refreshToken = config.refreshToken || process.env.REDDIT_REFRESH_TOKEN;
    this.username = config.username || process.env.REDDIT_USERNAME || 'Clear-Band8471';
    
    this.accessToken = null;
    this.tokenExpiry = null;
    
    this.baseUrl = 'https://oauth.reddit.com';
    this.authUrl = 'https://www.reddit.com/api/v1/access_token';
    
    // Rate limiting: Reddit allows 60 requests per minute
    this.lastRequestTime = 0;
    this.minRequestInterval = 2000; // 2 seconds between requests (safe buffer)
  }

  /**
   * Get or refresh OAuth access token
   * @returns {string} Valid access token
   */
  async getAccessToken() {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    logger.info('🔑 Fetching Reddit access token...');

    try {
      // Using refresh token grant
      const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await axios.post(
        this.authUrl,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'TheHub/1.0 by u/Clear-Band8471'
          },
          timeout: 10000
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      logger.info('✅ Reddit access token obtained');
      return this.accessToken;
    } catch (error) {
      logger.error(`❌ Failed to get Reddit access token: ${error.message}`);
      if (error.response) {
        logger.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Reddit auth failed: ${error.message}`);
    }
  }

  /**
   * Rate limit helper - ensures we don't exceed Reddit's API limits
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      logger.debug(`⏳ Rate limiting: waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Make an authenticated API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint (without base URL)
   * @param {Object} data - Request body
   * @returns {Object} API response data
   */
  async apiRequest(method, endpoint, data = null) {
    await this.waitForRateLimit();
    
    const token = await this.getAccessToken();
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const config = {
        method,
        url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'TheHub/1.0 by u/Clear-Band8471',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 15000
      };

      if (data) {
        config.data = new URLSearchParams(data);
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error(`❌ Reddit API request failed: ${method} ${endpoint}`);
      if (error.response) {
        logger.error(`Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Post a comment reply to a Reddit post or comment
   * @param {string} parentId - Full ID of parent (e.g., t1_abc123 or t3_abc123)
   * @param {string} text - Comment text (markdown supported)
   * @returns {Object} Posted comment data
   */
  async postComment(parentId, text) {
    logger.info(`💬 Posting comment to ${parentId}`);
    
    try {
      const response = await this.apiRequest('POST', '/api/comment', {
        api_type: 'json',
        text: text,
        thing_id: parentId
      });

      // Reddit returns nested structure: { json: { data: { things: [...] } } }
      if (response.json && response.json.errors && response.json.errors.length > 0) {
        throw new Error(`Reddit API error: ${JSON.stringify(response.json.errors)}`);
      }

      const comment = response.json?.data?.things?.[0]?.data;
      if (!comment) {
        throw new Error('No comment data returned from Reddit API');
      }

      logger.info(`✅ Comment posted: ${comment.id}`);
      return comment;
    } catch (error) {
      logger.error(`❌ Failed to post comment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get user's recent comments (to check if we already replied)
   * @param {number} limit - Number of comments to fetch
   * @returns {Array} Recent comments
   */
  async getUserComments(limit = 100) {
    logger.debug(`📥 Fetching last ${limit} comments for u/${this.username}`);
    
    try {
      const response = await this.apiRequest('GET', `/user/${this.username}/comments.json?limit=${limit}`);
      
      if (!response.data || !response.data.children) {
        return [];
      }

      return response.data.children.map(child => ({
        id: child.data.id,
        parent_id: child.data.parent_id,
        link_id: child.data.link_id,
        body: child.data.body,
        created_utc: child.data.created_utc,
        permalink: child.data.permalink
      }));
    } catch (error) {
      logger.error(`❌ Failed to fetch user comments: ${error.message}`);
      return []; // Return empty array on error to allow operation to continue
    }
  }

  /**
   * Check if we've already replied to a specific comment/post
   * @param {string} commentId - Comment ID to check (without prefix)
   * @returns {boolean} True if already replied
   */
  async hasRepliedTo(commentId) {
    try {
      const recentComments = await this.getUserComments(100);
      
      // Check if any of our recent comments have this as parent
      const hasReply = recentComments.some(comment => 
        comment.parent_id === `t1_${commentId}` || 
        comment.link_id === `t3_${commentId}`
      );
      
      return hasReply;
    } catch (error) {
      logger.warn(`⚠️ Could not check reply status for ${commentId}: ${error.message}`);
      return false; // Default to allowing reply on error
    }
  }

  /**
   * Get information about a specific comment
   * @param {string} commentId - Comment ID (without prefix)
   * @param {string} subreddit - Subreddit name
   * @returns {Object} Comment data
   */
  async getComment(subreddit, commentId) {
    try {
      const response = await this.apiRequest('GET', `/r/${subreddit}/api/info.json?id=t1_${commentId}`);
      
      if (!response.data || !response.data.children || response.data.children.length === 0) {
        throw new Error('Comment not found');
      }

      return response.data.children[0].data;
    } catch (error) {
      logger.error(`❌ Failed to fetch comment ${commentId}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RedditAPIClient;
