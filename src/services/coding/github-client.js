const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

/**
 * GitHub Client for repository operations
 */
class GitHubClient {
  constructor() {
    this.apiBase = 'https://api.github.com';
  }

  /**
   * Validate a GitHub token
   * @param {string} token - GitHub personal access token
   * @returns {Promise<Object>} - {valid, user, scopes}
   */
  async validateToken(token) {
    try {
      const response = await fetch(`${this.apiBase}/user`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (response.ok) {
        const user = await response.json();
        const scopes = response.headers.get('x-oauth-scopes') || '';

        return {
          valid: true,
          user: user.login,
          name: user.name,
          scopes: scopes.split(',').map(s => s.trim())
        };
      }

      return { valid: false, error: `Invalid token: ${response.status}` };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * List user's repositories
   * @param {string} token - GitHub personal access token
   * @param {number} perPage - Number of repos per page (max 100)
   * @returns {Promise<Array>} - Array of {name, fullName, description, private, cloneUrl}
   */
  async listRepos(token, perPage = 50) {
    try {
      const response = await fetch(`${this.apiBase}/user/repos?per_page=${perPage}&sort=updated`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repos = await response.json();

      return repos.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        owner: repo.owner.login,
        description: repo.description || 'No description',
        private: repo.private,
        cloneUrl: repo.clone_url,
        htmlUrl: repo.html_url,
        defaultBranch: repo.default_branch,
        language: repo.language,
        updatedAt: repo.updated_at
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to list repositories: ${error.message}`);
    }
  }

  /**
   * Get repository information
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {string} token - GitHub personal access token
   * @returns {Promise<Object>} - Repository information
   */
  async getRepoInfo(owner, repo, token) {
    try {
      const response = await fetch(`${this.apiBase}/repos/${owner}/${repo}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const repoData = await response.json();

      return {
        name: repoData.name,
        fullName: repoData.full_name,
        owner: repoData.owner.login,
        description: repoData.description,
        private: repoData.private,
        cloneUrl: repoData.clone_url,
        defaultBranch: repoData.default_branch,
        language: repoData.language
      };
    } catch (error) {
      console.error('GitHub API error:', error);
      throw new Error(`Failed to get repo info: ${error.message}`);
    }
  }

  /**
   * Clone a repository
   * @param {string} cloneUrl - Git clone URL (https)
   * @param {string} token - GitHub personal access token
   * @param {string} destPath - Destination directory path
   * @returns {Promise<Object>} - {success, path, error}
   */
  async cloneRepo(cloneUrl, token, destPath) {
    try {
      // Ensure parent directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Check if repo already exists
      try {
        await fs.access(path.join(destPath, '.git'));
        return {
          success: true,
          path: destPath,
          message: 'Repository already cloned'
        };
      } catch {
        // Directory doesn't exist, proceed with clone
      }

      // Inject token into clone URL for authentication
      const urlWithAuth = cloneUrl.replace(
        'https://',
        `https://${token}@`
      );

      // Clone with progress suppression to avoid output overflow
      const cloneCommand = `git clone --quiet "${urlWithAuth}" "${destPath}"`;

      await execAsync(cloneCommand, {
        timeout: 60000, // 60 second timeout
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });

      // Remove token from git config for security
      try {
        await execAsync(`git -C "${destPath}" config --unset credential.helper`);
      } catch {
        // Ignore errors
      }

      return {
        success: true,
        path: destPath,
        message: 'Repository cloned successfully'
      };
    } catch (error) {
      console.error('Clone error:', error);

      // Clean up failed clone
      try {
        await fs.rm(destPath, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }

      return {
        success: false,
        error: error.message || 'Clone failed'
      };
    }
  }

  /**
   * Pull latest changes from remote
   * @param {string} repoPath - Path to repository
   * @param {string} token - GitHub personal access token
   * @returns {Promise<Object>} - {success, message}
   */
  async pullRepo(repoPath, token) {
    try {
      // Get remote URL
      const { stdout: remoteUrl } = await execAsync(
        `git -C "${repoPath}" config --get remote.origin.url`
      );

      // Inject token for authentication
      const urlWithAuth = remoteUrl.trim().replace(
        'https://',
        `https://${token}@`
      );

      // Update remote URL temporarily
      await execAsync(
        `git -C "${repoPath}" remote set-url origin "${urlWithAuth}"`
      );

      // Pull changes
      const { stdout } = await execAsync(
        `git -C "${repoPath}" pull --quiet`
      );

      // Restore original URL (without token)
      const originalUrl = remoteUrl.trim().replace(/https:\/\/.*@/, 'https://');
      await execAsync(
        `git -C "${repoPath}" remote set-url origin "${originalUrl}"`
      );

      return {
        success: true,
        message: stdout.trim() || 'Already up to date'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if a repository is already cloned
   * @param {string} repoPath - Path to check
   * @returns {Promise<boolean>} - True if repo exists
   */
  async isRepoCloned(repoPath) {
    try {
      await fs.access(path.join(repoPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch name
   * @param {string} repoPath - Path to repository
   * @returns {Promise<string>} - Branch name
   */
  async getCurrentBranch(repoPath) {
    try {
      const { stdout } = await execAsync(
        `git -C "${repoPath}" rev-parse --abbrev-ref HEAD`
      );
      return stdout.trim();
    } catch (error) {
      throw new Error(`Failed to get current branch: ${error.message}`);
    }
  }
}

module.exports = GitHubClient;
