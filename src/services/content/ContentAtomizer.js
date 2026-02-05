/**
 * Content Atomizer
 * Takes one piece of content (blog post, deal, insight) and generates
 * 15+ pieces of social content from it.
 * 
 * Uses Claude (Anthropic) for generation
 */

const Anthropic = require('@anthropic-ai/sdk');

class ContentAtomizer {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
    this.model = 'claude-sonnet-4-20250514';
  }

  /**
   * Atomize a blog post into multiple social media pieces
   */
  async atomizeBlogPost(content) {
    const { title, body, category, keyPoints = [] } = content;

    console.log(`🔄 Atomizing: "${title}"`);

    const prompt = `You are a social media content expert for The Hub, a deal-finding platform for watches, sneakers, and cars.

Take this blog post and create 15+ pieces of social content from it.

BLOG POST:
Title: ${title}
Category: ${category}
Content: ${body.substring(0, 4000)}
${keyPoints.length > 0 ? `Key Points: ${keyPoints.join(', ')}` : ''}

Generate the following content pieces. Return ONLY valid JSON, no other text:

{
  "threads": [
    { "hook": "attention-grabbing first tweet", "tweets": ["tweet 1", "tweet 2", "tweet 3", "tweet 4", "tweet 5"] }
  ],
  "tweets": ["standalone tweet 1", "standalone tweet 2", "standalone tweet 3", "standalone tweet 4", "standalone tweet 5"],
  "linkedin": "professional linkedin post 150-200 words",
  "telegram": ["casual message 1", "casual message 2", "casual message 3"],
  "newsletterSnippet": "2-3 sentence teaser",
  "quoteCards": ["punchy quote 1", "punchy quote 2", "punchy quote 3"],
  "polls": [
    { "question": "engagement question", "options": ["option A", "option B", "option C"] }
  ]
}

Requirements:
- Tweets under 280 characters
- Thread hooks that create curiosity
- Use relevant emojis
- Include CTAs to The Hub
- Punchy, not corporate`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const atomized = JSON.parse(jsonMatch[0]);
      
      const totalPieces = 
        (atomized.threads?.length || 0) +
        (atomized.tweets?.length || 0) +
        (atomized.linkedin ? 1 : 0) +
        (atomized.telegram?.length || 0) +
        (atomized.newsletterSnippet ? 1 : 0) +
        (atomized.quoteCards?.length || 0) +
        (atomized.polls?.length || 0);

      console.log(`✅ Generated ${totalPieces} content pieces`);

      return {
        source: { title, category },
        pieces: atomized,
        totalPieces,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Atomizer error:', error.message);
      throw error;
    }
  }

  /**
   * Atomize a hot deal into social content
   */
  async atomizeDeal(deal) {
    const { title, price, marketPrice, savings, savingsPercent, source, category, brand } = deal;

    console.log(`🔄 Atomizing deal: "${title}"`);

    const prompt = `Create social content for this HOT DEAL. Return ONLY valid JSON:

DEAL:
- Item: ${title}
- Price: $${price?.toLocaleString()}
- Market Value: $${marketPrice?.toLocaleString()}
- Savings: $${savings?.toLocaleString()} (${savingsPercent}% off)
- Category: ${category}
- Brand: ${brand || 'Unknown'}

{
  "urgentTweet": "FOMO-inducing tweet under 280 chars with emojis",
  "detailTweet": "More detail about why it's good, under 280 chars",
  "telegramAlert": "Alert for @TheHubDeals channel with formatting",
  "threadHook": "First tweet if doing a thread",
  "storyCaption": "For IG/TikTok story, short and punchy",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}

Make it urgent - deals sell fast. Use emojis. Be specific about the value.`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');

      return {
        deal: { title, price, savings },
        content: JSON.parse(jsonMatch[0]),
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Deal atomizer error:', error.message);
      throw error;
    }
  }

  /**
   * Quick atomize - generate just the essentials fast
   */
  async quickAtomize(insight) {
    const prompt = `Turn this insight into 5 social posts. Return ONLY valid JSON:

INSIGHT: ${insight}

{
  "tweet": "under 280 chars with emoji",
  "thread_hook": "first tweet of potential thread",
  "linkedin_opener": "first line for LinkedIn",
  "telegram": "casual message for community",
  "quote_card": "punchy 10-15 word one-liner for image"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.model,
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }]
      });

      const text = response.content[0].text;
      // Find the JSON object - handle nested braces properly
      let depth = 0;
      let start = -1;
      let end = -1;
      
      for (let i = 0; i < text.length; i++) {
        if (text[i] === '{') {
          if (start === -1) start = i;
          depth++;
        } else if (text[i] === '}') {
          depth--;
          if (depth === 0 && start !== -1) {
            end = i + 1;
            break;
          }
        }
      }
      
      if (start === -1 || end === -1) throw new Error('No JSON found in response');
      
      const jsonStr = text.substring(start, end);
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('❌ Quick atomize error:', error.message);
      throw error;
    }
  }

  /**
   * Generate content calendar from multiple posts
   */
  async generateContentCalendar(posts, days = 7) {
    console.log(`📅 Generating ${days}-day content calendar from ${posts.length} posts`);

    const atomizedPosts = await Promise.all(
      posts.map(post => this.atomizeBlogPost(post))
    );

    const allPieces = {
      threads: [],
      tweets: [],
      linkedin: [],
      telegram: [],
      quoteCards: [],
      polls: []
    };

    atomizedPosts.forEach(ap => {
      if (ap.pieces.threads) allPieces.threads.push(...ap.pieces.threads);
      if (ap.pieces.tweets) allPieces.tweets.push(...ap.pieces.tweets);
      if (ap.pieces.linkedin) allPieces.linkedin.push(ap.pieces.linkedin);
      if (ap.pieces.telegram) allPieces.telegram.push(...ap.pieces.telegram);
      if (ap.pieces.quoteCards) allPieces.quoteCards.push(...ap.pieces.quoteCards);
      if (ap.pieces.polls) allPieces.polls.push(...ap.pieces.polls);
    });

    const calendar = [];
    
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      const dayPlan = {
        date: date.toISOString().split('T')[0],
        dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
        content: []
      };

      // Morning tweet (9am)
      if (allPieces.tweets.length > 0) {
        dayPlan.content.push({
          time: '09:00',
          platform: 'twitter',
          type: 'tweet',
          content: allPieces.tweets.shift()
        });
      }

      // Midday thread (12pm) - every other day
      if (day % 2 === 0 && allPieces.threads.length > 0) {
        dayPlan.content.push({
          time: '12:00',
          platform: 'twitter',
          type: 'thread',
          content: allPieces.threads.shift()
        });
      }

      // Afternoon Telegram (3pm)
      if (allPieces.telegram.length > 0) {
        dayPlan.content.push({
          time: '15:00',
          platform: 'telegram',
          type: 'message',
          content: allPieces.telegram.shift()
        });
      }

      // Evening tweet (6pm)
      if (allPieces.tweets.length > 0) {
        dayPlan.content.push({
          time: '18:00',
          platform: 'twitter',
          type: 'tweet',
          content: allPieces.tweets.shift()
        });
      }

      // LinkedIn (weekdays, 10am)
      if (day % 7 < 5 && allPieces.linkedin.length > 0) {
        dayPlan.content.push({
          time: '10:00',
          platform: 'linkedin',
          type: 'post',
          content: allPieces.linkedin.shift()
        });
      }

      // Poll (every 3 days)
      if (day % 3 === 0 && allPieces.polls.length > 0) {
        dayPlan.content.push({
          time: '14:00',
          platform: 'twitter',
          type: 'poll',
          content: allPieces.polls.shift()
        });
      }

      calendar.push(dayPlan);
    }

    return {
      calendar,
      totalScheduled: calendar.reduce((sum, day) => sum + day.content.length, 0),
      remainingContent: {
        tweets: allPieces.tweets.length,
        threads: allPieces.threads.length,
        telegram: allPieces.telegram.length,
        linkedin: allPieces.linkedin.length,
        polls: allPieces.polls.length
      }
    };
  }
}

module.exports = ContentAtomizer;
