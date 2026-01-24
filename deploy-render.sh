#!/bin/bash

# Render Deployment Script
# Deploys The Hub using render.yaml configuration

set -e

echo "🚀 Deploying The Hub to Render..."
echo ""

# Check if render CLI is available
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found. Please install it first:"
    echo "   brew install render"
    exit 1
fi

# Check if logged in
if ! render whoami -o json &> /dev/null; then
    echo "❌ Not logged in to Render. Please run:"
    echo "   render login"
    exit 1
fi

echo "✅ Authenticated as: $(render whoami -o json | head -1)"
echo ""

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ render.yaml not found in current directory"
    exit 1
fi

echo "📋 Found render.yaml configuration"
echo ""

# Show service configuration
echo "📦 Service Configuration:"
echo "   Name: the-hub"
echo "   Runtime: Node.js"
echo "   Build: npm install"
echo "   Start: node src/index.js"
echo ""

# Check if service already exists
echo "🔍 Checking for existing services..."
echo ""

# Since workspace issues, let's guide manual creation
cat << 'EOF'

⚠️  Due to CLI workspace limitations, please create the service manually:

📋 Manual Deployment Steps:

1. Go to: https://dashboard.render.com

2. Fix GitHub Connection:
   • Go to: https://github.com/settings/installations
   • Find "Render" → Click "Configure"
   • Grant access to "the-hub" repository
   • Save

3. Create New Web Service:
   • Click "New +" → "Web Service"
   • Select "the-hub" repository (should now appear!)
   • Click "Connect"

4. Configure Service:
   • Name: the-hub
   • Branch: main
   • Build Command: npm install
   • Start Command: node src/index.js
   • Plan: Free

5. Environment Variables (click "Advanced"):
   Copy from render.yaml or use these:

TELEGRAM_BOT_TOKEN=8310191561:AAExxS9nt4a2VsUz0W75CG1H_4C0iDG-9UM
TELEGRAM_ADMIN_CHAT_ID=8427035818
ENABLE_SCRAPER_SCHEDULER=true
PORT=3000
NODE_ENV=production
USE_REAL_SCRAPERS=false

6. Click "Create Web Service"

7. Watch deployment logs for:
   ✅ Registered scraper: reddit
   ✅ Scraper Coordinator: Active
   ✅ The Hub is running

⏱️  Deployment takes 3-5 minutes

Once live, test with:
   curl https://your-app.onrender.com/health

EOF

echo ""
echo "Need help? Check RENDER-SETUP-GUIDE.md"
echo ""
