const CommentaryGenerator = require('./commentary');
const GameAnalyzer = require('./analyzer');
const logger = require('../../utils/logger');

class ContentCreator {
  constructor() {
    this.commentary = new CommentaryGenerator();
    this.analyzer = new GameAnalyzer();
  }

  // Generate social media post
  async generateSocialPost(game, platform = 'twitter', style = 'analysis') {
    try {
      const analysis = await this.analyzer.analyzeGame(game.id);

      switch (style) {
        case 'analysis':
          return await this.commentary.generateTweetInsight(game);
        
        case 'thread':
          return await this.commentary.generateSocialThread(game, platform);
        
        case 'hot-take':
          return await this.commentary.generateHotTake(game, 'medium');
        
        default:
          return await this.commentary.generateTweetInsight(game);
      }
    } catch (error) {
      logger.error('Error generating social post:', error);
      throw error;
    }
  }

  // Generate newsletter content
  async generateNewsletter(sport = null, date = new Date()) {
    try {
      const games = await this.analyzer.getLiveGames(sport, 10);
      
      // Filter to completed games from today
      const todayStr = date.toISOString().split('T')[0];
      const todaysGames = games.filter(g => {
        const gameDate = g.game_time.split('T')[0];
        return gameDate === todayStr && g.status === 'final';
      });

      if (todaysGames.length === 0) {
        return {
          success: false,
          message: 'No completed games found for today'
        };
      }

      const content = await this.commentary.generateNewsletterAnalysis(todaysGames, sport);

      return {
        success: true,
        subject: `${sport ? sport.toUpperCase() : 'Sports'} Recap - ${date.toLocaleDateString()}`,
        content,
        games: todaysGames
      };
    } catch (error) {
      logger.error('Error generating newsletter:', error);
      throw error;
    }
  }

  // Generate video script outline
  async generateVideoScript(game, duration = 'short') {
    try {
      const analysis = await this.analyzer.analyzeGame(game.id);
      const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 5);

      const durations = {
        short: { length: '1-2 minutes', points: 3 },
        medium: { length: '3-5 minutes', points: 5 },
        long: { length: '8-10 minutes', points: 7 }
      };

      const durConfig = durations[duration] || durations.medium;

      const sections = [
        {
          title: 'Hook/Intro',
          duration: '0:00-0:15',
          content: `Quick attention-grabbing opener about ${analysis.teams.away.name} vs ${analysis.teams.home.name}`
        },
        {
          title: 'Game Overview',
          duration: '0:15-0:45',
          content: `Final score, key stats, overall narrative`
        },
        {
          title: 'Key Moments',
          duration: '0:45-2:00',
          content: talkingPoints.slice(0, durConfig.points).map((p, i) => `${i + 1}. ${p}`).join('\n')
        },
        {
          title: 'Analysis',
          duration: '2:00-3:30',
          content: 'Deeper dive into what this means, player performances, coaching decisions'
        },
        {
          title: 'Takeaways/CTA',
          duration: '3:30-end',
          content: 'What to watch next, subscribe prompt'
        }
      ];

      return {
        success: true,
        game,
        duration: durConfig.length,
        sections,
        bRoll: [
          'Game highlights',
          'Player stats graphics',
          'Team logo animations',
          'Crowd reactions',
          'Coach reactions'
        ],
        hooks: [
          `"You won't believe what happened in the ${analysis.teams.home.name} game tonight..."`,
          `"${analysis.teams.away.name} just proved EVERYONE wrong..."`,
          `"This game had EVERYTHING..."`
        ]
      };
    } catch (error) {
      logger.error('Error generating video script:', error);
      throw error;
    }
  }

  // Generate podcast outline
  async generatePodcastOutline(games, duration = 'medium') {
    try {
      const scripts = await Promise.all(
        games.slice(0, 3).map(game => this.commentary.generatePodcastScript(game, 'short'))
      );

      const outline = {
        success: true,
        duration: duration === 'short' ? '15-20 min' : duration === 'medium' ? '30-45 min' : '60+ min',
        segments: [
          {
            title: 'Intro',
            time: '0:00-2:00',
            content: 'Welcome, overview of what we\'re covering today'
          },
          {
            title: 'Top Game Breakdown',
            time: '2:00-12:00',
            content: scripts[0] || 'Main game analysis'
          },
          {
            title: 'Other Notable Games',
            time: '12:00-25:00',
            content: scripts.slice(1).join('\n\n---\n\n')
          },
          {
            title: 'Hot Takes',
            time: '25:00-35:00',
            content: 'Spicy opinions and bold predictions'
          },
          {
            title: 'Wrap-up',
            time: '35:00-end',
            content: 'Looking ahead, listener questions, outro'
          }
        ],
        notes: [
          'Keep energy high throughout',
          'Use specific stats to back up claims',
          'Leave room for banter and chemistry',
          'Build to the hot takes - save the spiciest for that segment'
        ]
      };

      return outline;
    } catch (error) {
      logger.error('Error generating podcast outline:', error);
      throw error;
    }
  }

  // Generate blog post
  async generateBlogPost(game, style = 'recap') {
    try {
      const analysis = await this.analyzer.analyzeGame(game.id);
      const talkingPoints = await this.analyzer.generateTalkingPoints(game.id, 7);

      let content;

      if (style === 'recap') {
        content = await this.commentary.generatePostGameWrapup(game);
      } else if (style === 'preview') {
        content = await this.generatePreviewContent(game, analysis);
      } else if (style === 'deep-dive') {
        content = await this.generateDeepDiveContent(game, analysis, talkingPoints);
      }

      // Generate metadata
      const title = style === 'recap' 
        ? `${analysis.teams.away.name} vs ${analysis.teams.home.name}: Game Recap`
        : style === 'preview'
        ? `Preview: ${analysis.teams.away.name} @ ${analysis.teams.home.name}`
        : `Deep Dive: Breaking Down ${analysis.teams.away.name} vs ${analysis.teams.home.name}`;

      const tags = [
        game.sport,
        game.league,
        analysis.teams.home.name,
        analysis.teams.away.name,
        style
      ];

      return {
        success: true,
        title,
        content,
        tags,
        excerpt: content.split('\n')[0].slice(0, 200) + '...',
        metadata: {
          sport: game.sport,
          league: game.league,
          gameId: game.id,
          teams: [analysis.teams.home.name, analysis.teams.away.name]
        }
      };
    } catch (error) {
      logger.error('Error generating blog post:', error);
      throw error;
    }
  }

  // Generate Instagram caption
  async generateInstagramCaption(game, includeHashtags = true) {
    try {
      const analysis = await this.analyzer.analyzeGame(game.id);
      const insight = await this.commentary.generateTweetInsight(game);

      // Remove any existing emojis and restructure for Instagram
      const caption = insight.replace(/[^\w\s.,!?'-]/g, '');

      const hashtags = includeHashtags ? [
        `#${game.sport}`,
        `#${game.league}`,
        `#${analysis.teams.home.name.replace(/\s+/g, '')}`,
        `#${analysis.teams.away.name.replace(/\s+/g, '')}`,
        '#sports',
        '#sportsanalysis',
        '#gameday'
      ].join(' ') : '';

      return {
        success: true,
        caption: `${caption}\n\n${hashtags}`.trim(),
        suggestedEmojis: ['🏀', '🔥', '⚡', '💪', '🎯'],
        callToAction: 'Double tap if you agree! 👆'
      };
    } catch (error) {
      logger.error('Error generating Instagram caption:', error);
      throw error;
    }
  }

  // Helper: Generate preview content
  async generatePreviewContent(game, analysis) {
    const matchup = this.commentary.knowledge.getMatchupHistory(
      analysis.teams.home.name,
      analysis.teams.away.name,
      game.sport
    );

    return `
${analysis.teams.away.name} (${analysis.teams.away.wins}-${analysis.teams.away.losses}) @ ${analysis.teams.home.name} (${analysis.teams.home.wins}-${analysis.teams.home.losses})

${matchup.talkingPoint}

What to Watch:
- How will ${analysis.teams.away.name} handle the pressure?
- Can ${analysis.teams.home.name} maintain their momentum?
- Key matchup: [Star player] vs [Star player]

${analysis.betting ? `Vegas has ${analysis.betting.spread_home < 0 ? analysis.teams.home.name : analysis.teams.away.name} favored by ${Math.abs(analysis.betting.spread_home)} points.` : ''}

This game could have major implications for playoff seeding. Don't miss it.
    `.trim();
  }

  // Helper: Generate deep dive content
  async generateDeepDiveContent(game, analysis, talkingPoints) {
    return `
Breaking Down ${analysis.teams.away.name} vs ${analysis.teams.home.name}

Final Score: ${game.away_score} - ${game.home_score}

Key Storylines:
${talkingPoints.map((p, i) => `\n${i + 1}. ${p}`).join('')}

The Deciding Factors:
[Analysis of what determined the outcome]

Looking Ahead:
${analysis.teams.home.name} will need to focus on [area of improvement]
${analysis.teams.away.name} should be encouraged by [positive takeaway]

This game showcased [broader theme or trend in the league].
    `.trim();
  }

  // Batch generate content for multiple platforms
  async generateMultiPlatformContent(game, platforms = ['twitter', 'instagram', 'blog']) {
    const results = {};

    for (const platform of platforms) {
      try {
        switch (platform) {
          case 'twitter':
            results.twitter = await this.generateSocialPost(game, 'twitter', 'analysis');
            break;
          case 'instagram':
            results.instagram = await this.generateInstagramCaption(game);
            break;
          case 'blog':
            results.blog = await this.generateBlogPost(game, 'recap');
            break;
          case 'podcast':
            results.podcast = await this.commentary.generatePodcastScript(game);
            break;
        }
      } catch (error) {
        logger.error(`Error generating ${platform} content:`, error);
        results[platform] = { success: false, error: error.message };
      }
    }

    return results;
  }

  // Close connections
  close() {
    this.commentary.close();
    this.analyzer.close();
  }
}

module.exports = ContentCreator;
