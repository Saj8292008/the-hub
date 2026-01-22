const { readConfig, ensureTrackedItems } = require('../utils/config');

class AiTracker {
  async getNews() {
    const config = readConfig();
    ensureTrackedItems(config);

    return {
      source: 'local',
      generatedAt: new Date().toISOString(),
      tracked: config.trackedItems.ai,
      items: []
    };
  }

  async getSummary() {
    const config = readConfig();
    ensureTrackedItems(config);

    return {
      source: 'local',
      generatedAt: new Date().toISOString(),
      counts: {
        models: config.trackedItems.ai.models.length,
        benchmarks: config.trackedItems.ai.benchmarks.length,
        companies: config.trackedItems.ai.companies.length
      },
      tracked: config.trackedItems.ai
    };
  }
}

module.exports = AiTracker;
