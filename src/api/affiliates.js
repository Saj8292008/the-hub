/**
 * Affiliate Management API
 * Track and manage affiliate programs
 */

const express = require('express');
const router = express.Router();
const affiliateLinks = require('../utils/affiliateLinks');

/**
 * GET /api/affiliates/status
 * Get status of all affiliate programs
 */
router.get('/status', (req, res) => {
  res.json(affiliateLinks.getAffiliateStatus());
});

/**
 * POST /api/affiliates/convert
 * Convert a URL to affiliate link
 */
router.post('/convert', (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL required' });
  }

  const affiliateUrl = affiliateLinks.convertToAffiliateLink(url);
  const wasConverted = affiliateUrl !== url;

  res.json({
    original: url,
    affiliate: affiliateUrl,
    converted: wasConverted
  });
});

/**
 * POST /api/affiliates/process-text
 * Process text and convert all URLs to affiliate links
 */
router.post('/process-text', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text required' });
  }

  const processed = affiliateLinks.processTextForAffiliateLinks(text);

  res.json({
    original: text,
    processed
  });
});

/**
 * POST /api/affiliates/enable
 * Enable/disable an affiliate program
 */
router.post('/enable', (req, res) => {
  const { program, enabled } = req.body;
  
  if (!program) {
    return res.status(400).json({ error: 'Program name required' });
  }

  const success = affiliateLinks.setAffiliateEnabled(program, enabled);
  
  if (success) {
    res.json({ 
      success: true, 
      message: `${program} ${enabled ? 'enabled' : 'disabled'}` 
    });
  } else {
    res.status(404).json({ error: 'Program not found' });
  }
});

module.exports = router;
