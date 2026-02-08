/**
 * The Hub Empire Bot
 * Telegram interface for agent management via @thehubempire
 */

const TelegramBot = require('node-telegram-bot-api');
const { empire } = require('./empireController');
const { AGENTS } = require('./definitions');

class EmpireBot {
  constructor(token, channelId) {
    this.bot = new TelegramBot(token, { polling: false });
    this.channelId = channelId; // @thehubempire
  }

  /**
   * Initialize bot with commands
   */
  async init() {
    await empire.init();
    console.log('🏛️ Empire Bot initialized');
  }

  /**
   * Handle command: /empire status
   */
  async handleStatus(chatId) {
    const chart = await empire.getOrgChart();
    await this.bot.sendMessage(chatId, chart, { parse_mode: 'Markdown' });
  }

  /**
   * Handle command: /empire spawn <agent>
   */
  async handleSpawn(chatId, agentId, task = null) {
    try {
      const result = await empire.spawnAgent(agentId, task);
      await this.bot.sendMessage(
        chatId,
        result.success ? result.message : `❌ ${result.message}`
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  /**
   * Handle command: /empire stop <agent>
   */
  async handleStop(chatId, agentId) {
    try {
      const result = await empire.stopAgent(agentId);
      await this.bot.sendMessage(
        chatId,
        result.success ? result.message : `❌ ${result.message}`
      );
    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    }
  }

  /**
   * Handle command: /empire list
   */
  async handleList(chatId) {
    const agents = Object.values(AGENTS);
    let message = '🏛️ **Available Agents:**\\n\\n';
    
    for (const agent of agents) {
      message += `${agent.emoji} **${agent.label}**\\n`;
      message += `   ${agent.title}\\n`;
      message += `   Model: ${agent.model}\\n`;
      message += `   Command: \`/empire spawn ${agent.id}\`\\n\\n`;
    }
    
    await this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  /**
   * Handle command: /empire help
   */
  async handleHelp(chatId) {
    const help = `🏛️ **Empire Commands**

/empire status - Show org chart and agent statuses
/empire list - List all available agents
/empire spawn <agent> - Start an agent
/empire stop <agent> - Stop an agent
/empire report - Get latest reports from all agents

**Available Agents:**
• deal-hunter - Find hot deals
• content-manager - Create social posts
• data-analyst - Analytics reports
• growth-lead - Growth strategies
• dev-agent - Code and deploy

**Examples:**
\`/empire spawn deal-hunter\`
\`/empire spawn content-manager Create 3 Twitter posts\`
\`/empire status\`
`;
    
    await this.bot.sendMessage(chatId, help, { parse_mode: 'Markdown' });
  }

  /**
   * Post to empire channel
   */
  async postToChannel(message, options = {}) {
    try {
      await this.bot.sendMessage(this.channelId, message, {
        parse_mode: 'Markdown',
        ...options
      });
    } catch (error) {
      console.error('Error posting to empire channel:', error);
    }
  }

  /**
   * Post agent report to channel
   */
  async postAgentReport(agentId, report) {
    const agent = AGENTS[agentId];
    if (!agent) return;

    const message = `${agent.emoji} **${agent.label} Report**\\n\\n${report}`;
    await this.postToChannel(message);
    
    // Save to empire controller
    await empire.saveReport(agentId, report);
  }

  /**
   * Parse command from message
   */
  parseCommand(text) {
    const parts = text.trim().split(/\\s+/);
    const command = parts[0];
    const args = parts.slice(1);
    
    return { command, args };
  }

  /**
   * Process incoming message
   */
  async processMessage(message) {
    const chatId = message.chat.id;
    const text = message.text || '';
    
    if (!text.startsWith('/empire')) return;
    
    const { command, args } = this.parseCommand(text.replace('/empire', '').trim());
    
    switch (command) {
      case 'status':
        await this.handleStatus(chatId);
        break;
      
      case 'list':
        await this.handleList(chatId);
        break;
      
      case 'spawn':
        if (args.length === 0) {
          await this.bot.sendMessage(chatId, '❌ Usage: /empire spawn <agent-id> [task]');
        } else {
          const agentId = args[0];
          const task = args.slice(1).join(' ') || null;
          await this.handleSpawn(chatId, agentId, task);
        }
        break;
      
      case 'stop':
        if (args.length === 0) {
          await this.bot.sendMessage(chatId, '❌ Usage: /empire stop <agent-id>');
        } else {
          await this.handleStop(chatId, args[0]);
        }
        break;
      
      case 'help':
      case '':
        await this.handleHelp(chatId);
        break;
      
      default:
        await this.bot.sendMessage(chatId, `❌ Unknown command. Type /empire help`);
    }
  }

  /**
   * Start bot
   */
  async start() {
    await this.init();
    
    // Post startup message
    await this.postToChannel('🏛️ **The Hub Empire is online**\\n\\nType /empire help for commands.');
    
    console.log('🏛️ Empire Bot started');
  }
}

module.exports = { EmpireBot };
