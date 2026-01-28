/**
 * Natural Language Query Parser
 * Parses natural language search queries into structured filters using AI
 */

const openaiClient = require('../openai/client');

class QueryParser {
  /**
   * Parse a watch search query
   * @param {string} query - Natural language query
   * @returns {Promise<Object>} - Structured filters
   */
  async parseWatchQuery(query) {
    if (!openaiClient.isAvailable()) {
      throw new Error('OpenAI client not available for natural language search');
    }

    const prompt = `Parse this watch search query into structured filters.

Query: "${query}"

Extract these fields (set to null if not mentioned):
- brand: string (e.g., "Rolex", "Omega")
- model: string (e.g., "Submariner", "Speedmaster")
- price_min: number (e.g., 5000)
- price_max: number (e.g., 15000)
- condition: string ("new" | "excellent" | "good" | "fair" | "poor" | null)
- box_and_papers: boolean (true if mentioned "box and papers", "full set", "complete")
- year_min: number (e.g., 2015)
- year_max: number (e.g., 2024)
- material: string (e.g., "steel", "gold", "titanium")

Return ONLY valid JSON. No explanation or markdown.`;

    try {
      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a watch search query parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200
      });

      const filters = JSON.parse(response.choices[0].message.content);
      return this.cleanFilters(filters);
    } catch (error) {
      console.error('Watch query parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse a sneaker search query
   * @param {string} query - Natural language query
   * @returns {Promise<Object>} - Structured filters
   */
  async parseSneakerQuery(query) {
    if (!openaiClient.isAvailable()) {
      throw new Error('OpenAI client not available for natural language search');
    }

    const prompt = `Parse this sneaker search query into structured filters.

Query: "${query}"

Extract these fields (set to null if not mentioned):
- brand: string (e.g., "Nike", "Jordan", "Adidas")
- model: string (e.g., "Air Jordan 1", "Dunk Low", "Yeezy 350")
- colorway: string (e.g., "Chicago", "Black Cement")
- size: string (e.g., "10.5", "11")
- condition: string ("new" | "used" | null)
- price_min: number
- price_max: number

Return ONLY valid JSON. No explanation or markdown.`;

    try {
      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a sneaker search query parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200
      });

      const filters = JSON.parse(response.choices[0].message.content);
      return this.cleanFilters(filters);
    } catch (error) {
      console.error('Sneaker query parsing error:', error);
      throw error;
    }
  }

  /**
   * Parse a car search query
   * @param {string} query - Natural language query
   * @returns {Promise<Object>} - Structured filters
   */
  async parseCarQuery(query) {
    if (!openaiClient.isAvailable()) {
      throw new Error('OpenAI client not available for natural language search');
    }

    const prompt = `Parse this car search query into structured filters.

Query: "${query}"

Extract these fields (set to null if not mentioned):
- make: string (e.g., "Porsche", "Ferrari", "BMW")
- model: string (e.g., "911", "F430", "M3")
- year_min: number (e.g., 2010)
- year_max: number (e.g., 2024)
- mileage_max: number (e.g., 50000)
- price_min: number
- price_max: number
- condition: string ("new" | "used" | "certified" | null)
- transmission: string ("manual" | "automatic" | null)

Return ONLY valid JSON. No explanation or markdown.`;

    try {
      const response = await openaiClient.chat({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a car search query parser. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200
      });

      const filters = JSON.parse(response.choices[0].message.content);
      return this.cleanFilters(filters);
    } catch (error) {
      console.error('Car query parsing error:', error);
      throw error;
    }
  }

  /**
   * Clean and normalize filters
   * @param {Object} filters - Raw filters from AI
   * @returns {Object} - Cleaned filters
   */
  cleanFilters(filters) {
    const cleaned = {};

    for (const [key, value] of Object.entries(filters)) {
      // Skip null or undefined values
      if (value === null || value === undefined) continue;

      // Normalize strings
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length > 0) {
          cleaned[key] = trimmed;
        }
      }
      // Keep numbers and booleans
      else if (typeof value === 'number' || typeof value === 'boolean') {
        cleaned[key] = value;
      }
    }

    return cleaned;
  }

  /**
   * Fallback: Simple keyword extraction (when AI is unavailable)
   * @param {string} query - Search query
   * @returns {Object} - Basic filters
   */
  fallbackParse(query) {
    const filters = {};
    const lowerQuery = query.toLowerCase();

    // Extract price range
    const priceMatch = lowerQuery.match(/under\s+\$?(\d+(?:,\d+)?(?:k)?)/i);
    if (priceMatch) {
      let price = priceMatch[1].replace(',', '');
      if (price.includes('k')) {
        price = parseInt(price) * 1000;
      }
      filters.price_max = parseInt(price);
    }

    // Extract "box and papers"
    if (lowerQuery.includes('box and papers') || lowerQuery.includes('full set')) {
      filters.box_and_papers = true;
    }

    // Extract condition
    if (lowerQuery.includes('new')) filters.condition = 'new';
    else if (lowerQuery.includes('excellent')) filters.condition = 'excellent';
    else if (lowerQuery.includes('good')) filters.condition = 'good';

    // Extract brand (common brands)
    const brands = ['rolex', 'omega', 'seiko', 'tag heuer', 'cartier', 'tudor'];
    for (const brand of brands) {
      if (lowerQuery.includes(brand)) {
        filters.brand = brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }

    return filters;
  }
}

module.exports = new QueryParser();
