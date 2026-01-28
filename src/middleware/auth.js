/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication for protected routes
 */

const { verifyAccessToken } = require('../utils/auth');
const logger = require('../utils/logger');

/**
 * Required authentication middleware
 * Verifies JWT access token from httpOnly cookie
 * Fails request if token is missing or invalid
 *
 * @middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      logger.warn('Authentication attempt without access token');
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Verify and decode the token
    const decoded = verifyAccessToken(accessToken);

    // Attach user ID to request for downstream handlers
    req.userId = decoded.userId;

    logger.debug(`User ${decoded.userId} authenticated successfully`);
    next();
  } catch (error) {
    logger.warn('Token verification failed:', error.message);

    // Clear invalid token cookie
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Provide specific error message
    if (error.message === 'Token expired') {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please refresh your token or log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    return res.status(401).json({
      error: 'Invalid token',
      message: 'Authentication failed. Please log in again.',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Optional authentication middleware
 * Verifies token if present, but doesn't fail if missing
 * Useful for routes that work with or without authentication
 *
 * @middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const optionalAuth = (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      // No token present, continue without authentication
      req.userId = null;
      return next();
    }

    // Token present, try to verify it
    const decoded = verifyAccessToken(accessToken);
    req.userId = decoded.userId;

    logger.debug(`Optional auth: User ${decoded.userId} authenticated`);
    next();
  } catch (error) {
    // Token present but invalid - clear it and continue
    logger.debug('Optional auth: Invalid token, continuing without authentication');

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    req.userId = null;
    next();
  }
};

/**
 * Check if user is verified
 * Must be used after authenticateToken middleware
 *
 * @middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const requireVerifiedEmail = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be logged in to access this resource'
      });
    }

    // Get user from database to check verification status
    const { pool } = require('../db/supabase');
    const result = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: 'User not found',
        message: 'Your account could not be found'
      });
    }

    const user = result.rows[0];

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address to access this resource',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking email verification:', error);
    return res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify email status'
    });
  }
};

/**
 * Check if user has required subscription tier
 * Must be used after authenticateToken middleware
 *
 * @param {string[]} allowedTiers - Array of allowed tier names (e.g., ['premium', 'pro', 'enterprise'])
 * @returns {function} Middleware function
 */
const requireSubscription = (allowedTiers = ['premium', 'pro', 'enterprise']) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'You must be logged in to access this resource'
        });
      }

      // Get user subscription tier from database
      const { pool } = require('../db/supabase');
      const result = await pool.query(
        'SELECT tier, subscription_ends_at FROM users WHERE id = $1',
        [req.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({
          error: 'User not found',
          message: 'Your account could not be found'
        });
      }

      const user = result.rows[0];

      // Check if user has an allowed tier
      if (!allowedTiers.includes(user.tier)) {
        return res.status(403).json({
          error: 'Subscription required',
          message: `This feature requires a ${allowedTiers.join(' or ')} subscription`,
          code: 'SUBSCRIPTION_REQUIRED',
          userTier: user.tier
        });
      }

      // Check if subscription hasn't expired
      if (user.subscription_ends_at) {
        const now = new Date();
        const expiresAt = new Date(user.subscription_ends_at);

        if (now > expiresAt) {
          return res.status(403).json({
            error: 'Subscription expired',
            message: 'Your subscription has expired. Please renew to access this feature.',
            code: 'SUBSCRIPTION_EXPIRED',
            expiredAt: user.subscription_ends_at
          });
        }
      }

      // Attach tier to request for downstream handlers
      req.userTier = user.tier;
      next();
    } catch (error) {
      logger.error('Error checking subscription:', error);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to verify subscription status'
      });
    }
  };
};

/**
 * Rate limiting for authentication endpoints
 * Prevents brute force attacks
 */
const rateLimit = require('express-rate-limit');

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: {
    error: 'Too many attempts',
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true
});

const strictAuthRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per window
  message: {
    error: 'Too many attempts',
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authenticateToken,
  optionalAuth,
  requireVerifiedEmail,
  requireSubscription,
  authRateLimit,
  strictAuthRateLimit
};
