require('dotenv').config();
const https = require('https');

const token = '8432859549:AAGOHwCl_57vYMsbCqeeZQc7Z6CnbZNh_s0';
const channelId = '-1001846110501';

const data = JSON.stringify({
  chat_id: channelId,
  text: '✅ URGENT TEST - Bot posting directly via Node.js',
  parse_mode: 'Markdown'
});

const options = {
  hostname: 'api.telegram.org',
  port: 443,
  path: `/bot${token}/sendMessage`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🧪 Testing direct Telegram API call...');
console.log(`Channel: ${channelId}`);
console.log('');

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    const response = JSON.parse(responseData);
    console.log('Response:', JSON.stringify(response, null, 2));

    if (response.ok) {
      console.log('');
      console.log('✅ SUCCESS! Bot CAN post to channel!');
      console.log('🔗 Check: https://t.me/TheHubDeals');
      process.exit(0);
    } else {
      console.log('');
      console.log('❌ FAILED');
      console.log('Error:', response.description);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
  process.exit(1);
});

req.write(data);
req.end();
