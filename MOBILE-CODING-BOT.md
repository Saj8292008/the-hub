# Mobile Coding Bot Setup Guide

Code from anywhere using Telegram! This bot connects to your GitHub repositories and uses Claude AI to help you edit code directly from your phone.

## Features

- 📂 Browse and clone your GitHub repositories
- 📄 Read file contents with syntax highlighting
- ✏️ Edit files using Claude AI - just describe what you want
- ➕ Create new files with AI assistance
- 💾 Commit and push changes directly to GitHub
- 📊 Check git status and view diffs
- ❓ Ask questions about your codebase
- 🔧 Run bash commands safely

## Prerequisites

1. **GitHub Personal Access Token**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo` (all), `user`
   - Copy the token

2. **Anthropic API Key** (for Claude AI)
   - Sign up at https://console.anthropic.com
   - Create an API key
   - Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

3. **Telegram Bot Token** (optional - create separate bot)
   - Message [@BotFather](https://t.me/BotFather) on Telegram
   - Send `/newbot` and follow instructions
   - Copy the bot token
   - Add to `.env`: `TELEGRAM_MOBILE_BOT_TOKEN=...`
   - If not set, will use `TELEGRAM_BOT_TOKEN`

## Installation

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```bash
   # Required
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   GITHUB_TOKEN=ghp_your-token-here  # Optional fallback

   # Optional - create separate bot
   TELEGRAM_MOBILE_BOT_TOKEN=your-bot-token

   # Optional - defaults are fine
   MOBILE_CODING_REPOS_DIR=/Users/sydneyjackson/mobile-coding-repos
   CLAUDE_MODEL=claude-sonnet-4-5-20250929
   MAX_FILE_SIZE=1048576
   ```

3. Start the bot:
   ```bash
   npm run mobile
   ```

## Usage

### Initial Setup

1. Start a chat with your bot on Telegram
2. Send `/start` to see the welcome message
3. Configure your GitHub token:
   ```
   /setup ghp_your_github_token_here
   ```

### Basic Workflow

1. **List your repositories:**
   ```
   /repos
   ```

2. **Open a repository:**
   ```
   /open my-repo
   ```
   Or for repos from other users:
   ```
   /open username/repo-name
   ```

3. **Browse files:**
   ```
   /files
   /files src
   ```

4. **Read a file:**
   ```
   /read package.json
   /read src/index.js
   ```

5. **Edit a file with AI:**
   ```
   /edit src/index.js add error handling to the main function
   /edit README.md add installation instructions
   ```

6. **Create a new file:**
   ```
   /add src/utils.js create utility functions for string manipulation
   /add tests/api.test.js create tests for the API endpoints
   ```

7. **Check status:**
   ```
   /status
   ```

8. **Commit and push:**
   ```
   /commit Add new feature and tests
   ```

### Advanced Features

**Ask questions about your code:**
```
/ask What does this repository do?
/ask How is authentication handled?
/ask Where are the API routes defined?
```

**Run commands:**
```
/run npm test
/run git log --oneline -5
/run ls -la src/
```

## All Commands

| Command | Description |
|---------|-------------|
| `/start` | Show welcome message |
| `/setup <token>` | Configure GitHub token |
| `/repos` | List your repositories |
| `/open <repo>` | Clone and open a repository |
| `/files [dir]` | List files in directory |
| `/read <file>` | Show file contents |
| `/edit <file> <instructions>` | Edit file with Claude AI |
| `/add <file> <instructions>` | Create new file with Claude AI |
| `/status` | Show git status |
| `/commit <message>` | Commit and push changes |
| `/ask <question>` | Ask Claude about codebase |
| `/run <command>` | Run bash command |

## Security Features

### Path Protection
- All file operations are sandboxed to the repository directory
- Cannot access `.env`, `.git`, or system files
- Blocks directory traversal attempts (`../`)

### Command Allowlist
Only safe commands are allowed:
- ✅ Allowed: `ls`, `git`, `npm`, `node`, `python`, `cat`, `grep`, etc.
- ❌ Blocked: `rm`, `sudo`, `curl | bash`, and other dangerous operations

### Token Security
- GitHub tokens are stored per-user in encrypted form
- Tokens are never logged or exposed
- Temporary token injection for git operations

### Rate Limiting
- Claude API: 20 requests per hour per chat
- Prevents abuse and controls costs

## Tips

1. **Context Matters**: Use `/read` on important files before using `/edit` or `/ask`. Claude uses recently read files as context.

2. **File Size Limit**: Files larger than 1MB cannot be read or edited through the bot.

3. **Binary Files**: Binary files (images, PDFs, etc.) are automatically skipped.

4. **Command Timeout**: Commands via `/run` have a 10-second timeout.

5. **Commit Often**: Make small, frequent commits rather than large changes.

## Troubleshooting

**Bot not responding:**
- Check if the bot is running: `npm run mobile`
- Verify Telegram token is correct
- Check console for errors

**"No GitHub token configured":**
- Run `/setup <your-github-token>`
- Or set `GITHUB_TOKEN` in `.env`

**"Claude AI is not configured":**
- Set `ANTHROPIC_API_KEY` in `.env`
- Restart the bot

**Clone fails:**
- Check GitHub token has `repo` scope
- Verify repository name is correct
- Check network connection

**Rate limit exceeded:**
- Wait for the rate limit window to reset (shown in error message)
- Free tier: 20 Claude API requests per hour

## Architecture

```
src/bot/mobile-coding.js          # Main bot file
src/services/coding/
  ├── security.js                  # Path sanitization & validation
  ├── session-manager.js           # Per-chat state management
  ├── github-client.js             # GitHub API integration
  ├── claude-client.js             # Anthropic SDK wrapper
  ├── file-operations.js           # Safe file operations
  └── git-operations.js            # Git commands via simple-git
src/db/codingSessionsQueries.js   # Database persistence
```

## Development

**Run in development mode:**
```bash
NODE_ENV=development npm run mobile
```

**View session stats:**
Sessions are managed in-memory and automatically cleaned up after 1 hour of inactivity.

**Database (Optional):**
The bot works without a database, but you can create the `coding_sessions` table in Supabase for persistence:

```sql
CREATE TABLE coding_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id BIGINT NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id),
  active_repo VARCHAR(500),
  repo_name VARCHAR(200),
  github_token_encrypted TEXT,
  preferences JSONB DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Support

For issues or questions:
- Check console logs for detailed error messages
- Verify all required environment variables are set
- Ensure GitHub token has correct permissions

## License

Part of The Hub project. See main README for license information.
