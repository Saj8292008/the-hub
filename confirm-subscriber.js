#!/usr/bin/env node
// Manually confirm a subscriber in the database
// Usage: node confirm-subscriber.js email@example.com

require('dotenv').config();
const supabase = require('./src/db/supabase');

async function confirmSubscriber(email) {

  console.log(`🔄 Confirming subscriber: ${email}`);

  try {
    // Update subscriber to confirmed using Supabase JS API
    const result = await supabase.query(async (client) => {
      return await client
        .from('blog_subscribers')
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString()
        })
        .eq('email', email)
        .select()
        .single();
    });

    if (result && result.data) {
      console.log('✅ Subscriber confirmed successfully!');
      console.log(JSON.stringify(result.data, null, 2));
      return true;
    } else {
      console.log('❌ Subscriber not found');
      return false;
    }
  } catch (error) {
    console.error('❌ Error confirming subscriber:', error.message);
    return false;
  }
}

// Get email from command line argument or use default
const email = process.argv[2] || 'carmarsyd@icloud.com';
confirmSubscriber(email).then((success) => {
  process.exit(success ? 0 : 1);
});
