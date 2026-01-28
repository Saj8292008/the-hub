const simpleGit = require('simple-git');

/**
 * Git operations using simple-git library
 */
class GitOperations {
  constructor() {
    this.defaultUser = {
      name: process.env.GIT_USER_NAME || 'Mobile Coding Bot',
      email: process.env.GIT_USER_EMAIL || 'bot@mobile-coding.dev'
    };
  }

  /**
   * Get git instance for a repository
   * @param {string} repoPath - Path to repository
   * @returns {Object} - simple-git instance
   */
  getGit(repoPath) {
    return simpleGit(repoPath);
  }

  /**
   * Get repository status
   * @param {string} repoPath - Path to repository
   * @returns {Promise<Object>} - Status information
   */
  async getStatus(repoPath) {
    try {
      const git = this.getGit(repoPath);
      const status = await git.status();

      return {
        branch: status.current,
        ahead: status.ahead,
        behind: status.behind,
        modified: status.modified,
        created: status.created,
        deleted: status.deleted,
        renamed: status.renamed,
        conflicted: status.conflicted,
        staged: status.staged,
        isClean: status.isClean()
      };
    } catch (error) {
      throw new Error(`Failed to get status: ${error.message}`);
    }
  }

  /**
   * Get current diff
   * @param {string} repoPath - Path to repository
   * @param {boolean} staged - Show staged changes (default: false)
   * @returns {Promise<string>} - Diff output
   */
  async getDiff(repoPath, staged = false) {
    try {
      const git = this.getGit(repoPath);

      if (staged) {
        return await git.diff(['--staged']);
      }

      return await git.diff();
    } catch (error) {
      throw new Error(`Failed to get diff: ${error.message}`);
    }
  }

  /**
   * Add files to staging
   * @param {string} repoPath - Path to repository
   * @param {Array|string} files - Files to add (or '.' for all)
   * @returns {Promise<void>}
   */
  async addFiles(repoPath, files = '.') {
    try {
      const git = this.getGit(repoPath);

      if (Array.isArray(files)) {
        await git.add(files);
      } else {
        await git.add(files);
      }
    } catch (error) {
      throw new Error(`Failed to add files: ${error.message}`);
    }
  }

  /**
   * Commit changes
   * @param {string} repoPath - Path to repository
   * @param {string} message - Commit message
   * @param {Object} options - Additional options {name, email}
   * @returns {Promise<Object>} - {hash, message}
   */
  async commit(repoPath, message, options = {}) {
    try {
      const git = this.getGit(repoPath);

      // Configure user if provided
      const userName = options.name || this.defaultUser.name;
      const userEmail = options.email || this.defaultUser.email;

      await git.addConfig('user.name', userName);
      await git.addConfig('user.email', userEmail);

      // Commit
      const result = await git.commit(message);

      return {
        hash: result.commit,
        message: message,
        summary: result.summary
      };
    } catch (error) {
      throw new Error(`Failed to commit: ${error.message}`);
    }
  }

  /**
   * Push changes to remote
   * @param {string} repoPath - Path to repository
   * @param {string} token - GitHub token for authentication
   * @param {string} branch - Branch to push (default: current)
   * @returns {Promise<Object>} - Push result
   */
  async push(repoPath, token, branch = null) {
    try {
      const git = this.getGit(repoPath);

      // Get current branch if not specified
      if (!branch) {
        const status = await git.status();
        branch = status.current;
      }

      // Get remote URL
      const remotes = await git.getRemotes(true);
      if (remotes.length === 0) {
        throw new Error('No remote configured');
      }

      const originUrl = remotes[0].refs.push || remotes[0].refs.fetch;

      // Inject token into URL for authentication
      const urlWithAuth = originUrl.replace(
        'https://',
        `https://${token}@`
      );

      // Update remote URL temporarily
      await git.remote(['set-url', 'origin', urlWithAuth]);

      // Push
      const result = await git.push('origin', branch);

      // Restore original URL (without token)
      const originalUrl = originUrl.replace(/https:\/\/.*@/, 'https://');
      await git.remote(['set-url', 'origin', originalUrl]);

      return {
        success: true,
        branch: branch,
        message: 'Pushed successfully'
      };
    } catch (error) {
      throw new Error(`Failed to push: ${error.message}`);
    }
  }

  /**
   * Get commit log
   * @param {string} repoPath - Path to repository
   * @param {number} maxCount - Maximum number of commits
   * @returns {Promise<Array>} - Array of commit objects
   */
  async getLog(repoPath, maxCount = 10) {
    try {
      const git = this.getGit(repoPath);
      const log = await git.log({ maxCount });

      return log.all.map(commit => ({
        hash: commit.hash.substring(0, 7),
        message: commit.message,
        author: commit.author_name,
        date: commit.date
      }));
    } catch (error) {
      throw new Error(`Failed to get log: ${error.message}`);
    }
  }

  /**
   * Pull changes from remote
   * @param {string} repoPath - Path to repository
   * @param {string} token - GitHub token for authentication
   * @returns {Promise<Object>} - Pull result
   */
  async pull(repoPath, token) {
    try {
      const git = this.getGit(repoPath);

      // Get remote URL
      const remotes = await git.getRemotes(true);
      if (remotes.length === 0) {
        throw new Error('No remote configured');
      }

      const originUrl = remotes[0].refs.fetch;

      // Inject token into URL
      const urlWithAuth = originUrl.replace(
        'https://',
        `https://${token}@`
      );

      // Update remote URL temporarily
      await git.remote(['set-url', 'origin', urlWithAuth]);

      // Pull
      const result = await git.pull();

      // Restore original URL
      const originalUrl = originUrl.replace(/https:\/\/.*@/, 'https://');
      await git.remote(['set-url', 'origin', originalUrl]);

      return {
        success: true,
        files: result.files || [],
        summary: result.summary || {}
      };
    } catch (error) {
      throw new Error(`Failed to pull: ${error.message}`);
    }
  }

  /**
   * Get branch information
   * @param {string} repoPath - Path to repository
   * @returns {Promise<Object>} - {current, all, remote}
   */
  async getBranches(repoPath) {
    try {
      const git = this.getGit(repoPath);
      const branches = await git.branch();

      return {
        current: branches.current,
        all: branches.all,
        branches: branches.branches
      };
    } catch (error) {
      throw new Error(`Failed to get branches: ${error.message}`);
    }
  }

  /**
   * Get remote information
   * @param {string} repoPath - Path to repository
   * @returns {Promise<Array>} - Array of remotes
   */
  async getRemotes(repoPath) {
    try {
      const git = this.getGit(repoPath);
      const remotes = await git.getRemotes(true);

      return remotes.map(remote => ({
        name: remote.name,
        fetch: remote.refs.fetch,
        push: remote.refs.push
      }));
    } catch (error) {
      throw new Error(`Failed to get remotes: ${error.message}`);
    }
  }

  /**
   * Check if repository has uncommitted changes
   * @param {string} repoPath - Path to repository
   * @returns {Promise<boolean>} - True if there are changes
   */
  async hasChanges(repoPath) {
    try {
      const status = await this.getStatus(repoPath);
      return !status.isClean;
    } catch (error) {
      throw new Error(`Failed to check for changes: ${error.message}`);
    }
  }
}

module.exports = GitOperations;
