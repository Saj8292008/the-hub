#!/usr/bin/env node

/**
 * Newsletter Email Test Script
 * Tests the Resend email service and email templates
 */

require('dotenv').config();
const resendClient = require('../src/services/email/resendClient');
const emailTemplates = require('../src/services/email/emailTemplates');

async function testEmailService() {
  console.log('📧 Newsletter Email Service Test');
  console.log('================================\n');

  // Check API key
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key_here') {
    console.log('❌ Error: RESEND_API_KEY not set in .env file');
    process.exit(1);
  }

  console.log('✅ Resend API key found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
  console.log('📨 From:', process.env.NEWSLETTER_FROM_NAME, '<' + process.env.NEWSLETTER_FROM_EMAIL + '>');
  console.log('');

  // Get test email from command line or use default
  const testEmail = process.argv[2];
  if (!testEmail) {
    console.log('❌ Error: Please provide a test email address');
    console.log('');
    console.log('Usage:');
    console.log('  node scripts/testNewsletterEmail.js your-email@example.com');
    console.log('');
    process.exit(1);
  }

  console.log('📮 Sending test email to:', testEmail);
  console.log('');

  try {
    // Generate a test confirmation email
    const mockSubscriber = {
      email: testEmail,
      name: 'Test User',
      confirmation_token: 'test-token-123'
    };

    const emailData = emailTemplates.generateConfirmationEmail(mockSubscriber);

    console.log('📝 Email Details:');
    console.log('   Subject:', emailData.subject);
    console.log('   Template: Confirmation Email');
    console.log('');

    // Send the email
    console.log('🚀 Sending email via Resend...');
    const result = await resendClient.sendEmail({
      to: testEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    });

    console.log('');
    console.log('✅ Email sent successfully!');
    console.log('   Email ID:', result.emailId);
    console.log('');
    console.log('📬 Check your inbox at', testEmail);
    console.log('   (Check spam folder if not in inbox)');
    console.log('');
    console.log('🎉 Newsletter email service is working!');

  } catch (error) {
    console.error('');
    console.error('❌ Email send failed:');
    console.error('   Error:', error.message);
    if (error.response) {
      console.error('   Response:', JSON.stringify(error.response, null, 2));
    }
    console.error('');
    console.error('💡 Common issues:');
    console.error('   • Invalid API key');
    console.error('   • API key not activated');
    console.error('   • Need to verify domain in Resend dashboard');
    console.error('   • Rate limit exceeded');
    console.error('');
    process.exit(1);
  }
}

testEmailService();
