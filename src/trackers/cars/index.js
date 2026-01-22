const supabase = require('../../db/supabase');
const {
  readConfig,
  writeConfig,
  ensureTrackedItems,
  slugify,
  toNumber
} = require('../utils/config');

const normalizeCarInput = (input, model, year, variant, targetPrice) => {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return {
      make: input.make || null,
      model: input.model || null,
      year: toNumber(input.year),
      variant: input.variant || null,
      condition: input.condition || null,
      targetPrice: toNumber(input.targetPrice),
      currentPrice: toNumber(input.currentPrice),
      sources: input.sources || []
    };
  }

  return {
    make: input || null,
    model: model || null,
    year: toNumber(year),
    variant: variant || null,
    condition: null,
    targetPrice: toNumber(targetPrice),
    currentPrice: null,
    sources: []
  };
};

class CarTracker {
  async listCars() {
    if (supabase.isAvailable()) {
      const result = await supabase.getCars();
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.cars;
  }

  async addCar(input, model, year, variant, targetPrice) {
    const car = normalizeCarInput(input, model, year, variant, targetPrice);

    if (supabase.isAvailable()) {
      const result = await supabase.addCar(car);
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);

    const idParts = [car.make, car.model, car.year].filter(Boolean);
    const id = slugify(idParts.join('-')) || `car-${Date.now()}`;

    const newCar = {
      id,
      make: car.make || null,
      model: car.model || null,
      year: car.year,
      variant: car.variant,
      condition: car.condition || 'used',
      targetPrice: car.targetPrice,
      currentPrice: car.currentPrice,
      lastChecked: null,
      sources: car.sources || []
    };

    config.trackedItems.cars.push(newCar);
    writeConfig(config);

    return newCar;
  }

  async getCar(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('cars').select('*').eq('id', id).single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    return config.trackedItems.cars.find(c => c.id === id);
  }

  async updateCar(id, updates) {
    if (supabase.isAvailable()) {
      const updateData = {
        target_price: updates.targetPrice,
        current_price: updates.currentPrice,
        last_checked: updates.lastChecked,
        make: updates.make,
        model: updates.model,
        year: updates.year,
        variant: updates.variant,
        condition: updates.condition,
        sources: updates.sources
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) delete updateData[key];
      });

      const result = await supabase.query(async (client) => {
        return await client.from('cars').update(updateData).eq('id', id).select().single();
      });
      return result.data;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const car = config.trackedItems.cars.find(c => c.id === id);

    if (!car) {
      throw new Error(`Car not found: ${id}`);
    }

    // Update only provided fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        car[key] = updates[key];
      }
    });

    writeConfig(config);
    return car;
  }

  async deleteCar(id) {
    if (supabase.isAvailable()) {
      const result = await supabase.query(async (client) => {
        return await client.from('cars').delete().eq('id', id);
      });
      return result;
    }

    const config = readConfig();
    ensureTrackedItems(config);
    const initialLength = config.trackedItems.cars.length;
    config.trackedItems.cars = config.trackedItems.cars.filter(c => c.id !== id);

    if (config.trackedItems.cars.length === initialLength) {
      throw new Error(`Car not found: ${id}`);
    }

    writeConfig(config);
    return { success: true };
  }

  async updatePrice(id, priceData) {
    const updates = {
      currentPrice: priceData.price || priceData.currentPrice,
      lastChecked: new Date().toISOString()
    };

    return await this.updateCar(id, updates);
  }
}

module.exports = CarTracker;
