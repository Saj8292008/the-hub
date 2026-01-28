/**
 * Session Manager for mobile coding bot
 * Manages per-chat session state including active repos, context files, and tokens
 */

class SessionManager {
  constructor() {
    // Map<chatId, SessionState>
    this.sessions = new Map();

    // Session timeout (1 hour of inactivity)
    this.sessionTimeout = 60 * 60 * 1000;

    // Max context files to track
    this.maxContextFiles = 10;

    // Cleanup interval (every 10 minutes)
    this.cleanupInterval = setInterval(() => this.cleanupInactiveSessions(), 10 * 60 * 1000);
  }

  /**
   * Get or create a session for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @returns {Object} - Session state object
   */
  getSession(chatId) {
    const id = String(chatId);

    if (!this.sessions.has(id)) {
      this.sessions.set(id, this.createNewSession());
    }

    const session = this.sessions.get(id);
    session.lastActivity = Date.now();

    return session;
  }

  /**
   * Create a new session object
   * @returns {Object} - New session state
   */
  createNewSession() {
    return {
      activeRepo: null,           // Full path to repo directory
      repoName: null,             // Repository name
      repoOwner: null,            // Repository owner
      currentDir: '.',            // Current working directory within repo
      contextFiles: [],           // Array of {path, content, addedAt}
      githubToken: null,          // User's GitHub token
      lastActivity: Date.now(),
      preferences: {},
      rateLimit: {
        lastRequest: 0,
        requestCount: 0,
        windowStart: Date.now()
      }
    };
  }

  /**
   * Set the active repository for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @param {string} repoPath - Full path to the repo directory
   * @param {string} repoName - Repository name
   * @param {string} repoOwner - Repository owner
   */
  setActiveRepo(chatId, repoPath, repoName, repoOwner = null) {
    const session = this.getSession(chatId);
    session.activeRepo = repoPath;
    session.repoName = repoName;
    session.repoOwner = repoOwner;
    session.currentDir = '.';
    // Clear context files when switching repos
    session.contextFiles = [];
  }

  /**
   * Get the active repository for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @returns {Object|null} - {path, name, owner} or null
   */
  getActiveRepo(chatId) {
    const session = this.getSession(chatId);

    if (!session.activeRepo) {
      return null;
    }

    return {
      path: session.activeRepo,
      name: session.repoName,
      owner: session.repoOwner
    };
  }

  /**
   * Add a file to the context for Claude
   * @param {number|string} chatId - The Telegram chat ID
   * @param {string} filePath - Relative path to the file
   * @param {string} content - File content
   */
  addToContext(chatId, filePath, content) {
    const session = this.getSession(chatId);

    // Remove if already exists
    session.contextFiles = session.contextFiles.filter(f => f.path !== filePath);

    // Add to beginning
    session.contextFiles.unshift({
      path: filePath,
      content: content,
      addedAt: Date.now()
    });

    // Keep only the most recent N files
    if (session.contextFiles.length > this.maxContextFiles) {
      session.contextFiles = session.contextFiles.slice(0, this.maxContextFiles);
    }
  }

  /**
   * Get context files for Claude
   * @param {number|string} chatId - The Telegram chat ID
   * @param {number} limit - Maximum number of files to return
   * @returns {Array} - Array of {path, content}
   */
  getContext(chatId, limit = null) {
    const session = this.getSession(chatId);
    const files = session.contextFiles || [];

    if (limit && limit < files.length) {
      return files.slice(0, limit);
    }

    return files;
  }

  /**
   * Set GitHub token for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @param {string} token - GitHub personal access token
   */
  setGithubToken(chatId, token) {
    const session = this.getSession(chatId);
    session.githubToken = token;
  }

  /**
   * Get GitHub token for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @returns {string|null} - GitHub token or null
   */
  getGithubToken(chatId) {
    const session = this.getSession(chatId);
    return session.githubToken || process.env.GITHUB_TOKEN || null;
  }

  /**
   * Check rate limiting for a chat
   * @param {number|string} chatId - The Telegram chat ID
   * @param {number} maxRequests - Max requests per hour (default: 20)
   * @returns {Object} - {allowed, remaining, resetIn}
   */
  checkRateLimit(chatId, maxRequests = 20) {
    const session = this.getSession(chatId);
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;

    // Reset window if it's been an hour
    if (now - session.rateLimit.windowStart > hourInMs) {
      session.rateLimit.windowStart = now;
      session.rateLimit.requestCount = 0;
    }

    const remaining = maxRequests - session.rateLimit.requestCount;
    const resetIn = hourInMs - (now - session.rateLimit.windowStart);

    if (remaining <= 0) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil(resetIn / 1000 / 60) // minutes
      };
    }

    // Increment request count
    session.rateLimit.requestCount++;
    session.rateLimit.lastRequest = now;

    return {
      allowed: true,
      remaining: remaining - 1,
      resetIn: Math.ceil(resetIn / 1000 / 60)
    };
  }

  /**
   * Clear a session
   * @param {number|string} chatId - The Telegram chat ID
   */
  clearSession(chatId) {
    const id = String(chatId);
    this.sessions.delete(id);
  }

  /**
   * Clean up inactive sessions
   */
  cleanupInactiveSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [chatId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(chatId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive sessions`);
    }
  }

  /**
   * Get session statistics
   * @returns {Object} - Session stats
   */
  getStats() {
    return {
      activeSessions: this.sessions.size,
      sessions: Array.from(this.sessions.entries()).map(([chatId, session]) => ({
        chatId,
        activeRepo: session.repoName || 'none',
        contextFiles: session.contextFiles.length,
        lastActivity: new Date(session.lastActivity).toISOString()
      }))
    };
  }

  /**
   * Destroy the session manager (cleanup)
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}

module.exports = SessionManager;
