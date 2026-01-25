const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const WatchTracker = require('../trackers/watches');
const CarTracker = require('../trackers/cars');
const SneakerTracker = require('../trackers/sneakers');
const SportsTracker = require('../trackers/sports');
const AiTracker = require('../trackers/ai');
const { readConfig } = require('../trackers/utils/config');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

const watchTracker = new WatchTracker();
const carTracker = new CarTracker();
const sneakerTracker = new SneakerTracker();
const sportsTracker = new SportsTracker();
const aiTracker = new AiTracker();

// Middleware
app.use(cors());
app.use(express.json());

// Crawler detection middleware
const CrawlerDetection = require('../middleware/crawlerDetection');
app.use(CrawlerDetection.detect);

// Performance monitoring middleware
const performanceMonitor = require('../services/performanceMonitor');
app.use(performanceMonitor.middleware());

// Response caching middleware
const cacheMiddleware = require('../middleware/caching');

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'API Server is running!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const handleRoute = (handler) => async (req, res) => {
  try {
    const data = await handler(req);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Watch tracker endpoints
app.get('/watches', handleRoute((req) => watchTracker.listWatches(req.query)));
app.get('/watches/:id', handleRoute((req) => watchTracker.getWatch(req.params.id)));
app.post('/watches', handleRoute((req) => watchTracker.addWatch(req.body)));
app.put('/watches/:id', handleRoute((req) => watchTracker.updateWatch(req.params.id, req.body)));
app.delete('/watches/:id', handleRoute((req) => watchTracker.deleteWatch(req.params.id)));

// Car tracker endpoints
app.get('/cars', handleRoute((req) => carTracker.listCars(req.query)));
app.get('/cars/:id', handleRoute((req) => carTracker.getCar(req.params.id)));
app.post('/cars', handleRoute((req) => carTracker.addCar(req.body)));
app.put('/cars/:id', handleRoute((req) => carTracker.updateCar(req.params.id, req.body)));
app.delete('/cars/:id', handleRoute((req) => carTracker.deleteCar(req.params.id)));

// Sneaker tracker endpoints
app.get('/sneakers', handleRoute((req) => sneakerTracker.listSneakers(req.query)));
app.get('/sneakers/:id', handleRoute((req) => sneakerTracker.getSneaker(req.params.id)));
app.post('/sneakers', handleRoute((req) => sneakerTracker.addSneaker(req.body)));
app.put('/sneakers/:id', handleRoute((req) => sneakerTracker.updateSneaker(req.params.id, req.body)));
app.delete('/sneakers/:id', handleRoute((req) => sneakerTracker.deleteSneaker(req.params.id)));

// Sports tracker endpoints
app.get('/sports/scores', handleRoute((req) => sportsTracker.getScores(req.query)));
app.get('/sports/schedule', handleRoute((req) => sportsTracker.getSchedule(req.query)));
app.post('/sports/teams', handleRoute((req) => sportsTracker.addTeam(req.body)));

// AI tracker endpoints
app.get('/ai/news', handleRoute((req) => aiTracker.getNews(req.query)));
app.get('/ai/summary', handleRoute((req) => aiTracker.getSummary(req.query)));

// ============================================================================
// SCRAPER ENDPOINTS (New Modular Scraping Framework)
// ============================================================================

const ScraperManager = require('../services/scraping/ScraperManager');
const WatchScraperScheduler = require('../schedulers/watchScraperScheduler');
const DealScoringScheduler = require('../schedulers/dealScoringScheduler');
const supabase = require('../db/supabase');
const localWatchListings = require('../db/localWatchListings');

const scraperManager = new ScraperManager();
const scraperScheduler = new WatchScraperScheduler(io);
const dealScoringScheduler = new DealScoringScheduler(io);

// Start scraper scheduler if enabled
if (process.env.ENABLE_SCRAPER_SCHEDULER === 'true') {
  scraperScheduler.start();
}

// Start deal scoring scheduler if enabled (default: enabled with 1 hour interval)
if (process.env.ENABLE_DEAL_SCORING_SCHEDULER !== 'false') {
  const intervalMinutes = parseInt(process.env.DEAL_SCORING_INTERVAL_MINUTES) || 60;
  dealScoringScheduler.start(intervalMinutes * 60 * 1000);
}

// Get all watch listings
app.get('/scraper/listings', handleRoute(async (req) => {
  const filters = {
    source: req.query.source,
    brand: req.query.brand,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
    limit: req.query.limit ? parseInt(req.query.limit) : 50
  };

  let result;
  if (supabase.isAvailable()) {
    result = await supabase.getWatchListings(filters);
  } else {
    result = await localWatchListings.getWatchListings(filters);
  }

  return result.data || [];
}));

// Scrape a specific source
app.post('/scraper/scrape/:source', handleRoute(async (req) => {
  const { source } = req.params;
  const query = req.body.query || req.query.query;
  const options = req.body.options || {};

  const result = await scraperManager.scrapeSource(source, query, options);

  // Save to database
  const listings = result.listings || result || [];
  if (listings.length > 0) {
    if (supabase.isAvailable()) {
      await supabase.addWatchListingsBatch(listings);
    } else {
      await localWatchListings.addWatchListingsBatch(listings);
    }
  }

  return {
    source,
    count: listings.length,
    listings: listings.slice(0, 10), // Return first 10 for preview
    pagination: result.pagination
  };
}));

// Search for a specific watch across all sources
app.post('/scraper/search', handleRoute(async (req) => {
  const { brand, model, options } = req.body;

  const result = await scraperManager.searchWatch(brand, model, options || {});

  // Save to database
  if (result.allListings.length > 0) {
    if (supabase.isAvailable()) {
      await supabase.addWatchListingsBatch(result.allListings);
    } else {
      await localWatchListings.addWatchListingsBatch(result.allListings);
    }
  }

  return result;
}));

// Get scraper statistics
app.get('/scraper/stats', handleRoute(async () => {
  return scraperManager.getStats();
}));

// Get scraper scheduler status
app.get('/scraper/scheduler/status', handleRoute(async () => {
  return scraperScheduler.getStatus();
}));

// Manually trigger scraper scheduler
app.post('/scraper/scheduler/run', handleRoute(async (req) => {
  const { source } = req.body;

  if (source) {
    const result = await scraperScheduler.runSource(source);
    return result;
  } else {
    const results = await scraperScheduler.runAll();
    return results;
  }
}));

// Add watch to watchlist
app.post('/scraper/watchlist', handleRoute(async (req) => {
  const { brand, model, options } = req.body;
  scraperScheduler.addToWatchlist(brand, model, options || {});
  return { success: true, message: `Added ${brand} ${model} to watchlist` };
}));

// Remove from watchlist
app.delete('/scraper/watchlist', handleRoute(async (req) => {
  const { brand, model } = req.body;
  scraperScheduler.removeFromWatchlist(brand, model);
  return { success: true, message: `Removed ${brand} ${model} from watchlist` };
}));

// Get available scraper sources
app.get('/scraper/sources', handleRoute(async () => {
  return {
    sources: scraperManager.getAvailableSources(),
    count: scraperManager.getAvailableSources().length
  };
}));

// ============================================================================
// ADMIN SCRAPER CONTROL ENDPOINTS
// ============================================================================

const { router: scraperAdminRouter } = require('./scraperAdmin');
app.use('/admin/scraper', scraperAdminRouter);

// ============================================================================
// BLOG API ENDPOINTS
// ============================================================================

const blogAPI = require('./blog/blogAPI');

// Blog Posts (with caching for GET requests)
app.get('/api/blog/posts',
  cacheMiddleware.cache({ maxAge: 2 * 60 * 1000 }), // 2 minutes
  handleRoute((req) => blogAPI.getPosts(req))
);
app.get('/api/blog/posts/:slug',
  cacheMiddleware.cache({ maxAge: 5 * 60 * 1000 }), // 5 minutes
  handleRoute((req) => blogAPI.getPostBySlug(req))
);
app.get('/api/blog/posts/id/:id',
  cacheMiddleware.cache({ maxAge: 5 * 60 * 1000 }),
  handleRoute((req) => blogAPI.getPostById(req))
);
app.post('/api/blog/posts', handleRoute((req) => {
  // Invalidate cache on create
  cacheMiddleware.clear('/api/blog/posts');
  return blogAPI.createPost(req);
}));
app.put('/api/blog/posts/:id', handleRoute((req) => {
  // Invalidate cache on update
  cacheMiddleware.clear('/api/blog/posts');
  return blogAPI.updatePost(req);
}));
app.delete('/api/blog/posts/:id', handleRoute((req) => {
  // Invalidate cache on delete
  cacheMiddleware.clear('/api/blog/posts');
  return blogAPI.deletePost(req);
}));

// Blog Categories (cached for 10 minutes)
app.get('/api/blog/categories',
  cacheMiddleware.cache({ maxAge: 10 * 60 * 1000 }),
  handleRoute((req) => blogAPI.getCategories(req))
);

// Blog Analytics
app.post('/api/blog/posts/:id/view', handleRoute((req) => blogAPI.trackView(req)));
app.get('/api/blog/analytics/:id', handleRoute((req) => blogAPI.getPostAnalytics(req)));

// Blog Subscribers
app.post('/api/blog/subscribe', handleRoute((req) => blogAPI.subscribe(req)));
app.get('/api/blog/subscribers', handleRoute((req) => blogAPI.getSubscribers(req)));

// ============================================================================
// DEAL SCORING API ENDPOINTS (AI Features)
// ============================================================================

const dealScoringAPI = require('./dealScoring');

// Deal Scoring
app.post('/api/listings/score/:id', handleRoute((req) => dealScoringAPI.scoreListing(req)));
app.post('/api/listings/score-all', handleRoute((req) => dealScoringAPI.scoreAllListings(req)));
app.get('/api/listings/hot-deals', handleRoute((req) => dealScoringAPI.getHotDeals(req)));
app.get('/api/listings/score-stats', handleRoute((req) => dealScoringAPI.getScoreStats(req)));
app.post('/api/listings/ai-rarity', handleRoute((req) => dealScoringAPI.toggleAIRarity(req)));

// Deal Scoring Scheduler Control
app.get('/api/deal-scoring/scheduler/status', handleRoute(async () => {
  return dealScoringScheduler.getStatus();
}));

app.post('/api/deal-scoring/scheduler/start', handleRoute(async (req) => {
  const intervalMinutes = req.body.intervalMinutes || 60;
  dealScoringScheduler.start(intervalMinutes * 60 * 1000);
  return { success: true, message: 'Deal scoring scheduler started', status: dealScoringScheduler.getStatus() };
}));

app.post('/api/deal-scoring/scheduler/stop', handleRoute(async () => {
  dealScoringScheduler.stop();
  return { success: true, message: 'Deal scoring scheduler stopped' };
}));

app.post('/api/deal-scoring/scheduler/run-now', handleRoute(async () => {
  const result = await dealScoringScheduler.forceRun();
  return { success: true, message: 'Manual scoring run completed', result };
}));

// ============================================================================
// AI CONTENT GENERATION API ENDPOINTS
// ============================================================================

const aiGenerationAPI = require('./aiGeneration');

// AI Blog Post Generation
app.post('/api/blog/ai/generate', handleRoute((req) => aiGenerationAPI.generatePost(req)));
app.post('/api/blog/ai/generate-batch', handleRoute((req) => aiGenerationAPI.generateBatch(req)));
app.post('/api/blog/ai/suggest-titles', handleRoute((req) => aiGenerationAPI.suggestTitles(req)));
app.post('/api/blog/ai/enhance', handleRoute((req) => aiGenerationAPI.enhanceContent(req)));
app.get('/api/blog/ai/stats', handleRoute((req) => aiGenerationAPI.getStats(req)));

// ============================================================================
// NATURAL LANGUAGE SEARCH API ENDPOINTS
// ============================================================================

const naturalSearchAPI = require('./naturalSearch');

// Natural Language Search
app.post('/api/search/watches', handleRoute((req) => naturalSearchAPI.searchWatches(req)));
app.post('/api/search/sneakers', handleRoute((req) => naturalSearchAPI.searchSneakers(req)));
app.post('/api/search/cars', handleRoute((req) => naturalSearchAPI.searchCars(req)));

// ============================================================================
// SEO ENDPOINTS (Sitemap, RSS, Robots.txt)
// ============================================================================

const sitemapGenerator = require('./sitemap');
const rssGenerator = require('./rss');
const blogSSR = require('./blogSSR');

// Sitemap and Robots
app.get('/sitemap.xml', (req, res) => sitemapGenerator.generateSitemap(req, res));
app.get('/robots.txt', (req, res) => sitemapGenerator.generateRobotsTxt(req, res));

// RSS Feeds (cached for 1 hour)
app.get('/rss.xml',
  cacheMiddleware.cache({ maxAge: 60 * 60 * 1000 }),
  (req, res) => rssGenerator.generateRSS(req, res)
);
app.get('/feed.json',
  cacheMiddleware.cache({ maxAge: 60 * 60 * 1000 }),
  (req, res) => rssGenerator.generateJSONFeed(req, res)
);

// ============================================================================
// PERFORMANCE MONITORING & OPTIMIZATION
// ============================================================================

// Performance metrics
app.get('/api/admin/performance/metrics', handleRoute(async () => {
  return performanceMonitor.getMetrics();
}));

app.get('/api/admin/performance/summary', handleRoute(async () => {
  return performanceMonitor.getSummary();
}));

app.get('/api/admin/performance/slow', handleRoute(async (req) => {
  const threshold = parseInt(req.query.threshold) || 1000;
  return performanceMonitor.getSlowEndpoints(threshold);
}));

app.get('/api/admin/performance/errors', handleRoute(async () => {
  return performanceMonitor.getErrorProneEndpoints();
}));

app.post('/api/admin/performance/clear', handleRoute(async () => {
  return performanceMonitor.clear();
}));

app.get('/api/admin/performance/export', handleRoute(async () => {
  return performanceMonitor.exportMetrics();
}));

// Cache management
app.get('/api/admin/cache/stats', handleRoute(async () => {
  return cacheMiddleware.getStats();
}));

app.post('/api/admin/cache/clear', handleRoute(async (req) => {
  const { pattern } = req.body;
  cacheMiddleware.clear(pattern);
  return { success: true, message: 'Cache cleared' };
}));

app.post('/api/admin/cache/invalidate', handleRoute(async (req) => {
  const { key } = req.body;
  const deleted = cacheMiddleware.invalidate(key);
  return { success: true, deleted };
}));

// ============================================================================
// SERVER-SIDE RENDERING (SSR) FOR CRAWLERS
// ============================================================================

// Blog SSR routes - serve rendered HTML to crawlers, let SPA handle regular users
app.get('/blog', (req, res, next) => {
  if (req.isCrawler) {
    return blogSSR.renderBlogIndex(req, res);
  }
  next(); // Let frontend SPA handle it
});

app.get('/blog/:slug', (req, res, next) => {
  if (req.isCrawler) {
    return blogSSR.renderBlogPost(req, res);
  }
  next(); // Let frontend SPA handle it
});

// Stats endpoint for dashboard
app.get('/stats', handleRoute(async () => {
  const watches = await watchTracker.listWatches();
  const cars = await carTracker.listCars();
  const sneakers = await sneakerTracker.listSneakers();
  const aiSummary = await aiTracker.getSummary();

  return {
    watches: watches.length,
    cars: cars.length,
    sneakers: sneakers.length,
    aiModels: aiSummary.counts?.models || 0
  };
}));

// Alerts endpoint
app.get('/alerts', handleRoute(async () => {
  const config = readConfig();

  // Get alerts from config.json
  const configAlerts = config.alerts || [];

  // Also get sent alerts from alertManager
  const AlertManager = require('../notifications/alertManager');
  const alertManager = new AlertManager();
  const sentAlerts = alertManager.getSentAlerts();

  // Combine both sources
  const alerts = [
    ...configAlerts,
    ...Object.entries(sentAlerts).map(([key, timestamp]) => {
      const [type, ...idParts] = key.split(':');
      const id = idParts.join(':');

      return {
        id: key,
        itemType: type,
        itemId: id,
        createdAt: timestamp,
        message: `Alert for ${id}`,
        triggered: true
      };
    })
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return alerts.slice(0, 10); // Return latest 10 alerts
}));

// Price history endpoint
app.get('/:type/:id/history', handleRoute(async (req) => {
  const { type, id } = req.params;
  const limit = parseInt(req.query.limit) || 30;

  const supabase = require('../db/supabase');
  const localPriceHistory = require('../db/localPriceHistory');

  let history;
  if (supabase.isAvailable()) {
    history = await supabase.getPriceHistory(type, id, limit);
  } else {
    history = await localPriceHistory.getPriceHistory(type, id, limit);
  }

  return history.data || [];
}));

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log(`👤 Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`👋 Client disconnected: ${socket.id}`);
  });

  // Send welcome message
  socket.emit('connected', {
    message: 'Connected to The Hub API',
    timestamp: new Date().toISOString()
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`✅ API Server is running on port ${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready`);
});

// Export io for use in other modules
module.exports = { app, io };
