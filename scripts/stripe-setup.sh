#!/bin/bash
# Stripe Setup Helper Script

echo "🔷 The Hub - Stripe Setup Helper"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found"
    echo "Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "✅ Stripe CLI found"
echo ""

# Check login status
echo "🔐 Checking Stripe login status..."
if stripe config --list &> /dev/null; then
    echo "✅ Already logged in"
else
    echo "⚠️  Not logged in. Running 'stripe login'..."
    stripe login
fi

echo ""
echo "📋 What do you want to do?"
echo ""
echo "1) Show my test API keys"
echo "2) Create products and prices (Pro + Premium tiers)"
echo "3) Start webhook listener"
echo "4) Test a payment"
echo "5) View recent events"
echo "6) Complete setup (all of the above)"
echo ""
read -p "Choice [1-6]: " choice

case $choice in
    1)
        echo ""
        echo "🔑 Your Test API Keys:"
        echo ""
        stripe keys list --test
        echo ""
        echo "Add these to /the-hub/.env:"
        echo "STRIPE_SECRET_KEY=sk_test_..."
        echo "STRIPE_PUBLISHABLE_KEY=pk_test_..."
        ;;
    2)
        echo ""
        echo "🏗️  Creating products and prices..."
        echo ""
        
        # Create Pro product
        echo "Creating The Hub Pro..."
        PRO_PRODUCT=$(stripe products create \
            --name "The Hub Pro" \
            --description "Advanced deal tracking and alerts" \
            --format json | jq -r '.id')
        
        echo "✅ Product created: $PRO_PRODUCT"
        
        # Pro Monthly
        PRO_MONTHLY=$(stripe prices create \
            --product "$PRO_PRODUCT" \
            --currency usd \
            --recurring[interval]=month \
            --unit-amount 900 \
            --nickname "Pro Monthly" \
            --format json | jq -r '.id')
        
        echo "✅ Pro Monthly: $PRO_MONTHLY"
        
        # Pro Yearly
        PRO_YEARLY=$(stripe prices create \
            --product "$PRO_PRODUCT" \
            --currency usd \
            --recurring[interval]=year \
            --unit-amount 8640 \
            --nickname "Pro Yearly" \
            --format json | jq -r '.id')
        
        echo "✅ Pro Yearly: $PRO_YEARLY"
        
        # Create Premium product
        echo ""
        echo "Creating The Hub Premium..."
        PREMIUM_PRODUCT=$(stripe products create \
            --name "The Hub Premium" \
            --description "Full platform access with AI features" \
            --format json | jq -r '.id')
        
        echo "✅ Product created: $PREMIUM_PRODUCT"
        
        # Premium Monthly
        PREMIUM_MONTHLY=$(stripe prices create \
            --product "$PREMIUM_PRODUCT" \
            --currency usd \
            --recurring[interval]=month \
            --unit-amount 1900 \
            --nickname "Premium Monthly" \
            --format json | jq -r '.id')
        
        echo "✅ Premium Monthly: $PREMIUM_MONTHLY"
        
        # Premium Yearly
        PREMIUM_YEARLY=$(stripe prices create \
            --product "$PREMIUM_PRODUCT" \
            --currency usd \
            --recurring[interval]=year \
            --unit-amount 18240 \
            --nickname "Premium Yearly" \
            --format json | jq -r '.id')
        
        echo "✅ Premium Yearly: $PREMIUM_YEARLY"
        
        echo ""
        echo "✅ All products and prices created!"
        echo ""
        echo "Add these to /the-hub/.env:"
        echo "STRIPE_PRICE_ID_PRO_MONTHLY=$PRO_MONTHLY"
        echo "STRIPE_PRICE_ID_PRO_YEARLY=$PRO_YEARLY"
        echo "STRIPE_PRICE_ID_PREMIUM_MONTHLY=$PREMIUM_MONTHLY"
        echo "STRIPE_PRICE_ID_PREMIUM_YEARLY=$PREMIUM_YEARLY"
        ;;
    3)
        echo ""
        echo "🎧 Starting webhook listener..."
        echo "This will forward Stripe events to localhost:3000"
        echo ""
        echo "⚠️  Copy the webhook secret (whsec_...) to your .env file"
        echo ""
        stripe listen --forward-to localhost:3000/api/webhooks/stripe
        ;;
    4)
        echo ""
        echo "🧪 Testing payment flow..."
        echo ""
        echo "Opening pricing page..."
        open http://localhost:3000/premium
        echo ""
        echo "Test card: 4242 4242 4242 4242"
        echo "Expiry: any future date"
        echo "CVC: any 3 digits"
        ;;
    5)
        echo ""
        echo "📊 Recent Stripe events:"
        echo ""
        stripe events list --limit 10
        ;;
    6)
        echo ""
        echo "🚀 Running complete setup..."
        echo ""
        
        # Show keys
        echo "1️⃣  Your API keys:"
        stripe keys list --test
        
        echo ""
        read -p "Press enter to continue to product creation..."
        
        # Create products (same as option 2)
        $0 <<< "2"
        
        echo ""
        echo "✅ Setup complete!"
        echo ""
        echo "Next steps:"
        echo "1. Add all keys and price IDs to /the-hub/.env"
        echo "2. Restart your server: npm start"
        echo "3. Run: ./scripts/stripe-setup.sh and choose option 3 (webhook listener)"
        echo "4. Test a payment: http://localhost:3000/premium"
        ;;
    *)
        echo "Invalid choice"
        ;;
esac

echo ""
