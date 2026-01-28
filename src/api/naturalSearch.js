/**
 * Natural Language Search API
 * Endpoints for AI-powered natural language search
 */

const queryParser = require('../services/ai/queryParser');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');

class NaturalSearchAPI {
  /**
   * Search watches using natural language
   * POST /api/search/watches
   */
  async searchWatches(req) {
    const { query, options = {} } = req.body;

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required');
    }

    try {
      // Parse query with AI
      const filters = await queryParser.parseWatchQuery(query);

      // Add pagination options
      const searchOptions = {
        ...filters,
        limit: options.limit || 50,
        offset: options.offset || 0
      };

      // Query database
      let results;
      if (supabase.isAvailable()) {
        results = await this.searchWatchListings(searchOptions);
      } else {
        results = await this.searchWatchListingsLocal(searchOptions);
      }

      return {
        success: true,
        query,
        interpreted_filters: filters,
        results: results.data || results,
        count: results.count || (results.data || results).length,
        message: this.buildInterpretationMessage(filters)
      };
    } catch (error) {
      console.error('Natural search error:', error);

      // Fallback to simple keyword search
      const fallbackFilters = queryParser.fallbackParse(query);

      let results;
      if (supabase.isAvailable()) {
        results = await this.searchWatchListings(fallbackFilters);
      } else {
        results = await this.searchWatchListingsLocal(fallbackFilters);
      }

      return {
        success: true,
        query,
        interpreted_filters: fallbackFilters,
        results: results.data || results,
        count: results.count || (results.data || results).length,
        fallback: true,
        message: 'AI search unavailable, using keyword search'
      };
    }
  }

  /**
   * Search sneakers using natural language
   * POST /api/search/sneakers
   */
  async searchSneakers(req) {
    const { query, options = {} } = req.body;

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required');
    }

    try {
      const filters = await queryParser.parseSneakerQuery(query);

      // Note: Sneaker listings would need similar database structure
      // For now, return placeholder
      return {
        success: true,
        query,
        interpreted_filters: filters,
        results: [],
        count: 0,
        message: this.buildInterpretationMessage(filters)
      };
    } catch (error) {
      console.error('Sneaker search error:', error);
      throw new Error(`Failed to search sneakers: ${error.message}`);
    }
  }

  /**
   * Search cars using natural language
   * POST /api/search/cars
   */
  async searchCars(req) {
    const { query, options = {} } = req.body;

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required');
    }

    try {
      const filters = await queryParser.parseCarQuery(query);

      // Note: Car listings would need similar database structure
      // For now, return placeholder
      return {
        success: true,
        query,
        interpreted_filters: filters,
        results: [],
        count: 0,
        message: this.buildInterpretationMessage(filters)
      };
    } catch (error) {
      console.error('Car search error:', error);
      throw new Error(`Failed to search cars: ${error.message}`);
    }
  }

  /**
   * Search watch listings from Supabase
   */
  async searchWatchListings(filters) {
    let query = supabase.client
      .from('watch_listings')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.brand) {
      query = query.ilike('brand', `%${filters.brand}%`);
    }

    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    if (filters.price_min) {
      query = query.gte('price', filters.price_min);
    }

    if (filters.price_max) {
      query = query.lte('price', filters.price_max);
    }

    if (filters.condition) {
      query = query.ilike('condition', filters.condition);
    }

    if (filters.year_min) {
      query = query.gte('year', filters.year_min);
    }

    if (filters.year_max) {
      query = query.lte('year', filters.year_max);
    }

    if (filters.material) {
      query = query.ilike('material', `%${filters.material}%`);
    }

    // Sort by deal score by default
    query = query.order('deal_score', { ascending: false, nullsFirst: false });

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    return await query;
  }

  /**
   * Search watch listings from local storage
   */
  async searchWatchListingsLocal(filters) {
    const allListings = await localWatchListings.getWatchListings({
      limit: 1000
    });

    let results = allListings.data || [];

    // Apply filters
    if (filters.brand) {
      results = results.filter(l =>
        l.brand && l.brand.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }

    if (filters.model) {
      results = results.filter(l =>
        l.model && l.model.toLowerCase().includes(filters.model.toLowerCase())
      );
    }

    if (filters.price_min) {
      results = results.filter(l => l.price >= filters.price_min);
    }

    if (filters.price_max) {
      results = results.filter(l => l.price <= filters.price_max);
    }

    if (filters.condition) {
      results = results.filter(l =>
        l.condition && l.condition.toLowerCase() === filters.condition.toLowerCase()
      );
    }

    // Sort by deal score
    results.sort((a, b) => (b.deal_score || 0) - (a.deal_score || 0));

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      data: paginatedResults,
      count: results.length
    };
  }

  /**
   * Build a human-readable interpretation message
   */
  buildInterpretationMessage(filters) {
    const parts = [];

    if (filters.brand) parts.push(filters.brand);
    if (filters.model) parts.push(filters.model);

    if (filters.make) parts.push(filters.make);

    if (filters.condition) parts.push(`${filters.condition} condition`);

    if (filters.price_max && !filters.price_min) {
      parts.push(`under $${filters.price_max.toLocaleString()}`);
    } else if (filters.price_min && !filters.price_max) {
      parts.push(`over $${filters.price_min.toLocaleString()}`);
    } else if (filters.price_min && filters.price_max) {
      parts.push(`$${filters.price_min.toLocaleString()} - $${filters.price_max.toLocaleString()}`);
    }

    if (filters.year_min && filters.year_max) {
      parts.push(`${filters.year_min}-${filters.year_max}`);
    } else if (filters.year_min) {
      parts.push(`from ${filters.year_min}`);
    } else if (filters.year_max) {
      parts.push(`up to ${filters.year_max}`);
    }

    if (filters.box_and_papers) {
      parts.push('with box and papers');
    }

    if (filters.material) {
      parts.push(filters.material);
    }

    if (filters.mileage_max) {
      parts.push(`under ${filters.mileage_max.toLocaleString()} miles`);
    }

    if (filters.size) {
      parts.push(`size ${filters.size}`);
    }

    if (filters.colorway) {
      parts.push(filters.colorway);
    }

    return parts.length > 0
      ? `Searching for: ${parts.join(', ')}`
      : 'Searching all listings';
  }
}

module.exports = new NaturalSearchAPI();
