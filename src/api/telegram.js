/**
 * Telegram API Routes
 * Control Telegram bot and content from the API
 */

const express = require('express');
const router = express.Router();

let contentManager = null;
let bot = null;

// Initialize with bot instance
function setBot(telegramBot) {
  bot = telegramBot;
  const TelegramContentManager = require('../bot/telegramContent');
  contentManager = new TelegramContentManager(bot.bot || bot);
  contentManager.initSchedules();
  console.log('✅ Telegram API initialized with content manager');
}

// Get status
router.get('/status', (req, res) => {
  if (!contentManager) {
    return res.json({ 
      status: 'not_initialized',
      message: 'Telegram content manager not initialized'
    });
  }

  const status = contentManager.getStatus();
  res.json({
    status: 'ok',
    ...status
  });
});

// Get scheduled jobs
router.get('/schedules', (req, res) => {
  if (!contentManager) {
    return res.status(500).json({ error: 'Not initialized' });
  }
  
  res.json({
    jobs: contentManager.jobs.map(j => ({
      name: j.name,
      schedule: j.schedule
    }))
  });
});

// Trigger specific content type
router.post('/trigger/:type', async (req, res) => {
  if (!contentManager) {
    return res.status(500).json({ error: 'Not initialized' });
  }

  const { type } = req.params;
  
  try {
    const result = await contentManager.triggerContent(type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post custom message to channel
router.post('/post', async (req, res) => {
  if (!contentManager) {
    return res.status(500).json({ error: 'Not initialized' });
  }

  const { message, parseMode = 'HTML' } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const messageId = await contentManager.sendToChannel(message, { parse_mode: parseMode });
    res.json({ success: true, messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Post poll to channel
router.post('/poll', async (req, res) => {
  if (!contentManager) {
    return res.status(500).json({ error: 'Not initialized' });
  }

  const { question, options } = req.body;
  
  if (!question || !options || !Array.isArray(options)) {
    return res.status(400).json({ error: 'Question and options array required' });
  }

  try {
    await contentManager.postPoll(question, options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get channel stats (if available)
router.get('/stats', async (req, res) => {
  if (!bot) {
    return res.status(500).json({ error: 'Bot not initialized' });
  }

  try {
    const channelId = process.env.TELEGRAM_CHANNEL_ID;
    if (!channelId) {
      return res.json({ error: 'No channel configured' });
    }

    const chatMemberCount = await (bot.bot || bot).getChatMemberCount(channelId);
    
    res.json({
      channelId,
      memberCount: chatMemberCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Content type reference
router.get('/content-types', (req, res) => {
  res.json({
    types: [
      { id: 'morning', name: 'Morning Brief', schedule: '7:30 AM' },
      { id: 'dotd', name: 'Deal of the Day', schedule: '9:00 AM' },
      { id: 'hot', name: 'Hot Deals', schedule: '12:00 PM' },
      { id: 'drops', name: 'Price Drops', schedule: '3:00 PM' },
      { id: 'evening', name: 'Evening Roundup', schedule: '6:00 PM' },
      { id: 'weekend', name: 'Weekend Roundup', schedule: 'Sat 10:00 AM' },
      { id: 'stats', name: 'Weekly Stats', schedule: 'Sun 8:00 PM' },
      { id: 'monday', name: 'Market Monday', schedule: 'Mon 8:00 AM' }
    ]
  });
});

module.exports = router;
module.exports.setBot = setBot;
