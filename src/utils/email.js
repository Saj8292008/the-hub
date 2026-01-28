/**
 * Email Utilities
 * Handles sending verification emails, password reset emails, and notifications
 */

const resendClient = require('../services/email/resendClient');
const logger = require('./logger');

/**
 * Send verification email to new user
 * @param {string} email - User email
 * @param {string} token - Verification token
 * @param {string} firstName - User first name
 */
const sendVerificationEmail = async (email, token, firstName = '') => {
  const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"The Hub" <${process.env.SMTP_USER || 'noreply@thehub.com'}>`,
    to: email,
    subject: 'Verify Your Email - The Hub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0E27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1f3a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Welcome to The Hub! 👋</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      Hi ${firstName || 'there'},
                    </p>

                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      Thanks for signing up! Click the button below to verify your email address and activate your account.
                    </p>

                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);">
                          <a href="${verifyUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                            Verify Email Address
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      Or copy this link into your browser:<br/>
                      <a href="${verifyUrl}" style="color: #9333EA; word-break: break-all;">${verifyUrl}</a>
                    </p>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      <strong>This link expires in 24 hours.</strong>
                    </p>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      If you didn't create an account, please ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #111827; padding: 30px 40px; text-align: center;">
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      © ${new Date().getFullYear()} The Hub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    if (!resendClient.isAvailable()) {
      logger.warn('Resend not configured - email will not be sent');
      logger.info(`[DEV] Verification email would be sent to ${email}`);
      logger.info(`[DEV] Verify URL: ${verifyUrl}`);
      return { messageId: 'dev-mode' };
    }

    const result = await resendClient.sendEmail({
      to: email,
      subject: mailOptions.subject,
      html: mailOptions.html
    });

    if (result.success) {
      logger.info(`Verification email sent to ${email}: ${result.emailId}`);
      return { messageId: result.emailId };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error(`Failed to send verification email to ${email}:`, error);
    throw new Error('Failed to send verification email');
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} token - Reset token
 * @param {string} firstName - User first name
 */
const sendPasswordResetEmail = async (email, token, firstName = '') => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"The Hub" <${process.env.SMTP_USER || 'noreply@thehub.com'}>`,
    to: email,
    subject: 'Reset Your Password - The Hub',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0E27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1f3a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Password Reset Request 🔐</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      Hi ${firstName || 'there'},
                    </p>

                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      We received a request to reset your password. Click the button below to choose a new password:
                    </p>

                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%);">
                          <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      Or copy this link into your browser:<br/>
                      <a href="${resetUrl}" style="color: #DC2626; word-break: break-all;">${resetUrl}</a>
                    </p>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      <strong>This link expires in 1 hour.</strong>
                    </p>

                    <p style="margin: 20px 0 0; color: #F87171; font-size: 14px; line-height: 1.6; background-color: rgba(220, 38, 38, 0.1); padding: 15px; border-radius: 8px; border-left: 4px solid #DC2626;">
                      <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email and ensure your account is secure.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #111827; padding: 30px 40px; text-align: center;">
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      © ${new Date().getFullYear()} The Hub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    if (!resendClient.isAvailable()) {
      logger.warn('Resend not configured - email will not be sent');
      logger.info(`[DEV] Password reset email would be sent to ${email}`);
      logger.info(`[DEV] Reset URL: ${resetUrl}`);
      return { messageId: 'dev-mode' };
    }

    const result = await resendClient.sendEmail({
      to: email,
      subject: mailOptions.subject,
      html: mailOptions.html
    });

    if (result.success) {
      logger.info(`Password reset email sent to ${email}: ${result.emailId}`);
      return { messageId: result.emailId };
    } else {
      throw new Error(result.error || 'Failed to send email');
    }
  } catch (error) {
    logger.error(`Failed to send password reset email to ${email}:`, error);
    throw new Error('Failed to send password reset email');
  }
};

/**
 * Send welcome email after email verification
 * @param {string} email - User email
 * @param {string} firstName - User first name
 */
const sendWelcomeEmail = async (email, firstName = '') => {
  const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard`;

  const mailOptions = {
    from: `"The Hub" <${process.env.SMTP_USER || 'noreply@thehub.com'}>`,
    to: email,
    subject: 'Welcome to The Hub! 🎉',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0A0E27; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1a1f3a; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: bold;">Email Verified! 🎉</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 40px;">
                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      Hi ${firstName || 'there'},
                    </p>

                    <p style="margin: 0 0 20px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      Your email has been verified successfully! You now have full access to The Hub.
                    </p>

                    <p style="margin: 0 0 30px; color: #E5E7EB; font-size: 16px; line-height: 1.6;">
                      <strong>What you can do now:</strong>
                    </p>

                    <ul style="margin: 0 0 30px; padding-left: 20px; color: #E5E7EB; font-size: 16px; line-height: 1.8;">
                      <li>Track watches, cars, sneakers, and sports gear</li>
                      <li>Set price alerts for your favorite items</li>
                      <li>Get instant notifications via email or Telegram</li>
                      <li>Access premium features and analytics</li>
                    </ul>

                    <!-- Button -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, #10B981 0%, #059669 100%);">
                          <a href="${dashboardUrl}" target="_blank" style="display: inline-block; padding: 14px 40px; color: white; text-decoration: none; font-weight: 600; font-size: 16px;">
                            Go to Dashboard
                          </a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6;">
                      Need help? Reply to this email or visit our support page.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #111827; padding: 30px 40px; text-align: center;">
                    <p style="margin: 0; color: #6B7280; font-size: 14px;">
                      © ${new Date().getFullYear()} The Hub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  };

  try {
    if (!resendClient.isAvailable()) {
      logger.warn('Resend not configured - email will not be sent');
      logger.info(`[DEV] Welcome email would be sent to ${email}`);
      return { messageId: 'dev-mode' };
    }

    const result = await resendClient.sendEmail({
      to: email,
      subject: mailOptions.subject,
      html: mailOptions.html
    });

    if (result.success) {
      logger.info(`Welcome email sent to ${email}: ${result.emailId}`);
      return { messageId: result.emailId };
    } else {
      logger.error(`Failed to send welcome email: ${result.error}`);
      return null;
    }
  } catch (error) {
    logger.error(`Failed to send welcome email to ${email}:`, error);
    // Don't throw - welcome email is not critical
    return null;
  }
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail
};
