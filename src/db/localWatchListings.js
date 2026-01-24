const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Local Watch Listings Storage
 * Fallback when Supabase is not available
 */
class LocalWatchListings {
  constructor() {
    this.storageDir = path.join(__dirname, '../../data');
    this.listingsFile = path.join(this.storageDir, 'watch_listings.json');
    this.listings = [];
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Ensure data directory exists
      await fs.mkdir(this.storageDir, { recursive: true });

      // Load existing listings
      try {
        const data = await fs.readFile(this.listingsFile, 'utf8');
        this.listings = JSON.parse(data);
        logger.info(`Loaded ${this.listings.length} listings from local storage`);
      } catch (error) {
        // File doesn't exist yet, start with empty array
        this.listings = [];
        await this.save();
        logger.info('Created new local listings storage');
      }

      this.initialized = true;
    } catch (error) {
      logger.error(`Failed to initialize local listings storage: ${error.message}`);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(
        this.listingsFile,
        JSON.stringify(this.listings, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error(`Failed to save listings: ${error.message}`);
      throw error;
    }
  }

  async getWatchListings(filters = {}) {
    await this.initialize();

    let filtered = [...this.listings];

    // Apply filters
    if (filters.source) {
      filtered = filtered.filter(l => l.source === filters.source);
    }
    if (filters.brand) {
      filtered = filtered.filter(l =>
        l.brand && l.brand.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    if (filters.minPrice) {
      filtered = filtered.filter(l => l.price && l.price >= filters.minPrice);
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(l => l.price && l.price <= filters.maxPrice);
    }

    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Apply limit
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return { data: filtered, error: null };
  }

  async addWatchListing(listingData) {
    await this.initialize();

    const listing = {
      id: this.generateId(),
      ...listingData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Check for duplicates by URL
    const existingIndex = this.listings.findIndex(l => l.url === listing.url);
    if (existingIndex !== -1) {
      // Update existing listing
      this.listings[existingIndex] = {
        ...this.listings[existingIndex],
        ...listing,
        id: this.listings[existingIndex].id, // Keep original ID
        created_at: this.listings[existingIndex].created_at // Keep original created_at
      };
      await this.save();
      return { data: [this.listings[existingIndex]], error: null };
    }

    this.listings.unshift(listing); // Add to beginning
    await this.save();

    return { data: [listing], error: null };
  }

  async addWatchListingsBatch(listings) {
    await this.initialize();

    if (!listings || listings.length === 0) {
      return { data: [], error: null };
    }

    const added = [];
    const updated = [];

    for (const listingData of listings) {
      const listing = {
        id: this.generateId(),
        ...listingData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Check for duplicates by URL
      const existingIndex = this.listings.findIndex(l => l.url === listing.url);
      if (existingIndex !== -1) {
        // Update existing
        this.listings[existingIndex] = {
          ...this.listings[existingIndex],
          ...listing,
          id: this.listings[existingIndex].id,
          created_at: this.listings[existingIndex].created_at
        };
        updated.push(this.listings[existingIndex]);
      } else {
        // Add new
        this.listings.unshift(listing);
        added.push(listing);
      }
    }

    await this.save();

    logger.info(`Batch save: ${added.length} added, ${updated.length} updated`);

    return { data: [...added, ...updated], error: null };
  }

  async deleteWatchListing(id) {
    await this.initialize();

    const index = this.listings.findIndex(l => l.id === id);
    if (index !== -1) {
      this.listings.splice(index, 1);
      await this.save();
      return { data: null, error: null };
    }

    return { data: null, error: { message: 'Listing not found' } };
  }

  async findDuplicateListing(url) {
    await this.initialize();

    const listing = this.listings.find(l => l.url === url);
    return { data: listing || null, error: null };
  }

  generateId() {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getStats() {
    await this.initialize();

    const stats = {
      total: this.listings.length,
      bySources: {},
      byBrand: {},
      priceRange: {
        min: null,
        max: null,
        average: null
      }
    };

    // Count by source
    this.listings.forEach(listing => {
      stats.bySources[listing.source] = (stats.bySources[listing.source] || 0) + 1;
      if (listing.brand) {
        stats.byBrand[listing.brand] = (stats.byBrand[listing.brand] || 0) + 1;
      }
    });

    // Calculate price stats
    const prices = this.listings
      .filter(l => l.price && l.price > 0)
      .map(l => l.price);

    if (prices.length > 0) {
      stats.priceRange.min = Math.min(...prices);
      stats.priceRange.max = Math.max(...prices);
      stats.priceRange.average = prices.reduce((a, b) => a + b, 0) / prices.length;
    }

    return stats;
  }
}

module.exports = new LocalWatchListings();
