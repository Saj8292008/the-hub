/**
 * Email Sequences API Routes
 * REST endpoints for managing drip email sequences
 */

const express = require('express');
const router = express.Router();
const sequenceService = require('../services/sequences/sequenceService');

// ============================================================================
// SEQUENCE ROUTES
// ============================================================================

/**
 * GET /api/sequences
 * Get all sequences with stats
 */
router.get('/', async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const sequences = await sequenceService.getSequences(includeInactive);

    res.json({
      success: true,
      sequences
    });
  } catch (error) {
    console.error('Get sequences error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sequences/:id
 * Get single sequence with full details
 */
router.get('/:id', async (req, res) => {
  try {
    const sequence = await sequenceService.getSequence(req.params.id);

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    console.error('Get sequence error:', error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sequences
 * Create new sequence
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, trigger_event, is_active } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    const sequence = await sequenceService.createSequence({
      name,
      description,
      trigger_event,
      is_active
    });

    res.status(201).json({
      success: true,
      sequence
    });
  } catch (error) {
    console.error('Create sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/sequences/:id
 * Update sequence
 */
router.put('/:id', async (req, res) => {
  try {
    const { name, description, trigger_event, is_active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (trigger_event !== undefined) updates.trigger_event = trigger_event;
    if (is_active !== undefined) updates.is_active = is_active;

    const sequence = await sequenceService.updateSequence(req.params.id, updates);

    res.json({
      success: true,
      sequence
    });
  } catch (error) {
    console.error('Update sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/sequences/:id
 * Delete sequence
 */
router.delete('/:id', async (req, res) => {
  try {
    await sequenceService.deleteSequence(req.params.id);

    res.json({
      success: true,
      message: 'Sequence deleted'
    });
  } catch (error) {
    console.error('Delete sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// EMAIL ROUTES
// ============================================================================

/**
 * POST /api/sequences/:id/emails
 * Add email to sequence
 */
router.post('/:id/emails', async (req, res) => {
  try {
    const {
      step_number,
      delay_days,
      delay_hours,
      subject,
      subject_variant,
      content_html,
      content_text,
      is_active
    } = req.body;

    if (!step_number || !subject || !content_html) {
      return res.status(400).json({
        success: false,
        error: 'step_number, subject, and content_html are required'
      });
    }

    const email = await sequenceService.addEmail(req.params.id, {
      step_number,
      delay_days,
      delay_hours,
      subject,
      subject_variant,
      content_html,
      content_text,
      is_active
    });

    res.status(201).json({
      success: true,
      email
    });
  } catch (error) {
    console.error('Add email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/sequences/emails/:emailId
 * Update sequence email
 */
router.put('/emails/:emailId', async (req, res) => {
  try {
    const updates = {};
    const allowedFields = [
      'step_number', 'delay_days', 'delay_hours', 'subject',
      'subject_variant', 'content_html', 'content_text', 'is_active'
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const email = await sequenceService.updateEmail(req.params.emailId, updates);

    res.json({
      success: true,
      email
    });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/sequences/emails/:emailId
 * Delete sequence email
 */
router.delete('/emails/:emailId', async (req, res) => {
  try {
    await sequenceService.deleteEmail(req.params.emailId);

    res.json({
      success: true,
      message: 'Email deleted'
    });
  } catch (error) {
    console.error('Delete email error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// SUBSCRIBER ENROLLMENT ROUTES
// ============================================================================

/**
 * POST /api/sequences/:id/enroll
 * Manually enroll subscriber in sequence
 */
router.post('/:id/enroll', async (req, res) => {
  try {
    const { subscriber_id } = req.body;

    if (!subscriber_id) {
      return res.status(400).json({
        success: false,
        error: 'subscriber_id is required'
      });
    }

    const progress = await sequenceService.enrollSubscriber(subscriber_id, req.params.id);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Enroll subscriber error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sequences/subscriber/:subscriberId
 * Get subscriber's sequence status
 */
router.get('/subscriber/:subscriberId', async (req, res) => {
  try {
    const status = await sequenceService.getSubscriberSequenceStatus(req.params.subscriberId);

    res.json({
      success: true,
      sequences: status
    });
  } catch (error) {
    console.error('Get subscriber status error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sequences/progress/:progressId/pause
 * Pause subscriber's sequence
 */
router.post('/progress/:progressId/pause', async (req, res) => {
  try {
    const progress = await sequenceService.pauseSubscriberSequence(req.params.progressId);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Pause sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sequences/progress/:progressId/resume
 * Resume subscriber's sequence
 */
router.post('/progress/:progressId/resume', async (req, res) => {
  try {
    const progress = await sequenceService.resumeSubscriberSequence(req.params.progressId);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Resume sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sequences/progress/:progressId/cancel
 * Cancel subscriber's sequence
 */
router.post('/progress/:progressId/cancel', async (req, res) => {
  try {
    const progress = await sequenceService.cancelSubscriberSequence(req.params.progressId);

    res.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Cancel sequence error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// PROCESSING ROUTES (for testing/manual triggers)
// ============================================================================

/**
 * POST /api/sequences/process
 * Manually trigger sequence processing
 */
router.post('/process', async (req, res) => {
  try {
    const result = await sequenceService.processDueEmails();

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Process sequences error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
