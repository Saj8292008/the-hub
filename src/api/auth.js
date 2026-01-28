/**
 * Authentication API Routes
 * Handles user signup, login, logout, token refresh, password reset, and email verification
 */

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);
const {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateToken,
  validatePasswordStrength,
  validateEmail,
  sanitizeInput,
  isAccountLocked,
  getLockDuration
} = require('../utils/auth');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
} = require('../utils/email');
const {
  authenticateToken,
  authRateLimit,
  strictAuthRateLimit
} = require('../middleware/auth');
const logger = require('../utils/logger');

// ============================================
// SIGNUP - Create new user account
// ============================================

router.post('/signup', authRateLimit, async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email.toLowerCase());
    const sanitizedFirstName = sanitizeInput(firstName || '');
    const sanitizedLastName = sanitizeInput(lastName || '');

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('id, email_verified')
      .eq('email', sanitizedEmail);

    if (checkError) {
      logger.error('Error checking existing user:', checkError);
      return res.status(500).json({
        error: 'Server error',
        message: 'Failed to check user existence'
      });
    }

    if (existingUsers && existingUsers.length > 0) {
      const existingUser = existingUsers[0];
      // User exists - check if verified
      if (existingUser.email_verified) {
        return res.status(409).json({
          error: 'Email already registered',
          message: 'An account with this email already exists. Please log in.'
        });
      } else {
        // User exists but not verified - resend verification
        const verificationToken = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await supabase
          .from('users')
          .update({
            verification_token: verificationToken,
            verification_token_expires_at: expiresAt.toISOString()
          })
          .eq('id', existingUser.id);

        await sendVerificationEmail(sanitizedEmail, verificationToken, sanitizedFirstName);

        return res.status(200).json({
          message: 'Verification email resent',
          note: 'An account with this email exists but is not verified. We have sent a new verification email.'
        });
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateToken();
    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const { data: newUsers, error: insertError } = await supabase
      .from('users')
      .insert([{
        email: sanitizedEmail,
        password_hash: passwordHash,
        first_name: sanitizedFirstName,
        last_name: sanitizedLastName,
        verification_token: verificationToken,
        verification_token_expires_at: verificationExpiresAt.toISOString()
      }])
      .select('id, email, first_name, last_name, created_at');

    if (insertError) {
      logger.error('Error creating user:', insertError);
      throw insertError;
    }

    const user = newUsers[0];

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken, user.first_name);

    logger.info(`New user registered: ${user.email} (ID: ${user.id})`);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      },
      note: 'Please check your email to verify your account'
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to create account. Please try again.'
    });
  }
});

// ============================================
// LOGIN - Authenticate user
// ============================================

router.post('/login', authRateLimit, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Get user from database
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, email, password_hash, first_name, last_name, email_verified, failed_login_attempts, locked_until, tier')
      .eq('email', sanitizedEmail);

    if (queryError || !users || users.length === 0) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    const user = users[0];

    // Check if account is locked
    if (isAccountLocked(user)) {
      const lockedUntil = new Date(user.locked_until);
      const minutesLeft = Math.ceil((lockedUntil - new Date()) / 60000);

      return res.status(423).json({
        error: 'Account locked',
        message: `Too many failed login attempts. Account is locked for ${minutesLeft} more minutes.`,
        lockedUntil: user.locked_until
      });
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      // Increment failed attempts
      const newAttempts = user.failed_login_attempts + 1;
      const lockDuration = getLockDuration(newAttempts);
      const lockedUntil = lockDuration > 0
        ? new Date(Date.now() + lockDuration * 60 * 1000)
        : null;

      await supabase
        .from('users')
        .update({
          failed_login_attempts: newAttempts,
          locked_until: lockedUntil ? lockedUntil.toISOString() : null
        })
        .eq('id', user.id);

      logger.warn(`Failed login attempt for ${user.email} (${newAttempts} attempts)`);

      if (lockDuration > 0) {
        return res.status(423).json({
          error: 'Account locked',
          message: `Too many failed attempts. Account locked for ${lockDuration} minutes.`,
          lockedUntil
        });
      }

      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check if email is verified
    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email address before logging in',
        code: 'EMAIL_NOT_VERIFIED'
      });
    }

    // Successful login - reset failed attempts
    const clientIp = req.ip || req.connection.remoteAddress;
    await supabase
      .from('users')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
        last_login_at: new Date().toISOString(),
        last_login_ip: clientIp
      })
      .eq('id', user.id);

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in database
    const refreshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const userAgent = req.headers['user-agent'] || '';

    await supabase
      .from('refresh_tokens')
      .insert([{
        user_id: user.id,
        token: refreshToken,
        expires_at: refreshExpiresAt.toISOString(),
        created_ip: clientIp,
        user_agent: userAgent
      }]);

    // Set httpOnly cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        tier: user.tier
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to log in. Please try again.'
    });
  }
});

// ============================================
// LOGOUT - Clear tokens and end session
// ============================================

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    // Remove refresh token from database
    if (refreshToken) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
    }

    // Clear cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    };

    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);

    logger.info(`User logged out: ID ${req.userId}`);

    res.json({ message: 'Logout successful' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to log out. Please try again.'
    });
  }
});

// ============================================
// REFRESH TOKEN - Get new access token
// ============================================

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'No refresh token',
        message: 'Please log in again'
      });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      // Clear invalid refresh token
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
      });

      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Please log in again',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Check if refresh token exists in database
    const tokenResult = await pool.query(
      'SELECT id, user_id, expires_at FROM refresh_tokens WHERE token = $1',
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Refresh token not found',
        message: 'Please log in again'
      });
    }

    const tokenData = tokenResult.rows[0];

    // Check if token is expired
    if (new Date() > new Date(tokenData.expires_at)) {
      await pool.query('DELETE FROM refresh_tokens WHERE id = $1', [tokenData.id]);

      return res.status(401).json({
        error: 'Refresh token expired',
        message: 'Please log in again'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(decoded.userId);

    // Set new access token cookie
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    logger.debug(`Access token refreshed for user ${decoded.userId}`);

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to refresh token. Please try again.'
    });
  }
});

// ============================================
// FORGOT PASSWORD - Request password reset
// ============================================

router.post('/forgot-password', strictAuthRateLimit, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Missing email',
        message: 'Email is required'
      });
    }

    const sanitizedEmail = sanitizeInput(email.toLowerCase());

    // Get user from database
    const result = await pool.query(
      'SELECT id, first_name, email_verified FROM users WHERE email = $1',
      [sanitizedEmail]
    );

    // Always return success to prevent email enumeration
    const successResponse = {
      message: 'If an account exists with this email, a password reset link has been sent.'
    };

    if (result.rows.length === 0) {
      logger.warn(`Password reset requested for non-existent email: ${sanitizedEmail}`);
      return res.json(successResponse);
    }

    const user = result.rows[0];

    // Only send reset email if account is verified
    if (!user.email_verified) {
      logger.warn(`Password reset requested for unverified account: ${sanitizedEmail}`);
      return res.json(successResponse);
    }

    // Generate reset token
    const resetToken = generateToken();
    const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await pool.query(
      'UPDATE users SET reset_token = $1, reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, resetExpiresAt, user.id]
    );

    // Send reset email
    await sendPasswordResetEmail(sanitizedEmail, resetToken, user.first_name);

    logger.info(`Password reset email sent to ${sanitizedEmail}`);

    res.json(successResponse);
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to process password reset request. Please try again.'
    });
  }
});

// ============================================
// RESET PASSWORD - Reset with token
// ============================================

router.post('/reset-password', authRateLimit, async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Token and new password are required'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: 'Weak password',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }

    // Find user with valid reset token
    const result = await pool.query(
      'SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires_at > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Password reset link is invalid or has expired. Please request a new one.'
      });
    }

    const user = result.rows[0];

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await pool.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires_at = NULL WHERE id = $2',
      [passwordHash, user.id]
    );

    // Invalidate all existing refresh tokens for security
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [user.id]);

    logger.info(`Password reset successful for user ${user.email}`);

    res.json({
      message: 'Password reset successful',
      note: 'Please log in with your new password'
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to reset password. Please try again.'
    });
  }
});

// ============================================
// VERIFY EMAIL - Confirm email with token
// ============================================

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'Verification token is required'
      });
    }

    // Find user with valid verification token
    const { data: users, error: queryError } = await supabase
      .from('users')
      .select('id, email, first_name')
      .eq('verification_token', token)
      .gt('verification_token_expires_at', new Date().toISOString());

    if (queryError || !users || users.length === 0) {
      return res.status(400).json({
        error: 'Invalid or expired token',
        message: 'Verification link is invalid or has expired. Please request a new one.'
      });
    }

    const user = users[0];

    // Mark email as verified and clear verification token
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email_verified: true,
        verification_token: null,
        verification_token_expires_at: null
      })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.first_name).catch(err =>
      logger.error('Failed to send welcome email:', err)
    );

    logger.info(`Email verified for user ${user.email}`);

    res.json({
      message: 'Email verified successfully',
      note: 'You can now log in to your account'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to verify email. Please try again.'
    });
  }
});

// ============================================
// GET CURRENT USER - Get logged in user profile
// ============================================

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, email_verified, telegram_chat_id,
              notification_preferences, tier, subscription_starts_at, subscription_ends_at,
              last_login_at, created_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Your account could not be found'
      });
    }

    const user = result.rows[0];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        telegramChatId: user.telegram_chat_id,
        notificationPreferences: user.notification_preferences,
        tier: user.tier,
        subscriptionStartsAt: user.subscription_starts_at,
        subscriptionEndsAt: user.subscription_ends_at,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to get user profile. Please try again.'
    });
  }
});

// ============================================
// UPDATE PROFILE - Update user profile
// ============================================

router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, notificationPreferences } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(sanitizeInput(firstName));
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(sanitizeInput(lastName));
    }

    if (notificationPreferences !== undefined) {
      updates.push(`notification_preferences = $${paramCount++}`);
      values.push(JSON.stringify(notificationPreferences));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No updates provided',
        message: 'Please provide fields to update'
      });
    }

    values.push(req.userId);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramCount}
       RETURNING id, email, first_name, last_name, notification_preferences`,
      values
    );

    logger.info(`Profile updated for user ${req.userId}`);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        firstName: result.rows[0].first_name,
        lastName: result.rows[0].last_name,
        notificationPreferences: result.rows[0].notification_preferences
      }
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to update profile. Please try again.'
    });
  }
});

// ============================================
// GET USAGE STATS - Get user's tier usage and limits
// ============================================

router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const { getUserUsageStats } = require('../middleware/featureGating');

    const stats = await getUserUsageStats(req.userId);

    if (!stats) {
      return res.status(404).json({
        error: 'User not found',
        message: 'Could not retrieve usage statistics'
      });
    }

    res.json(stats);
  } catch (error) {
    logger.error('Get usage stats error:', error);
    res.status(500).json({
      error: 'Server error',
      message: 'Failed to retrieve usage statistics'
    });
  }
});

module.exports = router;
