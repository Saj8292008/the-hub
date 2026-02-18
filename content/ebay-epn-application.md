# eBay Partner Network (ePN) Application Status

**Date:** 2026-02-10  
**Application Status:** ⏸️ In Progress - Awaiting Authentication  
**Email:** pythoncoding0829@gmail.com

## Overview
The eBay Partner Network (ePN) is the full affiliate program with Campaign IDs for programmatic link generation, API access, and feeds integration. This is different from eBay Ambassador (which is for simple creators).

## Application Progress

### ✅ Completed Steps:
1. ✅ Navigated to https://partnernetwork.ebay.com
2. ✅ Identified EPN program (for advanced technical needs with APIs)
3. ✅ Clicked "Sign in with eBay" to start registration
4. ✅ Entered email: pythoncoding0829@gmail.com
5. ✅ eBay account recognized
6. ✅ Initiated Google OAuth authentication flow

### ⏸️ Currently Blocked At:
**Google Sign-In Authentication**

The application process requires signing into the eBay account, which is linked to Google authentication. The browser is currently showing a passkey/Touch ID verification prompt.

**Current URL:** `https://accounts.google.com/v3/signin/challenge/pk?...`

### 🔑 Authentication Options:
1. **Passkey/Touch ID** - System prompt (currently showing)
2. **Password** - Manual entry required
3. **Alternative methods** - Phone verification, recovery email

## Next Steps

### To Complete the Application:
1. **Authenticate with Google:**
   - Use Touch ID on the Mac, OR
   - Click "Try another way" and enter password, OR
   - Use phone verification if available

2. **After Authentication, Complete the ePN Application Form:**
   - **Website:** thehubdeals.com
   - **Email:** pythoncoding0829@gmail.com
   - **Business Name:** The Hub
   - **Description:** "Deal aggregator and price tracking platform for watches, sneakers, and collectibles. We surface the best deals from across the web including eBay listings and help buyers find items below market value."
   - **Traffic Sources:** Website, Email newsletter, Telegram channel, Discord, Instagram, Reddit
   - **Monthly Traffic:** 1,000-5,000 (growing)
   - **Content Type:** Deal alerts, price comparisons, market reports
   - **Categories:** 
     - Watches
     - Sneakers/Athletic Shoes
     - Collectibles
     - Fashion

3. **After Submission:**
   - Check if there's immediate approval or pending review
   - If approved immediately, grab the Campaign ID
   - Note any partner dashboard access details
   - Save API credentials if provided

4. **Integration Information Needed:**
   - Campaign ID (required for affiliate links)
   - API key/credentials (for programmatic access)
   - Partner account ID
   - Tracking parameters
   - Commission rates by category

## Why We Need ePN (vs eBay Ambassador)

### eBay Partner Network (ePN):
- ✅ Full API access for programmatic link generation
- ✅ Campaign IDs for tracking
- ✅ Product feeds and data exports
- ✅ Advanced reporting and analytics
- ✅ High-volume performance capabilities
- ✅ Custom integrations
- ✅ Suitable for The Hub's automated deal aggregation

### eBay Ambassador (Not chosen):
- ❌ US & UK only
- ❌ Creator-focused (manual curation)
- ❌ Limited to storefront interface
- ❌ No API/programmatic access
- ❌ Not designed for automated platforms

## Technical Requirements for The Hub Integration

Once approved, we'll need to integrate:

1. **Link Generation API**
   - Convert eBay listing URLs to affiliate links
   - Add Campaign ID automatically
   - Track clicks and conversions

2. **Product Feeds**
   - Access eBay deals/promoted listings
   - Filter by categories (watches, sneakers, collectibles)
   - Get real-time pricing data

3. **Tracking Implementation**
   - Add ePN parameters to all eBay links on:
     - thehubdeals.com website
     - Email newsletters
     - Telegram bot messages
     - Discord posts

4. **Reporting Dashboard**
   - Monitor clicks, conversions, commissions
   - Track which deals perform best
   - Optimize based on data

## Commission Structure

Typical ePN commission rates (to verify after approval):
- General merchandise: 1-4%
- Fashion & accessories: 3-5%
- Watches & jewelry: Variable
- Collectibles: Variable

## Resources

- **ePN Help Center:** https://partnerhelp.ebay.com/helpcenter/s/?language=en_US
- **Partner Dashboard:** (URL to be added after approval)
- **API Documentation:** (Link to be added after approval)

## Screenshots

See browser screenshots captured during application process (saved in browser media folder).

## Important Notes

- This is a FULL affiliate program application, not a simple sign-up
- May require business verification or additional documentation
- Approval may take 1-3 business days
- Need to review and accept Network Agreement terms
- Must comply with ePN policies for link disclosure and usage

## Campaign ID

**Campaign ID:** _To be added after approval_

This is the critical piece needed for generating affiliate links programmatically. Every affiliate link must include this ID to track conversions back to The Hub.

---

**Last Updated:** 2026-02-10  
**Next Action:** Complete Google authentication to proceed with application
