/**
 * OpenAI Client Configuration
 * Singleton client for AI services
 */

const OpenAI = require('openai');

class OpenAIClient {
  constructor() {
    this.client = null;
    this.isConfigured = false;

    this.initialize();
  }

  initialize() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not found in environment variables');
      console.warn('   AI features will be disabled');
      return;
    }

    try {
      this.client = new OpenAI({
        apiKey: apiKey
      });
      this.isConfigured = true;
      console.log('✅ OpenAI client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
    }
  }

  /**
   * Check if OpenAI client is available
   */
  isAvailable() {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Get the OpenAI client instance
   */
  getClient() {
    if (!this.isAvailable()) {
      throw new Error('OpenAI client is not available. Check OPENAI_API_KEY environment variable.');
    }
    return this.client;
  }

  /**
   * Generate chat completion
   * @param {Object} options - OpenAI chat completion options
   * @returns {Promise<Object>} - Completion response
   */
  async chat(options) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI client is not available');
    }

    try {
      const response = await this.client.chat.completions.create(options);
      return response;
    } catch (error) {
      console.error('OpenAI chat completion error:', error);
      throw error;
    }
  }

  /**
   * Generate completion with streaming
   * @param {Object} options - OpenAI chat completion options
   * @returns {Promise<AsyncIterable>} - Stream of completion chunks
   */
  async chatStream(options) {
    if (!this.isAvailable()) {
      throw new Error('OpenAI client is not available');
    }

    try {
      const stream = await this.client.chat.completions.create({
        ...options,
        stream: true
      });
      return stream;
    } catch (error) {
      console.error('OpenAI chat stream error:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new OpenAIClient();
