/**
 * Crawler Detection Middleware
 * Detects if request is from a crawler/bot
 */

const crawlerUserAgents = [
  'googlebot',
  'bingbot',
  'slurp',
  'duckduckbot',
  'baiduspider',
  'yandexbot',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot'
];

function detect(req, res, next) {
  const userAgent = (req.headers['user-agent'] || '').toLowerCase();
  
  req.isCrawler = crawlerUserAgents.some(crawler => 
    userAgent.includes(crawler)
  );
  
  next();
}

module.exports = {
  detect
};
