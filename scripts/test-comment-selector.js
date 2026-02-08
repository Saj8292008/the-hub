/**
 * Test script to find Reddit's comment selectors
 */

const { chromium } = require('playwright');

async function testSelectors() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to a specific post
  const testUrl = 'https://www.reddit.com/r/Watches/comments/1qxwqns/omega_conflicted/';
  console.log('📍 Navigating to:', testUrl);
  await page.goto(testUrl);
  await page.waitForTimeout(5000);

  console.log('\n🔍 Testing comment box selectors...\n');

  const selectors = [
    'textarea[placeholder*="comment"]',
    'textarea[placeholder*="thoughts"]',
    'div[contenteditable="true"]',
    'div[role="textbox"]',
    'shreddit-composer',
    'faceplate-form',
    '[slot="text-inputs"]',
    'shreddit-comment-composer-host',
    'textarea',
    'div.public-DraftEditor-content'
  ];

  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      console.log(`✅ FOUND: ${selector}`);
      const html = await element.evaluate(el => el.outerHTML.substring(0, 200));
      console.log(`   HTML: ${html}...\n`);
    } else {
      console.log(`❌ NOT FOUND: ${selector}`);
    }
  }

  console.log('\n📋 Full page structure (looking for comment area):');
  const structure = await page.evaluate(() => {
    // Look for elements with "comment" in class or attribute
    const commentElements = [];
    const allElements = document.querySelectorAll('*');
    
    for (const el of allElements) {
      const attrs = Array.from(el.attributes || []).map(a => `${a.name}="${a.value}"`).join(' ');
      const text = attrs.toLowerCase();
      
      if (text.includes('comment') || text.includes('composer') || text.includes('text')) {
        commentElements.push({
          tag: el.tagName.toLowerCase(),
          attrs: attrs.substring(0, 150)
        });
      }
    }
    
    return commentElements.slice(0, 20); // First 20 matches
  });

  console.log(JSON.stringify(structure, null, 2));

  console.log('\n⏸️  Browser staying open - inspect manually and press Ctrl+C when done');
  await new Promise(() => {}); // Keep open
}

testSelectors().catch(console.error);
