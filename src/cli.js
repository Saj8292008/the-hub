#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  showHelp();
  process.exit(0);
}

const [category, action, ...params] = args;

switch (category) {
  case 'watches':
    handleWatches(action, params);
    break;
  case 'cars':
    handleCars(action, params);
    break;
  case 'sneakers':
    handleSneakers(action, params);
    break;
  case 'sports':
    handleSports(action, params);
    break;
  case 'ai':
    handleAI(action, params);
    break;
  default:
    console.log(`Unknown category: ${category}`);
    showHelp();
}

function showHelp() {
  console.log(`
The Hub - Personal Data Tracker

Usage: hub <category> <action> [params]

Categories:
  watches   - Track watch prices and releases
  cars      - Track car prices and specs
  sneakers  - Track sneaker releases and prices
  sports    - Track sports scores and stats
  ai        - Track AI model releases and benchmarks

Actions:
  list      - List tracked items
  add       - Add new item to track
  remove    - Remove tracked item
  update    - Update tracked item
  prices    - Check current prices (watches, cars, sneakers)
  scores    - Get latest scores (sports)
  releases  - Check new releases (ai)

Examples:
  hub watches list
  hub sports scores
  hub sneakers add "Air Jordan 1"
  hub cars prices
`);
}

function handleWatches(action, params) {
  const WatchTracker = require('./trackers/watches');
  const tracker = new WatchTracker();

  switch (action) {
    case 'list':
      tracker.listWatches();
      break;
    case 'add':
      if (params.length < 2) {
        console.log('Usage: hub watches add <brand> <model> [specificModel] [targetPrice]');
        console.log('Example: hub watches add rolex submariner 116610LN 9000');
        return;
      }
      const [brand, model, specificModel, targetPrice] = params;
      try {
        tracker.addWatch(
          brand, 
          model, 
          specificModel || null, 
          targetPrice ? parseInt(targetPrice) : null
        );
      } catch (error) {
        console.error(`Error: ${error.message}`);
      }
      break;
    case 'remove':
      if (params.length === 0) {
        console.log('Usage: hub watches remove <watchId>');
        return;
      }
      tracker.removeWatch(params[0]);
      break;
    case 'prices':
      tracker.checkPrices(params[0] || null);
      break;
    case 'history':
      if (params.length === 0) {
        console.log('Usage: hub watches history <watchId>');
        return;
      }
      tracker.getPriceHistory(params[0]);
      break;
    default:
      console.log(`Unknown action: ${action}`);
      console.log('Available actions: list, add, remove, prices, history');
  }
}

function handleCars(action, params) {
  console.log(`Handling cars: ${action}`);
  // TODO: Implement car tracking functionality
}

function handleSneakers(action, params) {
  console.log(`Handling sneakers: ${action}`);
  // TODO: Implement sneaker tracking functionality
}

function handleSports(action, params) {
  console.log(`Handling sports: ${action}`);
  // TODO: Implement sports tracking functionality
}

function handleAI(action, params) {
  console.log(`Handling AI: ${action}`);
  // TODO: Implement AI tracking functionality
}
