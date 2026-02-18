# eBay Ambassador Program — Integration Guide

## How It Works
- **Account:** pythoncoding0829@gmail.com
- **Program:** eBay Ambassador (NOT traditional eBay Partner Network)
- **Dashboard:** https://ambassador.ebay.com
- **No Campaign ID** — Ambassador generates unique share links per item

## How to Generate Links
1. Log into ambassador.ebay.com
2. Use "Find and Share" tool to search for items
3. Each item gets a unique trackable link
4. Commission earned when someone buys through your link

## Integration Strategy
Since Ambassador doesn't have an API for programmatic link generation, we have two options:

### Option 1: Manual Link Generation (Current)
- When posting deals from eBay, log into Ambassador dashboard
- Generate link for each eBay listing
- Use that link in our deal posts

### Option 2: Browser Automation (Recommended)
- Use Puppeteer/browser automation to:
  1. Log into Ambassador
  2. Search for item by URL/title
  3. Generate and extract the share link
  4. Use in our deal posts automatically

### Option 3: Upgrade to eBay Partner Network
- Apply at https://partnernetwork.ebay.com
- Get a Campaign ID for programmatic link generation
- Standard ePN format: `rover.ebay.com/rover/1/XXXXX/X?mpre=URL`
- More powerful but requires separate application

## Commission Structure
- Varies by category (1-4%)
- $5 bonus when you hit first $5 in commission
- Paid via eBay account

## Status
- ✅ Registered Feb 4, 2026
- ✅ Account active
- ⏳ Need to generate first links and start earning
