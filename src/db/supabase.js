const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

class SupabaseClient {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('⚠️  Supabase credentials not found. Using local config.json fallback.');
      this.client = null;
      return;
    }

    if (!/^https?:\/\//i.test(this.supabaseUrl)) {
      console.warn('Supabase URL is invalid. Using local config.json fallback.');
      this.client = null;
      return;
    }
    
    try {
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.warn(`Supabase client init failed: ${error.message}`);
      this.client = null;
    }
  }

  // Check if Supabase is available
  isAvailable() {
    return this.client !== null;
  }

  // Generic query method with error handling
  async query(operation) {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    try {
      const result = await operation(this.client);
      if (result.error) {
        throw new Error(`Supabase error: ${result.error.message}`);
      }
      return result;
    } catch (error) {
      console.error('Database query error:', error.message);
      throw error;
    }
  }

  // ============================================================================
  // WATCHES METHODS
  // ============================================================================

  async getWatches() {
    return this.query(async (client) => {
      return await client
        .from('watches')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  async addWatch(watchData) {
    return this.query(async (client) => {
      return await client
        .from('watches')
        .insert([{
          brand: watchData.brand,
          model: watchData.model,
          specific_model: watchData.specificModel,
          target_price: watchData.targetPrice,
          name: watchData.name,
          search_terms: watchData.searchTerms,
          current_price: watchData.currentPrice
        }])
        .select();
    });
  }

  async updateWatch(id, updates) {
    return this.query(async (client) => {
      return await client
        .from('watches')
        .update(updates)
        .eq('id', id)
        .select();
    });
  }

  async deleteWatch(id) {
    return this.query(async (client) => {
      return await client
        .from('watches')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // CARS METHODS
  // ============================================================================

  async getCars() {
    return this.query(async (client) => {
      return await client
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  async addCar(carData) {
    return this.query(async (client) => {
      return await client
        .from('cars')
        .insert([{
          make: carData.make,
          model: carData.model,
          year: carData.year,
          variant: carData.variant,
          condition: carData.condition,
          target_price: carData.targetPrice,
          current_price: carData.currentPrice
        }])
        .select();
    });
  }

  async updateCar(id, updates) {
    return this.query(async (client) => {
      return await client
        .from('cars')
        .update(updates)
        .eq('id', id)
        .select();
    });
  }

  async deleteCar(id) {
    return this.query(async (client) => {
      return await client
        .from('cars')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // SNEAKERS METHODS
  // ============================================================================

  async getSneakers() {
    return this.query(async (client) => {
      return await client
        .from('sneakers')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  async addSneaker(sneakerData) {
    return this.query(async (client) => {
      return await client
        .from('sneakers')
        .insert([{
          name: sneakerData.name,
          brand: sneakerData.brand,
          model: sneakerData.model,
          colorway: sneakerData.colorway,
          size: sneakerData.size,
          condition: sneakerData.condition,
          retail_price: sneakerData.retailPrice,
          target_price: sneakerData.targetPrice,
          current_price_stockx: sneakerData.currentPrice?.stockx,
          current_price_goat: sneakerData.currentPrice?.goat,
          current_price_average: sneakerData.currentPrice?.average
        }])
        .select();
    });
  }

  async updateSneaker(id, updates) {
    return this.query(async (client) => {
      return await client
        .from('sneakers')
        .update(updates)
        .eq('id', id)
        .select();
    });
  }

  async deleteSneaker(id) {
    return this.query(async (client) => {
      return await client
        .from('sneakers')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // TEAMS METHODS
  // ============================================================================

  async getTeams() {
    return this.query(async (client) => {
      return await client
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });
    });
  }

  async addTeam(teamData) {
    return this.query(async (client) => {
      return await client
        .from('teams')
        .insert([{
          league: teamData.league,
          name: teamData.name,
          team_key: teamData.teamKey,
          city: teamData.city,
          conference: teamData.conference,
          division: teamData.division
        }])
        .select();
    });
  }

  async deleteTeam(id) {
    return this.query(async (client) => {
      return await client
        .from('teams')
        .delete()
        .eq('id', id);
    });
  }

  // ============================================================================
  // PRICE HISTORY METHODS
  // ============================================================================

  async addPriceHistory(historyData) {
    return this.query(async (client) => {
      return await client
        .from('price_history')
        .insert([{
          item_type: historyData.itemType, // 'watch', 'car', 'sneaker'
          item_id: historyData.itemId,
          price: historyData.price,
          source: historyData.source,
          additional_data: historyData.additionalData // JSON field for extra data
        }])
        .select();
    });
  }

  async getPriceHistory(itemType, itemId, limit = 30) {
    return this.query(async (client) => {
      return await client
        .from('price_history')
        .select('*')
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .order('checked_at', { ascending: false })
        .limit(limit);
    });
  }

  async getAllPriceHistory(itemType, limit = 100) {
    return this.query(async (client) => {
      return await client
        .from('price_history')
        .select('*')
        .eq('item_type', itemType)
        .order('checked_at', { ascending: false })
        .limit(limit);
    });
  }

  // ============================================================================
  // WATCH LISTINGS METHODS (Scraped Listings)
  // ============================================================================

  async getWatchListings(filters = {}) {
    return this.query(async (client) => {
      let query = client
        .from('watch_listings')
        .select('*')
        .order('timestamp', { ascending: false });

      // Apply filters
      if (filters.source) {
        query = query.eq('source', filters.source);
      }
      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`);
      }
      if (filters.minPrice) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      return await query;
    });
  }

  async addWatchListing(listingData) {
    return this.query(async (client) => {
      return await client
        .from('watch_listings')
        .insert([{
          source: listingData.source,
          title: listingData.title,
          price: listingData.price,
          currency: listingData.currency,
          brand: listingData.brand,
          model: listingData.model,
          condition: listingData.condition,
          location: listingData.location,
          url: listingData.url,
          images: listingData.images,
          seller: listingData.seller,
          timestamp: listingData.timestamp,
          raw_data: listingData.raw_data
        }])
        .select();
    });
  }

  async addWatchListingsBatch(listings) {
    if (!listings || listings.length === 0) {
      return { data: [], error: null };
    }

    return this.query(async (client) => {
      const records = listings.map(listing => ({
        source: listing.source,
        title: listing.title,
        price: listing.price,
        currency: listing.currency,
        brand: listing.brand,
        model: listing.model,
        condition: listing.condition,
        location: listing.location,
        url: listing.url,
        images: listing.images,
        seller: listing.seller,
        timestamp: listing.timestamp,
        raw_data: listing.raw_data
      }));

      return await client
        .from('watch_listings')
        .insert(records)
        .select();
    });
  }

  async deleteWatchListing(id) {
    return this.query(async (client) => {
      return await client
        .from('watch_listings')
        .delete()
        .eq('id', id);
    });
  }

  async findDuplicateListing(url) {
    return this.query(async (client) => {
      return await client
        .from('watch_listings')
        .select('*')
        .eq('url', url)
        .single();
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async testConnection() {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' };
    }

    try {
      const { data, error } = await this.client
        .from('watches')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Create tables (run this once to set up the database)
  async createTables() {
    if (!this.client) {
      throw new Error('Supabase client not available');
    }

    console.log('📊 Creating Supabase tables...');
    
    const tableCreationSQL = `
      -- Watches table
      CREATE TABLE IF NOT EXISTS watches (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(200) NOT NULL,
        specific_model VARCHAR(200),
        name VARCHAR(300) NOT NULL,
        target_price DECIMAL(10,2),
        current_price DECIMAL(10,2),
        search_terms TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Cars table
      CREATE TABLE IF NOT EXISTS cars (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        make VARCHAR(100) NOT NULL,
        model VARCHAR(200) NOT NULL,
        year INTEGER NOT NULL,
        variant VARCHAR(200),
        condition VARCHAR(50) DEFAULT 'used',
        target_price DECIMAL(12,2),
        current_price DECIMAL(12,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Sneakers table
      CREATE TABLE IF NOT EXISTS sneakers (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        name VARCHAR(300) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        model VARCHAR(200) NOT NULL,
        colorway VARCHAR(200),
        size VARCHAR(10) NOT NULL,
        condition VARCHAR(50) DEFAULT 'new',
        retail_price DECIMAL(8,2),
        target_price DECIMAL(8,2),
        current_price_stockx DECIMAL(8,2),
        current_price_goat DECIMAL(8,2),
        current_price_average DECIMAL(8,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Teams table
      CREATE TABLE IF NOT EXISTS teams (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        league VARCHAR(50) NOT NULL,
        name VARCHAR(200) NOT NULL,
        team_key VARCHAR(100) NOT NULL,
        city VARCHAR(100),
        conference VARCHAR(50),
        division VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Price history table
      CREATE TABLE IF NOT EXISTS price_history (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        item_type VARCHAR(20) NOT NULL, -- 'watch', 'car', 'sneaker'
        item_id UUID NOT NULL,
        price DECIMAL(12,2) NOT NULL,
        source VARCHAR(100) NOT NULL,
        additional_data JSONB,
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Watch listings table (for scraped listings)
      CREATE TABLE IF NOT EXISTS watch_listings (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        source VARCHAR(50) NOT NULL, -- 'reddit', 'ebay', 'watchuseek', etc.
        title TEXT NOT NULL,
        price DECIMAL(12,2),
        currency VARCHAR(10) DEFAULT 'USD',
        brand VARCHAR(100),
        model VARCHAR(200),
        condition VARCHAR(50),
        location VARCHAR(200),
        url TEXT UNIQUE NOT NULL,
        images TEXT[], -- Array of image URLs
        seller VARCHAR(200),
        timestamp TIMESTAMP WITH TIME ZONE,
        raw_data JSONB, -- Store original data for debugging
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history(item_type, item_id, checked_at DESC);
      CREATE INDEX IF NOT EXISTS idx_watches_brand_model ON watches(brand, model);
      CREATE INDEX IF NOT EXISTS idx_cars_make_model_year ON cars(make, model, year);
      CREATE INDEX IF NOT EXISTS idx_sneakers_brand_model ON sneakers(brand, model);
      CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);
      CREATE INDEX IF NOT EXISTS idx_watch_listings_source ON watch_listings(source);
      CREATE INDEX IF NOT EXISTS idx_watch_listings_brand_model ON watch_listings(brand, model);
      CREATE INDEX IF NOT EXISTS idx_watch_listings_price ON watch_listings(price);
      CREATE INDEX IF NOT EXISTS idx_watch_listings_timestamp ON watch_listings(timestamp DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_watch_listings_url ON watch_listings(url);
    `;

    console.log('ℹ️  Note: Table creation requires database admin access.');
    console.log('📋 Run this SQL in your Supabase dashboard:');
    console.log('\n' + '='.repeat(80));
    console.log(tableCreationSQL);
    console.log('='.repeat(80) + '\n');
    
    return tableCreationSQL;
  }
}

// Export singleton instance
module.exports = new SupabaseClient();
