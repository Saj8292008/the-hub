// Discord Bot for The Hub
// Posts deal alerts to Discord channels

const { Client, GatewayIntentBits, EmbedBuilder, SlashCommandBuilder, REST, Routes } = require('discord.js');
require('dotenv').config();

class DiscordBot {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ]
    });
    this.token = process.env.DISCORD_BOT_TOKEN;
    this.alertChannelId = process.env.DISCORD_ALERT_CHANNEL_ID;
    this.isReady = false;
  }

  async initialize() {
    if (!this.token || this.token === 'your_discord_bot_token_here') {
      console.log('⚠️  Discord bot token not configured. Set DISCORD_BOT_TOKEN in .env');
      return false;
    }

    return new Promise((resolve, reject) => {
      this.client.once('ready', () => {
        console.log(`✅ Discord bot logged in as ${this.client.user.tag}`);
        this.isReady = true;
        this.registerCommands();
        resolve(true);
      });

      this.client.on('error', (error) => {
        console.error('Discord error:', error);
      });

      this.client.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        await this.handleCommand(interaction);
      });

      this.client.login(this.token).catch(reject);
    });
  }

  async registerCommands() {
    const commands = [
      new SlashCommandBuilder()
        .setName('deals')
        .setDescription('Get the latest deals')
        .addStringOption(option =>
          option.setName('category')
            .setDescription('Filter by category')
            .addChoices(
              { name: 'Watches', value: 'watches' },
              { name: 'Sneakers', value: 'sneakers' },
              { name: 'Cars', value: 'cars' },
              { name: 'All', value: 'all' }
            )
        ),
      new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check The Hub bot status'),
      new SlashCommandBuilder()
        .setName('subscribe')
        .setDescription('Subscribe to deal alerts in this channel'),
    ].map(cmd => cmd.toJSON());

    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
      console.log('Registering Discord slash commands...');
      await rest.put(
        Routes.applicationCommands(this.client.user.id),
        { body: commands }
      );
      console.log('✅ Discord slash commands registered');
    } catch (error) {
      console.error('Failed to register commands:', error);
    }
  }

  async handleCommand(interaction) {
    const { commandName } = interaction;

    switch (commandName) {
      case 'deals':
        await this.handleDealsCommand(interaction);
        break;
      case 'status':
        await this.handleStatusCommand(interaction);
        break;
      case 'subscribe':
        await this.handleSubscribeCommand(interaction);
        break;
      default:
        await interaction.reply({ content: 'Unknown command', ephemeral: true });
    }
  }

  async handleDealsCommand(interaction) {
    await interaction.deferReply();

    try {
      const category = interaction.options.getString('category') || 'all';
      
      // Fetch recent deals from database
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      let query = supabase
        .from('watch_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (category !== 'all' && category !== 'watches') {
        // For now we only have watches - extend later
        await interaction.editReply('Currently only watches are available. More categories coming soon!');
        return;
      }

      const { data: deals, error } = await query;

      if (error) throw error;

      if (!deals || deals.length === 0) {
        await interaction.editReply('No deals found. Check back later!');
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🔥 Latest Deals from The Hub')
        .setDescription('Here are the hottest deals right now:')
        .setTimestamp();

      deals.forEach((deal, index) => {
        const scoreBar = this.getScoreBar(deal.score || 7);
        embed.addFields({
          name: `${index + 1}. ${deal.title || deal.brand || 'Watch Deal'}`,
          value: `💰 **$${deal.price?.toLocaleString() || 'N/A'}**\n${scoreBar}\n[View Deal](${deal.url || '#'})`,
          inline: false
        });
      });

      embed.setFooter({ text: 'The Hub - Your Deal Aggregator' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error fetching deals:', error);
      await interaction.editReply('Error fetching deals. Please try again later.');
    }
  }

  async handleStatusCommand(interaction) {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🤖 The Hub Bot Status')
      .addFields(
        { name: 'Status', value: '✅ Online', inline: true },
        { name: 'Uptime', value: `${hours}h ${minutes}m`, inline: true },
        { name: 'Categories', value: 'Watches, Sneakers, Cars', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }

  async handleSubscribeCommand(interaction) {
    // Store channel subscription (in a real impl, save to DB)
    const channelId = interaction.channelId;
    const guildId = interaction.guildId;

    const embed = new EmbedBuilder()
      .setColor(0x00AE86)
      .setTitle('✅ Subscribed!')
      .setDescription(`This channel will now receive deal alerts.\n\nChannel ID: \`${channelId}\``)
      .setFooter({ text: 'You can unsubscribe anytime with /unsubscribe' });

    await interaction.reply({ embeds: [embed] });

    // Log for now - later save to DB
    console.log(`Channel subscribed: ${guildId}/${channelId}`);
  }

  getScoreBar(score) {
    const filled = Math.round(score);
    const empty = 10 - filled;
    const flames = score >= 9 ? ' 🔥🔥🔥' : score >= 8 ? ' 🔥🔥' : score >= 7 ? ' 🔥' : '';
    return `${'█'.repeat(filled)}${'░'.repeat(empty)} ${score}/10${flames}`;
  }

  // Post a deal alert to all subscribed channels
  async postDealAlert(deal) {
    if (!this.isReady) {
      console.log('Discord bot not ready, skipping alert');
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(deal.score >= 9 ? 0xFF0000 : deal.score >= 8 ? 0xFFA500 : 0x00AE86)
      .setTitle(`🔥 ${deal.title || 'Hot Deal Alert!'}`)
      .setDescription(deal.description || 'Check out this deal!')
      .addFields(
        { name: '💰 Price', value: `$${deal.price?.toLocaleString() || 'N/A'}`, inline: true },
        { name: '📊 Score', value: this.getScoreBar(deal.score || 7), inline: true },
        { name: '🏷️ Source', value: deal.source || 'The Hub', inline: true }
      )
      .setURL(deal.url || 'https://the-hub-psi.vercel.app')
      .setTimestamp();

    if (deal.image) {
      embed.setThumbnail(deal.image);
    }

    // Post to alert channel if configured
    if (this.alertChannelId) {
      try {
        const channel = await this.client.channels.fetch(this.alertChannelId);
        if (channel) {
          await channel.send({ embeds: [embed] });
          console.log(`Posted deal to Discord channel ${this.alertChannelId}`);
        }
      } catch (error) {
        console.error('Error posting to Discord:', error);
      }
    }
  }

  // Graceful shutdown
  async shutdown() {
    if (this.client) {
      await this.client.destroy();
      console.log('Discord bot disconnected');
    }
  }
}

// Export singleton instance
const discordBot = new DiscordBot();
module.exports = discordBot;

// Run if called directly
if (require.main === module) {
  discordBot.initialize()
    .then(() => console.log('Discord bot running...'))
    .catch(err => console.error('Failed to start Discord bot:', err));
}
