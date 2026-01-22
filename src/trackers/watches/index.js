const supabase = require('../../db/supabase');
const {
  readConfig,
  writeConfig,
  ensureTrackedItems,
  slugify,
  toNumber
} = require('../utils/config');

const buildWatchName = (watch) => {
  return [watch.brand, watch.model, watch.specificModel]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const normalizeWatchInput = (input, model, specificModel, targetPrice) => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return {
      brand: input.brand || input.make || null,
      model: input.model || null,
      specificModel: input.specificModel || input.variant || null,
      targetPrice: toNumber(input.targetPrice),
      currentPrice: toNumber(input.currentPrice),
      name: input.name || null,
      searchTerms: input.searchTerms || null,
      sources: input.sources || []
    };
  }

  return {
    brand: input || null,
    model: model || null,
    specificModel: specificModel || null,
    targetPrice: toNumber(targetPrice),
    currentPrice: null,
    name: null,
    searchTerms: null,
    sources: []
  };
};

class WatchTracker {
  async listWatches() {
    if (supabase.isAvailable()) {
      const result = await supabase.getWatches();
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.watches;
  }

  async addWatch(input, model, specificModel, targetPrice) {
    const watch = normalizeWatchInput(input, model, specificModel, targetPrice);
    const name = watch.name || buildWatchName(watch);

    if (supabase.isAvailable()) {
      const result = await supabase.addWatch({
        ...watch,
        name
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);

    const idParts = [watch.brand, watch.model, watch.specificModel].filter(Boolean);
    const id = slugify(idParts.join('-')) || `watch-${Date.now()}`;

    const newWatch = {
      id,
      name: name || id,
      brand: watch.brand || null,
      model: watch.model || null,
      specificModel: watch.specificModel || null,
      targetPrice: watch.targetPrice,
      currentPrice: watch.currentPrice,
      lastChecked: null,
      sources: watch.sources || []
    };

    config.trackedItems.watches.push(newWatch);
    writeConfig(config);

    return newWatch;
  }

  async getWatch(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('watches').select('*').eq('id', id).single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.watches.find(w => w.id === id);
  }

  async updateWatch(id, updates) {
    if (supabase.isAvailable()) {
      const updateData = {
        target_price: updates.targetPrice,
        current_price: updates.currentPrice,
        last_checked: updates.lastChecked,
        brand: updates.brand,
        model: updates.model,
        specific_model: updates.specificModel,
        name: updates.name,
        sources: updates.sources
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const result = await supabase.query(async (client) => {
        return await client.from('watches').update(updateData).eq('id', id).select().single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const watch = config.trackedItems.watches.find(w => w.id === id);

    if (!watch) {
      throw new Error(`Watch not found: ${id}`);
    }

    // Update only provided fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        watch[key] = updates[key];
      }
    });

    writeConfig(config);
    return watch;
  }

  async deleteWatch(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('watches').delete().eq('id', id);
      });
      return result;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const initialLength = config.trackedItems.watches.length;
    config.trackedItems.watches = config.trackedItems.watches.filter(w => w.id !== id);

    if (config.trackedItems.watches.length === initialLength) {
      throw new Error(`Watch not found: ${id}`);
    }

    writeConfig(config);
    return { success: true };
  }

  async updatePrice(id, priceData) {
    const updates = {
      currentPrice: priceData.price || priceData.currentPrice,
      lastChecked: new Date().toISOString()
    };

    return await this.updateWatch(id, updates);
  }
}

module.exports = WatchTracker;
