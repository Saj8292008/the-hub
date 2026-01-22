const supabase = require('../../db/supabase');
const {
  readConfig,
  writeConfig,
  ensureTrackedItems,
  slugify,
  toNumber
} = require('../utils/config');

const buildSneakerName = (sneaker) => {
  return [sneaker.brand, sneaker.model, sneaker.colorway]
    .filter(Boolean)
    .join(' ')
    .trim();
};

const normalizeSneakerInput = (input, model, size, targetPrice) => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return {
      name: input.name || null,
      brand: input.brand || null,
      model: input.model || null,
      colorway: input.colorway || null,
      size: input.size || null,
      condition: input.condition || null,
      retailPrice: toNumber(input.retailPrice),
      targetPrice: toNumber(input.targetPrice),
      currentPrice: input.currentPrice || null,
      sources: input.sources || []
    };
  }

  return {
    name: null,
    brand: input || null,
    model: model || null,
    colorway: null,
    size: size || null,
    condition: null,
    retailPrice: null,
    targetPrice: toNumber(targetPrice),
    currentPrice: null,
    sources: []
  };
};

class SneakerTracker {
  async listSneakers() {
    if (supabase.isAvailable()) {
      const result = await supabase.getSneakers();
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.sneakers;
  }

  async addSneaker(input, model, size, targetPrice) {
    const sneaker = normalizeSneakerInput(input, model, size, targetPrice);
    const name = sneaker.name || buildSneakerName(sneaker);

    if (supabase.isAvailable()) {
      const result = await supabase.addSneaker({
        ...sneaker,
        name
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);

    const idParts = [sneaker.brand, sneaker.model, sneaker.colorway, sneaker.size]
      .filter(Boolean);
    const id = slugify(idParts.join('-')) || `sneaker-${Date.now()}`;

    const newSneaker = {
      id,
      name: name || id,
      brand: sneaker.brand || null,
      model: sneaker.model || null,
      colorway: sneaker.colorway || null,
      size: sneaker.size || null,
      condition: sneaker.condition || 'new',
      retailPrice: sneaker.retailPrice,
      targetPrice: sneaker.targetPrice,
      currentPrice: sneaker.currentPrice,
      lastChecked: null,
      sources: sneaker.sources || []
    };

    config.trackedItems.sneakers.push(newSneaker);
    writeConfig(config);

    return newSneaker;
  }

  async getSneaker(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('sneakers').select('*').eq('id', id).single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.sneakers.find(s => s.id === id);
  }

  async updateSneaker(id, updates) {
    if (supabase.isAvailable()) {
      const updateData = {
        target_price: updates.targetPrice,
        current_price_stockx: updates.currentPriceStockX,
        current_price_goat: updates.currentPriceGoat,
        current_price_average: updates.currentPriceAverage || updates.currentPrice,
        last_checked: updates.lastChecked,
        name: updates.name,
        brand: updates.brand,
        model: updates.model,
        colorway: updates.colorway,
        size: updates.size,
        condition: updates.condition,
        retail_price: updates.retailPrice,
        sources: updates.sources
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const result = await supabase.query(async (client) => {
        return await client.from('sneakers').update(updateData).eq('id', id).select().single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const sneaker = config.trackedItems.sneakers.find(s => s.id === id);

    if (!sneaker) {
      throw new Error(`Sneaker not found: ${id}`);
    }

    // Update only provided fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        sneaker[key] = updates[key];
      }
    });

    writeConfig(config);
    return sneaker;
  }

  async deleteSneaker(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('sneakers').delete().eq('id', id);
      });
      return result;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const initialLength = config.trackedItems.sneakers.length;
    config.trackedItems.sneakers = config.trackedItems.sneakers.filter(s => s.id !== id);

    if (config.trackedItems.sneakers.length === initialLength) {
      throw new Error(`Sneaker not found: ${id}`);
    }

    writeConfig(config);
    return { success: true };
  }

  async updatePrice(id, priceData) {
    const updates = {
      currentPrice: priceData.price || priceData.currentPrice,
      currentPriceStockX: priceData.stockx,
      currentPriceGoat: priceData.goat,
      currentPriceAverage: priceData.average,
      lastChecked: new Date().toISOString()
    };

    return await this.updateSneaker(id, updates);
  }
}

module.exports = SneakerTracker;
