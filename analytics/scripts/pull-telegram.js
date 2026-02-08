#!/usr/bin/env node

/**
 * Pull metrics from Telegram
 * 
 * Collects channel stats, member counts, and engagement data.
 * 
 * Usage:
 *   node pull-telegram.js              # Full report
 *   node pull-telegram.js --quick      # Quick summary
 *   node pull-telegram.js --json       # JSON output
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const TelegramBot = require('node-telegram-bot-api');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const channelId = process.env.TELEGRAM_CHANNEL_ID;
const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

if (!botToken) {
  console.error('❌ Missing TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const bot = new TelegramBot(botToken, { polling: false });

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isJson = args.includes('--json');

async function getMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    bot: {},
    channel: {},
    config: {}
  };

  // =========================================================================
  // BOT INFO
  // =========================================================================

  try {
    const botInfo = await bot.getMe();
    metrics.bot = {
      id: botInfo.id,
      username: botInfo.username,
      firstName: botInfo.first_name,
      canJoinGroups: botInfo.can_join_groups,
      canReadAllGroupMessages: botInfo.can_read_all_group_messages,
      supportsInlineQueries: botInfo.supports_inline_queries
    };
  } catch (e) {
    metrics.bot.error = e.message;
  }

  // =========================================================================
  // CHANNEL METRICS
  // =========================================================================

  if (channelId) {
    try {
      // Get channel info
      const chat = await bot.getChat(channelId);
      metrics.channel = {
        id: chat.id,
        title: chat.title,
        username: chat.username,
        type: chat.type,
        description: chat.description?.substring(0, 100)
      };

      // Get member count
      try {
        const memberCount = await bot.getChatMemberCount(channelId);
        metrics.channel.memberCount = memberCount;
      } catch (e) {
        metrics.channel.memberCount = 'N/A (bot may not be admin)';
      }

      // Get administrators (if bot is admin)
      try {
        const admins = await bot.getChatAdministrators(channelId);
        metrics.channel.adminCount = admins.length;
        metrics.channel.botIsAdmin = admins.some(a => a.user.id === metrics.bot.id);
      } catch (e) {
        metrics.channel.adminCount = 'N/A';
        metrics.channel.botIsAdmin = false;
      }

    } catch (e) {
      metrics.channel.error = e.message;
    }
  } else {
    metrics.channel.error = 'TELEGRAM_CHANNEL_ID not configured';
  }

  // =========================================================================
  // CONFIG INFO
  // =========================================================================

  metrics.config = {
    botToken: botToken ? `${botToken.substring(0, 10)}...` : 'Not set',
    channelId: channelId || 'Not set',
    adminChatId: adminChatId || 'Not set'
  };

  return metrics;
}

function printMetrics(metrics) {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║              THE HUB - TELEGRAM METRICS                      ║');
  console.log(`║              ${new Date().toLocaleString().padEnd(32)}       ║`);
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  console.log('║  🤖 BOT INFO                                                 ║');
  if (metrics.bot.error) {
    console.log(`║  • Error: ${metrics.bot.error.substring(0, 40).padEnd(40)}      ║`);
  } else {
    console.log(`║  • Username:                  @${(metrics.bot.username || 'N/A').padEnd(16)}             ║`);
    console.log(`║  • Name:                      ${(metrics.bot.firstName || 'N/A').padEnd(18)}             ║`);
    console.log(`║  • Bot ID:                    ${String(metrics.bot.id || 'N/A').padEnd(18)}             ║`);
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  📢 CHANNEL                                                  ║');
  if (metrics.channel.error) {
    console.log(`║  • Error: ${metrics.channel.error.substring(0, 40).padEnd(40)}      ║`);
  } else {
    console.log(`║  • Title:                     ${(metrics.channel.title || 'N/A').substring(0, 18).padEnd(18)}             ║`);
    console.log(`║  • Username:                  @${(metrics.channel.username || 'N/A').padEnd(16)}             ║`);
    console.log(`║  • Type:                      ${(metrics.channel.type || 'N/A').padEnd(18)}             ║`);
    console.log(`║  • Member count:              ${String(metrics.channel.memberCount || 'N/A').padEnd(18)}             ║`);
    console.log(`║  • Admin count:               ${String(metrics.channel.adminCount || 'N/A').padEnd(18)}             ║`);
    console.log(`║  • Bot is admin:              ${String(metrics.channel.botIsAdmin).padEnd(18)}             ║`);
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  ⚙️  CONFIGURATION                                            ║');
  console.log(`║  • Bot token:                 ${(metrics.config.botToken || 'N/A').padEnd(18)}             ║`);
  console.log(`║  • Channel ID:                ${(metrics.config.channelId || 'N/A').substring(0, 18).padEnd(18)}             ║`);
  console.log(`║  • Admin chat ID:             ${(metrics.config.adminChatId || 'N/A').padEnd(18)}             ║`);
  
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  
  // Tips
  if (metrics.channel.memberCount === 'N/A (bot may not be admin)') {
    console.log('💡 Tip: Make the bot an admin of the channel to see member count');
  }
}

function printQuickSummary(metrics) {
  console.log('\n📱 Quick Telegram Summary:');
  console.log(`   Bot: @${metrics.bot.username || 'N/A'}`);
  console.log(`   Channel: ${metrics.channel.title || 'N/A'} (${metrics.channel.memberCount || '?'} members)\n`);
}

async function main() {
  try {
    const metrics = await getMetrics();
    
    if (isJson) {
      console.log(JSON.stringify(metrics, null, 2));
    } else if (isQuick) {
      printQuickSummary(metrics);
    } else {
      printMetrics(metrics);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fetching Telegram metrics:', error.message);
    process.exit(1);
  }
}

main();
