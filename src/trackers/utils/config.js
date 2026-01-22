const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.resolve(__dirname, '..', '..', '..', 'config.json');

const DEFAULT_CONFIG = {
  trackedItems: {
    watches: [],
    cars: [],
    sneakers: [],
    sports: {
      teams: [],
      leagues: [],
      players: []
    },
    ai: {
      models: [],
      benchmarks: [],
      companies: []
    }
  },
  settings: {}
};

const readConfig = () => {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    throw error;
  }
};

const writeConfig = (config) => {
  const contents = JSON.stringify(config, null, 2) + '\n';
  fs.writeFileSync(CONFIG_PATH, contents);
};

const ensureTrackedItems = (config) => {
  if (!config.trackedItems) {
    config.trackedItems = {};
  }
  if (!Array.isArray(config.trackedItems.watches)) {
    config.trackedItems.watches = [];
  }
  if (!Array.isArray(config.trackedItems.cars)) {
    config.trackedItems.cars = [];
  }
  if (!Array.isArray(config.trackedItems.sneakers)) {
    config.trackedItems.sneakers = [];
  }
  if (!config.trackedItems.sports) {
    config.trackedItems.sports = {};
  }
  if (!Array.isArray(config.trackedItems.sports.teams)) {
    config.trackedItems.sports.teams = [];
  }
  if (!Array.isArray(config.trackedItems.sports.leagues)) {
    config.trackedItems.sports.leagues = [];
  }
  if (!Array.isArray(config.trackedItems.sports.players)) {
    config.trackedItems.sports.players = [];
  }
  if (!config.trackedItems.ai) {
    config.trackedItems.ai = {};
  }
  if (!Array.isArray(config.trackedItems.ai.models)) {
    config.trackedItems.ai.models = [];
  }
  if (!Array.isArray(config.trackedItems.ai.benchmarks)) {
    config.trackedItems.ai.benchmarks = [];
  }
  if (!Array.isArray(config.trackedItems.ai.companies)) {
    config.trackedItems.ai.companies = [];
  }
};

const slugify = (value) => {
  if (!value) {
    return '';
  }
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const normalized = String(value).replace(/[^0-9.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

module.exports = {
  readConfig,
  writeConfig,
  ensureTrackedItems,
  slugify,
  toNumber
};
