require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { exec } = require('child_process');
const { promisify } = require('util');

const SessionManager = require('../services/coding/session-manager');
const GitHubClient = require('../services/coding/github-client');
const ClaudeClient = require('../services/coding/claude-client');
const FileOperations = require('../services/coding/file-operations');
const GitOperations = require('../services/coding/git-operations');
const { validateCommand, getRepoDirectory } = require('../services/coding/security');

const execAsync = promisify(exec);

// Bot token (use TELEGRAM_MOBILE_BOT_TOKEN or fall back to TELEGRAM_BOT_TOKEN)
const token = process.env.TELEGRAM_MOBILE_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN or TELEGRAM_MOBILE_BOT_TOKEN in .env');
  process.exit(1);
}

// Initialize bot
const bot = new TelegramBot(token, { polling: true });

// Initialize services
const sessionManager = new SessionManager();
const githubClient = new GitHubClient();
const claudeClient = new ClaudeClient();
const fileOps = FileOperations;
const gitOps = new GitOperations();

// Helper to split long messages (Telegram has 4096 char limit)
async function sendMessage(chatId, text, options = {}) {
  const maxLength = 4000;

  if (text.length <= maxLength) {
    try {
      return await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      });
    } catch (error) {
      // Fallback without markdown if formatting fails
      return await bot.sendMessage(chatId, text, {
        disable_web_page_preview: true
      });
    }
  }

  // Split into chunks
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLength) {
    chunks.push(text.slice(i, i + maxLength));
  }

  for (const chunk of chunks) {
    try {
      await bot.sendMessage(chatId, chunk, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        ...options
      });
    } catch (error) {
      await bot.sendMessage(chatId, chunk, { disable_web_page_preview: true });
    }
  }
}

// Helper to check rate limiting
function checkRateLimit(chatId) {
  const rateCheck = sessionManager.checkRateLimit(chatId, 20);

  if (!rateCheck.allowed) {
    throw new Error(`⏱️ Rate limit exceeded. Try again in ${rateCheck.resetIn} minutes.`);
  }

  return rateCheck;
}

// Command regex helper
const commandRegex = (command) => new RegExp(`^/${command}(?:@\\w+)?(?:\\s+(.*))?$`, 'i');

// ============================================================================
// COMMAND: /start
// ============================================================================
bot.onText(commandRegex('start'), async (msg) => {
  const chatId = msg.chat.id;

  const welcomeText = `👨‍💻 *Mobile Coding Bot*

Code from anywhere using Telegram! This bot connects to your GitHub repos and uses Claude AI to help you edit code.

*Quick Start:*
1️⃣ /setup <github_token> - Configure your GitHub token
2️⃣ /repos - List your repositories
3️⃣ /open <repo> - Open a repository
4️⃣ /files - Browse files
5️⃣ /read <file> - Read a file
6️⃣ /edit <file> <instructions> - Edit with AI
7️⃣ /commit <message> - Commit & push changes

*All Commands:*
📂 /repos - List GitHub repositories
🔓 /open <repo> - Open a repository
📋 /files [dir] - List files in directory
📖 /read <file> - Show file contents
✏️ /edit <file> <instructions> - Edit file with Claude
➕ /add <file> <instructions> - Create new file
💾 /commit <message> - Commit and push
📊 /status - Show git status
❓ /ask <question> - Ask about codebase
🔧 /run <command> - Run bash command
⚙️ /setup <token> - Set GitHub token

Get started by running /setup with your GitHub personal access token!`;

  await sendMessage(chatId, welcomeText);
});

// ============================================================================
// COMMAND: /setup <github_token>
// ============================================================================
bot.onText(commandRegex('setup'), async (msg, match) => {
  const chatId = msg.chat.id;
  const token = (match?.[1] || '').trim();

  if (!token) {
    return sendMessage(chatId, `⚙️ *GitHub Setup*

You need a GitHub Personal Access Token to use this bot.

*How to get a token:*
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: \`repo\` (all), \`user\`
4. Copy the token

Then run: \`/setup <your_token>\`

Example: \`/setup ghp_abc123...\``);
  }

  try {
    await sendMessage(chatId, '🔄 Validating token...');

    // Validate token
    const validation = await githubClient.validateToken(token);

    if (!validation.valid) {
      return sendMessage(chatId, `❌ Invalid token: ${validation.error}\n\nPlease check your token and try again.`);
    }

    // Store token in session
    sessionManager.setGithubToken(chatId, token);

    await sendMessage(chatId, `✅ *Token configured successfully!*

Connected as: @${validation.user}
Name: ${validation.name || 'Not set'}

You can now use /repos to list your repositories.`);
  } catch (error) {
    console.error('Setup error:', error);
    await sendMessage(chatId, `❌ Setup failed: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /repos
// ============================================================================
bot.onText(commandRegex('repos'), async (msg) => {
  const chatId = msg.chat.id;

  try {
    const token = sessionManager.getGithubToken(chatId);

    if (!token) {
      return sendMessage(chatId, '❌ No GitHub token configured. Run /setup <token> first.');
    }

    await sendMessage(chatId, '🔄 Fetching repositories...');

    const repos = await githubClient.listRepos(token);

    if (repos.length === 0) {
      return sendMessage(chatId, '📂 No repositories found.');
    }

    // Check which repos are already cloned
    const repoList = [];
    for (let i = 0; i < Math.min(repos.length, 20); i++) {
      const repo = repos[i];
      const repoPath = getRepoDirectory(chatId, repo.name);
      const isCloned = await githubClient.isRepoCloned(repoPath);
      const cloneStatus = isCloned ? '✅' : '⬜';

      repoList.push(`${i + 1}. ${cloneStatus} ${repo.fullName}`);
      if (repo.description && repo.description !== 'No description') {
        repoList.push(`   _${repo.description.slice(0, 60)}_`);
      }
    }

    const message = `📂 *Your Repositories* (${repos.length} total)\n\n${repoList.join('\n')}\n\n✅ = Already cloned\n⬜ = Not cloned\n\nUse /open <repo> to clone and open a repository.`;

    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Repos error:', error);
    await sendMessage(chatId, `❌ Failed to list repos: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /open <repo>
// ============================================================================
bot.onText(commandRegex('open'), async (msg, match) => {
  const chatId = msg.chat.id;
  const repoInput = (match?.[1] || '').trim();

  if (!repoInput) {
    return sendMessage(chatId, '❌ Usage: /open <repo>\n\nExample: /open my-repo\nOr: /open owner/repo');
  }

  try {
    const token = sessionManager.getGithubToken(chatId);

    if (!token) {
      return sendMessage(chatId, '❌ No GitHub token configured. Run /setup <token> first.');
    }

    await sendMessage(chatId, '🔄 Opening repository...');

    // Parse repo name (handle "owner/repo" or just "repo")
    let owner, repoName;
    if (repoInput.includes('/')) {
      [owner, repoName] = repoInput.split('/');
    } else {
      // Get user's repos and find matching name
      const repos = await githubClient.listRepos(token);
      const found = repos.find(r => r.name.toLowerCase() === repoInput.toLowerCase());

      if (!found) {
        return sendMessage(chatId, `❌ Repository "${repoInput}" not found in your account.\n\nUse /repos to see available repositories.`);
      }

      owner = found.owner;
      repoName = found.name;
    }

    // Get repo info
    const repoInfo = await githubClient.getRepoInfo(owner, repoName, token);
    const repoPath = getRepoDirectory(chatId, repoInfo.name);

    // Check if already cloned
    const isCloned = await githubClient.isRepoCloned(repoPath);

    if (!isCloned) {
      await sendMessage(chatId, `📥 Cloning ${repoInfo.fullName}...\n\nThis may take a moment...`);

      const cloneResult = await githubClient.cloneRepo(repoInfo.cloneUrl, token, repoPath);

      if (!cloneResult.success) {
        return sendMessage(chatId, `❌ Clone failed: ${cloneResult.error}`);
      }
    }

    // Set as active repo
    sessionManager.setActiveRepo(chatId, repoPath, repoInfo.name, owner);

    // Get branch info
    const branch = await githubClient.getCurrentBranch(repoPath);

    await sendMessage(chatId, `✅ *Opened: ${repoInfo.fullName}*

📂 Path: ${repoPath}
🌿 Branch: ${branch}
💻 Language: ${repoInfo.language || 'N/A'}
${repoInfo.description ? `\n📝 ${repoInfo.description}` : ''}

Use /files to browse files or /status to see git status.`);
  } catch (error) {
    console.error('Open error:', error);
    await sendMessage(chatId, `❌ Failed to open repo: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /files [subdir]
// ============================================================================
bot.onText(commandRegex('files'), async (msg, match) => {
  const chatId = msg.chat.id;
  const subdir = (match?.[1] || '').trim() || '.';

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    const files = await fileOps.listFiles(repo.path, subdir);

    if (files.length === 0) {
      return sendMessage(chatId, '📂 Directory is empty.');
    }

    const fileList = files.map(f => {
      if (f.type === 'directory') {
        return `📁 ${f.name}/`;
      } else {
        const sizeKb = Math.round(f.size / 1024);
        const binary = f.binary ? '🔒' : '';
        return `📄 ${f.name} ${binary}${sizeKb > 0 ? ` (${sizeKb}KB)` : ''}`;
      }
    });

    const message = `📂 *${repo.name}/${subdir}*\n\n${fileList.join('\n')}\n\nUse /read <file> to view file contents.`;

    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Files error:', error);
    await sendMessage(chatId, `❌ Failed to list files: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /read <file>
// ============================================================================
bot.onText(commandRegex('read'), async (msg, match) => {
  const chatId = msg.chat.id;
  const filePath = (match?.[1] || '').trim();

  if (!filePath) {
    return sendMessage(chatId, '❌ Usage: /read <file>\n\nExample: /read src/index.js');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    const content = await fileOps.readFile(repo.path, filePath);

    // Add to context for Claude
    sessionManager.addToContext(chatId, filePath, content);

    // Detect file extension for syntax highlighting
    const ext = filePath.split('.').pop();
    const langMap = {
      js: 'javascript', ts: 'typescript', py: 'python',
      java: 'java', go: 'go', rs: 'rust', rb: 'ruby',
      php: 'php', c: 'c', cpp: 'cpp', cs: 'csharp',
      html: 'html', css: 'css', json: 'json', md: 'markdown'
    };
    const lang = langMap[ext] || '';

    const message = `📄 *${filePath}*\n\n\`\`\`${lang}\n${content}\n\`\`\``;

    await sendMessage(chatId, message);
  } catch (error) {
    console.error('Read error:', error);
    await sendMessage(chatId, `❌ Failed to read file: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /edit <file> <instructions>
// ============================================================================
bot.onText(commandRegex('edit'), async (msg, match) => {
  const chatId = msg.chat.id;
  const input = (match?.[1] || '').trim();

  if (!input) {
    return sendMessage(chatId, '❌ Usage: /edit <file> <instructions>\n\nExample: /edit src/index.js add a comment explaining the main function');
  }

  // Parse file path and instructions
  const parts = input.split(/\s+/);
  const filePath = parts[0];
  const instructions = parts.slice(1).join(' ');

  if (!instructions) {
    return sendMessage(chatId, '❌ Please provide edit instructions.\n\nExample: /edit src/index.js add error handling');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    if (!claudeClient.isConfigured()) {
      return sendMessage(chatId, '❌ Claude AI is not configured. Set ANTHROPIC_API_KEY in .env');
    }

    // Check rate limit
    checkRateLimit(chatId);

    await sendMessage(chatId, `🤖 Editing ${filePath} with Claude AI...\n\nThis may take a moment...`);

    // Read current file
    const currentContent = await fileOps.readFile(repo.path, filePath);

    // Get context files
    const context = sessionManager.getContext(chatId, 5);

    // Use Claude to edit
    const updatedContent = await claudeClient.editFile(
      filePath,
      currentContent,
      instructions,
      context
    );

    // Write updated content
    await fileOps.writeFile(repo.path, filePath, updatedContent);

    await sendMessage(chatId, `✅ *File updated: ${filePath}*\n\nChanges have been made. Use /status to see git status or /commit to commit changes.`);
  } catch (error) {
    console.error('Edit error:', error);
    await sendMessage(chatId, `❌ Failed to edit file: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /add <file> <instructions>
// ============================================================================
bot.onText(commandRegex('add'), async (msg, match) => {
  const chatId = msg.chat.id;
  const input = (match?.[1] || '').trim();

  if (!input) {
    return sendMessage(chatId, '❌ Usage: /add <file> <instructions>\n\nExample: /add src/utils.js create utility functions for string manipulation');
  }

  const parts = input.split(/\s+/);
  const filePath = parts[0];
  const instructions = parts.slice(1).join(' ');

  if (!instructions) {
    return sendMessage(chatId, '❌ Please provide creation instructions.');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    if (!claudeClient.isConfigured()) {
      return sendMessage(chatId, '❌ Claude AI is not configured. Set ANTHROPIC_API_KEY in .env');
    }

    // Check rate limit
    checkRateLimit(chatId);

    await sendMessage(chatId, `🤖 Creating ${filePath} with Claude AI...\n\nThis may take a moment...`);

    // Get context files
    const context = sessionManager.getContext(chatId, 5);

    // Use Claude to create file
    const content = await claudeClient.createFile(filePath, instructions, context);

    // Write new file
    await fileOps.writeFile(repo.path, filePath, content);

    // Add to context
    sessionManager.addToContext(chatId, filePath, content);

    await sendMessage(chatId, `✅ *File created: ${filePath}*\n\nUse /read ${filePath} to view or /commit to commit changes.`);
  } catch (error) {
    console.error('Add error:', error);
    await sendMessage(chatId, `❌ Failed to create file: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /status
// ============================================================================
bot.onText(commandRegex('status'), async (msg) => {
  const chatId = msg.chat.id;

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    const status = await gitOps.getStatus(repo.path);

    const statusParts = [
      `📊 *Git Status: ${repo.name}*`,
      `\n🌿 Branch: ${status.branch}`,
    ];

    if (status.ahead > 0) {
      statusParts.push(`⬆️ Ahead by ${status.ahead} commit(s)`);
    }

    if (status.behind > 0) {
      statusParts.push(`⬇️ Behind by ${status.behind} commit(s)`);
    }

    if (status.isClean) {
      statusParts.push('\n✅ Working tree clean - no changes');
    } else {
      statusParts.push('\n📝 *Changes:*');

      if (status.modified.length > 0) {
        statusParts.push(`\nModified: ${status.modified.length}`);
        status.modified.slice(0, 10).forEach(f => statusParts.push(`  • ${f}`));
      }

      if (status.created.length > 0) {
        statusParts.push(`\nCreated: ${status.created.length}`);
        status.created.slice(0, 10).forEach(f => statusParts.push(`  • ${f}`));
      }

      if (status.deleted.length > 0) {
        statusParts.push(`\nDeleted: ${status.deleted.length}`);
        status.deleted.slice(0, 10).forEach(f => statusParts.push(`  • ${f}`));
      }

      statusParts.push('\nUse /commit <message> to commit and push changes.');
    }

    await sendMessage(chatId, statusParts.join('\n'));
  } catch (error) {
    console.error('Status error:', error);
    await sendMessage(chatId, `❌ Failed to get status: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /commit <message>
// ============================================================================
bot.onText(commandRegex('commit'), async (msg, match) => {
  const chatId = msg.chat.id;
  const commitMessage = (match?.[1] || '').trim();

  if (!commitMessage) {
    return sendMessage(chatId, '❌ Usage: /commit <message>\n\nExample: /commit Add new feature');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    const token = sessionManager.getGithubToken(chatId);

    if (!token) {
      return sendMessage(chatId, '❌ No GitHub token configured.');
    }

    await sendMessage(chatId, '🔄 Committing changes...');

    // Check if there are changes
    const hasChanges = await gitOps.hasChanges(repo.path);

    if (!hasChanges) {
      return sendMessage(chatId, '✅ No changes to commit. Working tree is clean.');
    }

    // Add all files
    await gitOps.addFiles(repo.path, '.');

    // Commit
    const commitResult = await gitOps.commit(repo.path, commitMessage);

    await sendMessage(chatId, `✅ Committed: ${commitResult.hash}\n\n"${commitMessage}"\n\n🔄 Pushing to remote...`);

    // Push
    const pushResult = await gitOps.push(repo.path, token);

    await sendMessage(chatId, `✅ *Pushed successfully!*\n\nCommit: ${commitResult.hash}\nBranch: ${pushResult.branch}\n\nYour changes are now on GitHub.`);
  } catch (error) {
    console.error('Commit error:', error);
    await sendMessage(chatId, `❌ Failed to commit/push: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /ask <question>
// ============================================================================
bot.onText(commandRegex('ask'), async (msg, match) => {
  const chatId = msg.chat.id;
  const question = (match?.[1] || '').trim();

  if (!question) {
    return sendMessage(chatId, '❌ Usage: /ask <question>\n\nExample: /ask What does this repo do?\nOr: /ask How is authentication handled?');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.\n\nTip: Use /read to add files to context before asking.');
    }

    if (!claudeClient.isConfigured()) {
      return sendMessage(chatId, '❌ Claude AI is not configured. Set ANTHROPIC_API_KEY in .env');
    }

    // Check rate limit
    checkRateLimit(chatId);

    await sendMessage(chatId, '🤖 Asking Claude...');

    // Get context files
    const context = sessionManager.getContext(chatId);

    if (context.length === 0) {
      await sendMessage(chatId, '💡 Tip: Use /read on key files first to give Claude more context about your codebase.');
    }

    // Ask Claude
    const answer = await claudeClient.answerQuestion(question, context, repo.name);

    await sendMessage(chatId, `🤖 *Claude's Answer:*\n\n${answer}`);
  } catch (error) {
    console.error('Ask error:', error);
    await sendMessage(chatId, `❌ Failed to answer: ${error.message}`);
  }
});

// ============================================================================
// COMMAND: /run <command>
// ============================================================================
bot.onText(commandRegex('run'), async (msg, match) => {
  const chatId = msg.chat.id;
  const command = (match?.[1] || '').trim();

  if (!command) {
    return sendMessage(chatId, '❌ Usage: /run <command>\n\nExample: /run npm test\nOr: /run git log --oneline -5\n\n⚠️ Only safe commands are allowed.');
  }

  try {
    const repo = sessionManager.getActiveRepo(chatId);

    if (!repo) {
      return sendMessage(chatId, '❌ No active repository. Use /open <repo> first.');
    }

    // Validate command
    if (!validateCommand(command)) {
      return sendMessage(chatId, `❌ Command not allowed for security reasons.\n\nAllowed commands: ls, pwd, cat, git, npm, node, python, etc.\n\nBlocked: rm, sudo, and other dangerous operations.`);
    }

    await sendMessage(chatId, `🔄 Running: \`${command}\`...`);

    // Execute command in repo directory
    const { stdout, stderr } = await execAsync(command, {
      cwd: repo.path,
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024 // 1MB buffer
    });

    const output = stdout || stderr || '(No output)';

    await sendMessage(chatId, `✅ *Command output:*\n\n\`\`\`\n${output.slice(0, 3000)}\n\`\`\``);
  } catch (error) {
    console.error('Run error:', error);

    if (error.killed) {
      await sendMessage(chatId, '❌ Command timed out (10 second limit)');
    } else {
      const errorOutput = error.stderr || error.stdout || error.message;
      await sendMessage(chatId, `❌ Command failed:\n\n\`\`\`\n${errorOutput.slice(0, 3000)}\n\`\`\``);
    }
  }
});

// ============================================================================
// Error handling
// ============================================================================
bot.on('polling_error', (error) => {
  console.error('Telegram polling error:', error);
});

bot.on('error', (error) => {
  console.error('Telegram bot error:', error);
});

// ============================================================================
// Startup
// ============================================================================
console.log('🚀 Mobile Coding Bot is running...');
console.log(`📱 Bot ready for commands`);
console.log(`🤖 Claude: ${claudeClient.isConfigured() ? '✅ Configured' : '❌ Not configured'}`);
console.log(`🔐 GitHub token: ${process.env.GITHUB_TOKEN ? '✅ Available' : '⚠️ Not set (users must use /setup)'}`);

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down...');
  sessionManager.destroy();
  bot.stopPolling();
  process.exit(0);
});

module.exports = { bot, sessionManager };
