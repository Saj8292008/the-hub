/**
 * AI Content Generation API
 * Endpoints for AI-powered blog post generation
 */

const blogGenerator = require('../services/openai/blogGenerator');

class AIGenerationAPI {
  /**
   * Generate a single blog post
   * POST /api/blog/ai/generate
   */
  async generatePost(req) {
    const {
      topic,
      category = 'general',
      targetKeywords = [],
      includeData = true,
      tone = 'authoritative',
      length = 'long'
    } = req.body;

    if (!topic) {
      throw new Error('Topic is required');
    }

    try {
      const post = await blogGenerator.generateBlogPost({
        topic,
        category,
        targetKeywords,
        includeData,
        tone,
        length
      });

      return {
        success: true,
        post
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw new Error(`Failed to generate post: ${error.message}`);
    }
  }

  /**
   * Generate multiple posts in batch
   * POST /api/blog/ai/generate-batch
   */
  async generateBatch(req) {
    const { topics, category, targetKeywords, includeData, tone, length } = req.body;

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      throw new Error('Topics array is required');
    }

    if (topics.length > 10) {
      throw new Error('Maximum 10 posts per batch');
    }

    try {
      const { results, errors } = await blogGenerator.generateBatch(topics, {
        category,
        targetKeywords,
        includeData,
        tone,
        length
      });

      return {
        success: true,
        generated: results.length,
        failed: errors.length,
        posts: results,
        errors
      };
    } catch (error) {
      console.error('Batch generation error:', error);
      throw new Error(`Failed to generate batch: ${error.message}`);
    }
  }

  /**
   * Generate title suggestions
   * POST /api/blog/ai/suggest-titles
   */
  async suggestTitles(req) {
    const { topic, category, count = 5 } = req.body;

    if (!topic) {
      throw new Error('Topic is required');
    }

    try {
      const openaiClient = require('../services/openai/client');

      const response = await openaiClient.chat({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at creating SEO-optimized blog post titles for a luxury asset tracking platform.'
          },
          {
            role: 'user',
            content: `Generate ${count} compelling, SEO-optimized blog post titles about "${topic}" for the ${category} category. Each title should be 50-70 characters, include the year 2025 if relevant, and be engaging for investors and collectors. Return as a JSON array of strings.`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.8,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content);
      const titles = result.titles || [];

      return {
        success: true,
        titles
      };
    } catch (error) {
      console.error('Title suggestion error:', error);
      throw new Error(`Failed to suggest titles: ${error.message}`);
    }
  }

  /**
   * Enhance existing content
   * POST /api/blog/ai/enhance
   */
  async enhanceContent(req) {
    const { content, enhancement = 'seo' } = req.body;

    if (!content) {
      throw new Error('Content is required');
    }

    try {
      const openaiClient = require('../services/openai/client');

      const prompts = {
        seo: 'Enhance this content for better SEO by improving keyword density, adding relevant headers, and making it more scannable. Maintain the original meaning and tone.',
        expand: 'Expand this content by adding more details, examples, and depth while maintaining the original structure and tone.',
        simplify: 'Simplify this content to make it more accessible to a broader audience while maintaining accuracy and key points.',
        professional: 'Rewrite this content in a more professional, authoritative tone suitable for a luxury brand.'
      };

      const prompt = prompts[enhancement] || prompts.seo;

      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content editor for a luxury asset tracking platform.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nContent:\n${content}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const enhancedContent = response.choices[0].message.content;

      return {
        success: true,
        enhanced: enhancedContent
      };
    } catch (error) {
      console.error('Content enhancement error:', error);
      throw new Error(`Failed to enhance content: ${error.message}`);
    }
  }

  /**
   * Get AI generation statistics
   * GET /api/blog/ai/stats
   */
  async getStats(req) {
    // In a production app, you'd track this in a database
    // For now, return placeholder stats
    return {
      total_generated: 0,
      this_month: 0,
      average_quality_score: 0,
      total_cost_usd: 0
    };
  }
}

module.exports = new AIGenerationAPI();
