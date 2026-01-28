const path = require('path');
const os = require('os');

/**
 * Security module for mobile coding bot
 * Prevents directory traversal, command injection, and other security issues
 */

/**
 * Sanitize a file path to prevent directory traversal
 * @param {string} filePath - The path to sanitize
 * @param {string} repoRoot - The repository root directory
 * @returns {string|null} - Sanitized path or null if invalid
 */
function sanitizePath(filePath, repoRoot) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // Remove any null bytes
  if (filePath.includes('\0')) {
    return null;
  }

  // Block absolute paths (except when repoRoot is provided and path starts with it)
  if (path.isAbsolute(filePath) && !filePath.startsWith(repoRoot || '/impossible')) {
    return null;
  }

  // Resolve the path relative to repo root
  const resolved = repoRoot
    ? path.resolve(repoRoot, filePath)
    : path.resolve(filePath);

  // If repoRoot is provided, ensure the resolved path is within it
  if (repoRoot) {
    const relative = path.relative(repoRoot, resolved);

    // If the relative path starts with .. or is absolute, it's outside the repo
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return null;
    }
  }

  // Block access to sensitive directories/files
  const blockedPatterns = [
    /\/\.git\//,
    /\/\.env/,
    /\/\.ssh\//,
    /\/\.aws\//,
    /\/etc\/passwd/,
    /\/etc\/shadow/,
    /\/proc\//,
    /\/sys\//,
    /\/var\/log/,
    /^\.env$/,
    /^\.git$/,
    /^\.ssh$/
  ];

  const pathLower = resolved.toLowerCase();
  for (const pattern of blockedPatterns) {
    if (pattern.test(pathLower) || pattern.test(filePath.toLowerCase())) {
      return null;
    }
  }

  return resolved;
}

/**
 * Validate if a path is within the repository directory
 * @param {string} targetPath - The path to validate
 * @param {string} repoRoot - The repository root directory
 * @returns {boolean} - True if path is within repo
 */
function isWithinRepoDir(targetPath, repoRoot) {
  if (!targetPath || !repoRoot) {
    return false;
  }

  const resolved = path.resolve(targetPath);
  const repoResolved = path.resolve(repoRoot);
  const relative = path.relative(repoResolved, resolved);

  return !relative.startsWith('..') && !path.isAbsolute(relative);
}

/**
 * Validate a bash command against an allowlist
 * @param {string} command - The command to validate
 * @returns {boolean} - True if command is safe
 */
function validateCommand(command) {
  if (!command || typeof command !== 'string') {
    return false;
  }

  // Remove leading/trailing whitespace
  const trimmed = command.trim();

  // Block dangerous patterns
  const dangerousPatterns = [
    /rm\s+-rf\s+\//,           // rm -rf /
    /sudo/,                     // sudo commands
    /su\s/,                     // su commands
    /eval\s/,                   // eval
    /exec\s/,                   // exec
    /curl.*\|\s*bash/,          // curl | bash
    /wget.*\|\s*bash/,          // wget | bash
    />\s*\/dev\//,              // Writing to devices
    /dd\s+if=/,                 // dd commands
    /mkfs/,                     // filesystem formatting
    /fdisk/,                    // disk partitioning
    /:\(\)\{.*\}:/,             // fork bomb
    /\/etc\/passwd/,            // password file
    /\/etc\/shadow/,            // shadow file
    /shutdown/,                 // shutdown
    /reboot/,                   // reboot
    /init\s+[0-6]/,             // init runlevel
    /systemctl/,                // systemctl
    /service\s/,                // service management
    /chmod.*777/,               // overly permissive chmod
    /;\s*rm/,                   // chained rm
    /&&\s*rm/,                  // chained rm
    /\|\s*rm/,                  // piped rm
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }

  // Extract the base command (first word)
  const baseCommand = trimmed.split(/\s+/)[0];

  // Allowlist of safe commands
  const allowedCommands = [
    'ls', 'pwd', 'cat', 'head', 'tail',
    'grep', 'find', 'tree', 'wc', 'echo',
    'git', 'node', 'npm', 'yarn', 'pnpm',
    'python', 'python3', 'pip', 'pip3',
    'ruby', 'gem', 'go', 'cargo', 'rustc',
    'java', 'javac', 'mvn', 'gradle',
    'make', 'cmake', 'gcc', 'g++',
    'docker', 'docker-compose',
    'which', 'whoami', 'date', 'uptime',
    'env', 'printenv', 'uname'
  ];

  // Check if base command is in allowlist
  if (!allowedCommands.includes(baseCommand)) {
    return false;
  }

  // Additional checks for git commands
  if (baseCommand === 'git') {
    const gitSubcommands = trimmed.split(/\s+/).slice(1);
    const dangerousGitOps = ['push', 'force', '--force', '-f', 'reset', '--hard', 'clean', '-f'];

    // Allow most git operations but warn about dangerous ones
    // (This is informational - the function still returns true)
    for (const dangerous of dangerousGitOps) {
      if (gitSubcommands.includes(dangerous)) {
        console.warn(`⚠️ Potentially dangerous git operation: ${trimmed}`);
        break;
      }
    }
  }

  return true;
}

/**
 * Sanitize a filename to remove special characters
 * @param {string} fileName - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
function sanitizeFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }

  // Remove path separators and special characters
  return fileName
    .replace(/[\/\\]/g, '') // Remove slashes
    .replace(/\.\./g, '')   // Remove ..
    .replace(/[<>:"|?*\x00-\x1F]/g, '') // Remove special chars
    .trim();
}

/**
 * Get the base directory for mobile coding repos
 * @returns {string} - Base directory path
 */
function getMobileCodingBaseDir() {
  return process.env.MOBILE_CODING_REPOS_DIR ||
         path.join(os.homedir(), 'mobile-coding-repos');
}

/**
 * Get the repo directory for a specific chat
 * @param {number|string} chatId - The Telegram chat ID
 * @param {string} repoName - The repository name
 * @returns {string} - Full path to repo directory
 */
function getRepoDirectory(chatId, repoName) {
  const baseDir = getMobileCodingBaseDir();
  const sanitizedRepoName = sanitizeFileName(repoName);
  return path.join(baseDir, String(chatId), sanitizedRepoName);
}

module.exports = {
  sanitizePath,
  isWithinRepoDir,
  validateCommand,
  sanitizeFileName,
  getMobileCodingBaseDir,
  getRepoDirectory
};
