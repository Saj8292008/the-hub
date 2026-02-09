/**
 * Sports Broadcasting Expert - Main Export
 * 
 * Provides instant expert-level sports insights, commentary, and analysis
 */

const GameAnalyzer = require('./analyzer');
const SportsKnowledge = require('./knowledge');
const CommentaryGenerator = require('./commentary');
const SportsExpertChat = require('./chat');
const ContentCreator = require('./content');
const SportsExpertTelegramBot = require('./telegram-bot');

module.exports = {
  GameAnalyzer,
  SportsKnowledge,
  CommentaryGenerator,
  SportsExpertChat,
  ContentCreator,
  SportsExpertTelegramBot
};
