const fs = require('fs').promises;
const path = require('path');
const { sanitizePath, isWithinRepoDir } = require('./security');

/**
 * File operations module with safety checks
 */

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 1048576; // 1MB default

// Binary file extensions to skip
const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.tar', '.gz', '.bz2', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin',
  '.mp3', '.mp4', '.avi', '.mov', '.mkv', '.wav',
  '.woff', '.woff2', '.ttf', '.eot', '.otf'
]);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
  '__pycache__',
  'venv',
  '.venv',
  'vendor'
]);

/**
 * Check if a file is binary based on extension
 * @param {string} filePath - Path to file
 * @returns {boolean} - True if file is likely binary
 */
function isBinaryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

/**
 * List files in a directory
 * @param {string} repoPath - Root path of repository
 * @param {string} subdir - Subdirectory to list (default: '.')
 * @param {number} maxDepth - Maximum directory depth (default: 3)
 * @returns {Promise<Array>} - Array of file/directory objects
 */
async function listFiles(repoPath, subdir = '.', maxDepth = 3) {
  const targetPath = sanitizePath(path.join(repoPath, subdir), repoPath);

  if (!targetPath || !isWithinRepoDir(targetPath, repoPath)) {
    throw new Error('Invalid path or outside repository');
  }

  try {
    const entries = await fs.readdir(targetPath, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
      // Skip hidden files and blocked directories
      if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(targetPath, entry.name);
      const relativePath = path.relative(repoPath, fullPath);

      if (entry.isDirectory()) {
        result.push({
          name: entry.name,
          path: relativePath,
          type: 'directory'
        });
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        result.push({
          name: entry.name,
          path: relativePath,
          type: 'file',
          size: stats.size,
          binary: isBinaryFile(entry.name)
        });
      }
    }

    // Sort: directories first, then files alphabetically
    result.sort((a, b) => {
      if (a.type === b.type) {
        return a.name.localeCompare(b.name);
      }
      return a.type === 'directory' ? -1 : 1;
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

/**
 * Read a file from the repository
 * @param {string} repoPath - Root path of repository
 * @param {string} filePath - Relative path to file
 * @returns {Promise<string>} - File content
 */
async function readFile(repoPath, filePath) {
  const targetPath = sanitizePath(path.join(repoPath, filePath), repoPath);

  if (!targetPath || !isWithinRepoDir(targetPath, repoPath)) {
    throw new Error('Invalid file path or outside repository');
  }

  // Check if file is binary
  if (isBinaryFile(targetPath)) {
    throw new Error('Cannot read binary files');
  }

  try {
    // Check file size
    const stats = await fs.stat(targetPath);

    if (stats.size > MAX_FILE_SIZE) {
      throw new Error(`File too large (${Math.round(stats.size / 1024)}KB). Max size: ${Math.round(MAX_FILE_SIZE / 1024)}KB`);
    }

    if (!stats.isFile()) {
      throw new Error('Path is not a file');
    }

    const content = await fs.readFile(targetPath, 'utf8');
    return content;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    }
    throw new Error(`Failed to read file: ${error.message}`);
  }
}

/**
 * Write content to a file
 * @param {string} repoPath - Root path of repository
 * @param {string} filePath - Relative path to file
 * @param {string} content - Content to write
 * @returns {Promise<void>}
 */
async function writeFile(repoPath, filePath, content) {
  const targetPath = sanitizePath(path.join(repoPath, filePath), repoPath);

  if (!targetPath || !isWithinRepoDir(targetPath, repoPath)) {
    throw new Error('Invalid file path or outside repository');
  }

  // Block writing to certain files
  const fileName = path.basename(targetPath).toLowerCase();
  if (fileName === '.env' || fileName === '.git' || fileName.startsWith('.env.')) {
    throw new Error('Cannot write to sensitive files (.env, .git)');
  }

  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(targetPath);
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(targetPath, content, 'utf8');
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`);
  }
}

/**
 * Get a file tree representation
 * @param {string} repoPath - Root path of repository
 * @param {number} maxDepth - Maximum depth to traverse
 * @returns {Promise<string>} - Tree representation as string
 */
async function getFileTree(repoPath, maxDepth = 3) {
  const tree = [];

  async function buildTree(currentPath, depth, prefix = '') {
    if (depth > maxDepth) return;

    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        // Skip hidden and blocked
        if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) {
          continue;
        }

        const isLast = i === entries.length - 1;
        const connector = isLast ? '└── ' : '├── ';
        const relativePath = path.relative(repoPath, path.join(currentPath, entry.name));

        if (entry.isDirectory()) {
          tree.push(`${prefix}${connector}${entry.name}/`);

          const newPrefix = prefix + (isLast ? '    ' : '│   ');
          await buildTree(
            path.join(currentPath, entry.name),
            depth + 1,
            newPrefix
          );
        } else {
          tree.push(`${prefix}${connector}${entry.name}`);
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  tree.push(path.basename(repoPath) + '/');
  await buildTree(repoPath, 1);

  return tree.join('\n');
}

/**
 * Check if a file exists
 * @param {string} repoPath - Root path of repository
 * @param {string} filePath - Relative path to file
 * @returns {Promise<boolean>} - True if file exists
 */
async function fileExists(repoPath, filePath) {
  const targetPath = sanitizePath(path.join(repoPath, filePath), repoPath);

  if (!targetPath || !isWithinRepoDir(targetPath, repoPath)) {
    return false;
  }

  try {
    const stats = await fs.stat(targetPath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * Get file information
 * @param {string} repoPath - Root path of repository
 * @param {string} filePath - Relative path to file
 * @returns {Promise<Object>} - File info {size, modified, binary}
 */
async function getFileInfo(repoPath, filePath) {
  const targetPath = sanitizePath(path.join(repoPath, filePath), repoPath);

  if (!targetPath || !isWithinRepoDir(targetPath, repoPath)) {
    throw new Error('Invalid file path');
  }

  try {
    const stats = await fs.stat(targetPath);

    return {
      size: stats.size,
      modified: stats.mtime,
      binary: isBinaryFile(targetPath),
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

module.exports = {
  listFiles,
  readFile,
  writeFile,
  getFileTree,
  fileExists,
  getFileInfo,
  isBinaryFile
};
