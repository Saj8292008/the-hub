const SportsExpertChat = require('./chat');
const ContentCreator = require('./content');
const GameAnalyzer = require('./analyzer');
const logger = require('../../utils/logger');

class SportsExpertTelegramBot {
  constructor(bot) {
    this.bot = bot;
    this.chat = new SportsExpertChat();
    this.content = new ContentCreator();
    this.analyzer = new GameAnalyzer();
    this.activeUsers = new Map(); // Track user sessions
    
    this.initializeCommands();
  }

  initializeCommands() {
    // Main expert command
    this.bot.onText(/\/expert(.*)/, async (msg, match) => {
      await this.handleExpertCommand(msg, match[1].trim());
    });

    // Quick commands
    this.bot.onText(/\/games/, async (msg) => {
      await this.handleGamesCommand(msg);
    });

    this.bot.onText(/\/analyze (.+)/, async (msg, match) => {
      await this.handleAnalyzeCommand(msg, match[1]);
    });

    this.bot.onText(/\/hottake (.+)/, async (msg, match) => {
      await this.handleHotTakeCommand(msg, match[1]);
    });

    this.bot.onText(/\/tweet (.+)/, async (msg, match) => {
      await this.handleTweetCommand(msg, match[1]);
    });

    this.bot.onText(/\/podcast (.+)/, async (msg, match) => {
      await this.handlePodcastCommand(msg, match[1]);
    });

    this.bot.onText(/\/smart (.+)/, async (msg, match) => {
      await this.handleSmartCommand(msg, match[1]);
    });

    // Help command
    this.bot.onText(/\/experthelp/, async (msg) => {
      await this.handleHelpCommand(msg);
    });

    logger.info('Sports Expert Telegram bot commands initialized');
  }

  // Main expert command handler
  async handleExpertCommand(msg, query) {
    const chatId = msg.chat.id;

    if (!query) {
      await this.bot.sendMessage(chatId, 
        'Ask me anything about sports! Examples:\n\n' +
        '• /expert What\'s happening in the Lakers game?\n' +
        '• /expert Tell me about tonight\'s games\n' +
        '• /expert Make me sound smart about the Celtics\n' +
        '• /expert Write a tweet about the Super Bowl\n\n' +
        'Or use quick commands like /games, /analyze, /hottake'
      );
      return;
    }

    try {
      // Show typing indicator
      await this.bot.sendChatAction(chatId, 'typing');

      // Process query
      const result = await this.chat.handleQuery(query);

      if (result.success) {
        await this.bot.sendMessage(chatId, result.response, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(chatId, result.response || 'Sorry, I couldn\'t process that request.');
      }
    } catch (error) {
      logger.error('Error handling expert command:', error);
      await this.bot.sendMessage(chatId, '❌ Error processing your request. Please try again.');
    }
  }

  // Show today's games
  async handleGamesCommand(msg) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const summary = await this.analyzer.getTodaysSummary();

      if (summary.total === 0) {
        await this.bot.sendMessage(chatId, 'No games scheduled for today.');
        return;
      }

      let message = `📅 *Today's Games* (${summary.total} total, ${summary.live} live)\n\n`;

      for (const [sport, games] of Object.entries(summary.bySport)) {
        message += `*${sport.toUpperCase()}*\n`;
        
        games.slice(0, 5).forEach(game => {
          const status = game.status === 'live' || game.status === 'in_progress'
            ? `🔴 LIVE: ${game.away_score}-${game.home_score}`
            : `⏰ ${new Date(game.game_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
          
          message += `• ${game.away_team_name} @ ${game.home_team_name}\n  ${status}\n`;
        });
        
        message += '\n';
      }

      message += 'Ask me about any game for expert analysis!';

      await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error handling games command:', error);
      await this.bot.sendMessage(chatId, '❌ Error fetching games.');
    }
  }

  // Analyze specific game
  async handleAnalyzeCommand(msg, query) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const result = await this.chat.handleQuery(`analyze ${query}`);

      if (result.success) {
        await this.bot.sendMessage(chatId, result.response, { parse_mode: 'Markdown' });
      } else {
        await this.bot.sendMessage(chatId, 'Couldn\'t find that game. Try /games to see what\'s on today.');
      }
    } catch (error) {
      logger.error('Error handling analyze command:', error);
      await this.bot.sendMessage(chatId, '❌ Error analyzing game.');
    }
  }

  // Generate hot take
  async handleHotTakeCommand(msg, query) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const result = await this.chat.handleQuery(`hot take ${query}`);

      if (result.success) {
        await this.bot.sendMessage(chatId, result.response);
      } else {
        await this.bot.sendMessage(chatId, 'Couldn\'t generate hot take for that game.');
      }
    } catch (error) {
      logger.error('Error handling hot take command:', error);
      await this.bot.sendMessage(chatId, '❌ Error generating hot take.');
    }
  }

  // Generate tweet
  async handleTweetCommand(msg, query) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const result = await this.chat.handleQuery(`tweet ${query}`);

      if (result.success) {
        await this.bot.sendMessage(chatId, 
          `📱 *Tweet Draft:*\n\n${result.content}\n\n_Copy and paste to post!_`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await this.bot.sendMessage(chatId, 'Couldn\'t generate tweet for that game.');
      }
    } catch (error) {
      logger.error('Error handling tweet command:', error);
      await this.bot.sendMessage(chatId, '❌ Error generating tweet.');
    }
  }

  // Generate podcast script
  async handlePodcastCommand(msg, query) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const result = await this.chat.handleQuery(`podcast ${query}`);

      if (result.success) {
        // Split long messages if needed
        const chunks = this.splitMessage(result.response, 4000);
        
        for (const chunk of chunks) {
          await this.bot.sendMessage(chatId, chunk);
        }
      } else {
        await this.bot.sendMessage(chatId, 'Couldn\'t generate podcast script for that game.');
      }
    } catch (error) {
      logger.error('Error handling podcast command:', error);
      await this.bot.sendMessage(chatId, '❌ Error generating podcast script.');
    }
  }

  // Make user sound smart
  async handleSmartCommand(msg, query) {
    const chatId = msg.chat.id;

    try {
      await this.bot.sendChatAction(chatId, 'typing');

      const result = await this.chat.handleQuery(`smart about ${query}`);

      if (result.success) {
        await this.bot.sendMessage(chatId, 
          `🎓 *Sound Smart About This Game:*\n\n${result.response}`,
          { parse_mode: 'Markdown' }
        );
      } else {
        await this.bot.sendMessage(chatId, 'Couldn\'t find that game.');
      }
    } catch (error) {
      logger.error('Error handling smart command:', error);
      await this.bot.sendMessage(chatId, '❌ Error generating briefing.');
    }
  }

  // Help command
  async handleHelpCommand(msg) {
    const chatId = msg.chat.id;

    const helpText = `
🏀 *Sports Broadcasting Expert Bot*

Transform into a sports analyst instantly!

*Commands:*

/expert [query] - Ask anything
  Example: _/expert What's happening in the Lakers game?_

/games - See today's schedule

/analyze [team/game] - Get expert breakdown
  Example: _/analyze Celtics_

/smart [team/game] - Quick briefing to sound smart
  Example: _/smart Lakers vs Warriors_

/hottake [team/game] - Spicy but smart take
  Example: _/hottake tonight's game_

/tweet [team/game] - Generate social content
  Example: _/tweet Super Bowl_

/podcast [team/game] - Podcast script
  Example: _/podcast Celtics game_

*Natural Language:*
Just type /expert followed by what you want:
• "Tell me about tonight's games"
• "Make me sound smart about the Celtics"
• "Write a tweet about the Lakers"
• "Give me a hot take on this game"

You're your own ESPN analyst! 📊
    `;

    await this.bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
  }

  // Helper: Split long messages
  splitMessage(message, maxLength = 4000) {
    if (message.length <= maxLength) {
      return [message];
    }

    const chunks = [];
    let currentChunk = '';

    const lines = message.split('\n');

    for (const line of lines) {
      if ((currentChunk + line + '\n').length > maxLength) {
        chunks.push(currentChunk.trim());
        currentChunk = line + '\n';
      } else {
        currentChunk += line + '\n';
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  // Send live game updates (can be called from external scheduler)
  async sendGameUpdate(chatId, gameId) {
    try {
      const game = await this.analyzer.getGame(gameId);
      
      if (!game || game.status !== 'live') {
        return;
      }

      const result = await this.chat.handleQuery(`What's happening in game ${gameId}`);

      if (result.success) {
        await this.bot.sendMessage(chatId, 
          `🔴 *LIVE UPDATE*\n\n${result.response}`,
          { parse_mode: 'Markdown' }
        );
      }
    } catch (error) {
      logger.error('Error sending game update:', error);
    }
  }

  // Cleanup
  close() {
    this.chat.close();
    this.content.close();
    this.analyzer.close();
  }
}

module.exports = SportsExpertTelegramBot;
