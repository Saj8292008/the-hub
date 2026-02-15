# Instagram Graph API Integration

## Setup Guide

### Prerequisites
1. **Instagram Business/Creator Account** — @thehubdeals08 ✅
2. **Facebook Page** linked to the Instagram account
3. **Meta Developer App** with Instagram Graph API permissions
4. **Long-lived Access Token** with `instagram_content_publish` + `instagram_basic` permissions

### Step-by-Step Setup

#### 1. Create/Link Facebook Page
- Go to facebook.com → Create Page → "The Hub Deals"
- In Instagram app: Settings → Account → Linked Accounts → Facebook → Link to the new page
- OR: In Meta Business Suite → Settings → Instagram Account → Connect

#### 2. Create Meta Developer App
- Go to https://developers.facebook.com/apps/
- Click "Create App" → Business type → "Other"
- App name: "The Hub Deals"
- Select business portfolio (or create one)

#### 3. Add Instagram Graph API
- In app dashboard → Add Product → Instagram Graph API → Set Up
- Under Permissions: Request `instagram_content_publish`, `instagram_basic`, `pages_show_list`, `pages_read_engagement`

#### 4. Generate Access Token
- Go to Graph API Explorer: https://developers.facebook.com/tools/explorer/
- Select your app
- Add permissions: `instagram_content_publish`, `instagram_basic`, `pages_show_list`
- Generate User Access Token → Authorize
- Exchange for long-lived token (60-day)

#### 5. Get Instagram Business Account ID
```bash
# With your access token:
curl "https://graph.facebook.com/v21.0/me/accounts?access_token=YOUR_TOKEN"
# → Get page_id from response

curl "https://graph.facebook.com/v21.0/PAGE_ID?fields=instagram_business_account&access_token=YOUR_TOKEN"
# → Get instagram_business_account.id
```

#### 6. Save to .env
```
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_ACCOUNT_ID=your_ig_business_id
FACEBOOK_PAGE_ID=your_page_id
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
```

### Publishing Flow

#### Single Image Post
1. Create media container: POST to `/{ig-user-id}/media` with `image_url` + `caption`
2. Publish: POST to `/{ig-user-id}/media_publish` with `creation_id`

#### Reel (Video Post)
1. Create media container: POST to `/{ig-user-id}/media` with `video_url` + `caption` + `media_type=REELS`
2. Wait for processing (poll status)
3. Publish: POST to `/{ig-user-id}/media_publish` with `creation_id`

### Video Requirements for Reels
- Format: MP4, MOV
- Duration: 3-90 seconds
- Resolution: Min 540x960 (9:16 recommended)
- Frame rate: 30fps recommended
- Max file size: 1GB
