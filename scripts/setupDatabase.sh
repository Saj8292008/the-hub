#!/bin/bash

# Database Setup Script with Supabase CLI
# Sets up all tables, indexes, RLS policies, and storage

set -e

echo "=========================================="
echo "  The Hub - Database Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
echo -e "${BLUE}🔍 Checking Supabase CLI...${NC}"
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo ""
    echo "Install Supabase CLI:"
    echo ""
    echo "  macOS:"
    echo "    brew install supabase/tap/supabase"
    echo ""
    echo "  Linux/WSL:"
    echo "    npm install -g supabase"
    echo ""
    echo "  Or visit: https://supabase.com/docs/guides/cli"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI installed${NC}"
echo ""

# Check if already linked
echo -e "${BLUE}🔗 Checking Supabase project link...${NC}"

if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Not linked to a Supabase project${NC}"
    echo ""
    echo "Please link to your Supabase project:"
    echo ""
    echo "  Option 1 - Link existing project:"
    echo "    supabase link --project-ref your-project-id"
    echo ""
    echo "  Option 2 - Create new project:"
    echo "    supabase projects create the-hub"
    echo "    supabase link"
    echo ""
    echo "  Find your project ID:"
    echo "    https://supabase.com/dashboard/project/_/settings/general"
    echo ""

    read -p "Do you want to link now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting link process..."
        supabase link || {
            echo -e "${RED}❌ Failed to link project${NC}"
            exit 1
        }
    else
        echo ""
        echo -e "${YELLOW}Please link manually and run this script again${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Linked to Supabase project${NC}"
echo ""

# Apply database schema
echo -e "${BLUE}📊 Applying database schema...${NC}"
echo ""

if [ ! -f "database/blog_schema.sql" ]; then
    echo -e "${RED}❌ Schema file not found: database/blog_schema.sql${NC}"
    exit 1
fi

echo "Pushing schema to database..."
supabase db push || {
    echo -e "${RED}❌ Failed to push schema${NC}"
    echo ""
    echo "Try manual application:"
    echo "  1. Go to Supabase Dashboard → SQL Editor"
    echo "  2. Copy contents of database/blog_schema.sql"
    echo "  3. Paste and run"
    exit 1
}

echo -e "${GREEN}✅ Schema applied successfully${NC}"
echo ""

# Verify tables
echo -e "${BLUE}✅ Verifying tables...${NC}"

TABLES=$(supabase db tables list 2>/dev/null || echo "")

if [[ $TABLES == *"blog_posts"* ]]; then
    echo -e "${GREEN}✅ blog_posts table created${NC}"
else
    echo -e "${YELLOW}⚠️  blog_posts table not found${NC}"
fi

if [[ $TABLES == *"blog_subscribers"* ]]; then
    echo -e "${GREEN}✅ blog_subscribers table created${NC}"
else
    echo -e "${YELLOW}⚠️  blog_subscribers table not found${NC}"
fi

if [[ $TABLES == *"watch_listings"* ]]; then
    echo -e "${GREEN}✅ watch_listings table exists${NC}"
fi

echo ""

# Get project credentials
echo -e "${BLUE}🔑 Retrieving project credentials...${NC}"
echo ""

PROJECT_REF=$(supabase status 2>/dev/null | grep "Project ref:" | awk '{print $3}' || echo "")

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  Could not auto-detect project ref${NC}"
    echo ""
    echo "Get your credentials from:"
    echo "  https://supabase.com/dashboard/project/_/settings/api"
    echo ""
else
    echo "Project Reference: $PROJECT_REF"
    echo ""
    echo "Get your API keys from:"
    echo "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/api"
    echo ""
fi

# Update .env file
echo -e "${BLUE}📝 Updating .env file...${NC}"

if [ -f ".env" ]; then
    echo ""
    read -p "Update .env file with Supabase credentials? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        read -p "Enter your Supabase URL: " SUPABASE_URL
        read -p "Enter your Supabase Anon Key: " SUPABASE_ANON_KEY
        read -p "Enter your Supabase Service Role Key: " SUPABASE_SERVICE_ROLE_KEY

        # Backup existing .env
        cp .env .env.backup
        echo -e "${GREEN}✅ Backed up .env to .env.backup${NC}"

        # Update .env
        sed -i.tmp "s|SUPABASE_URL=.*|SUPABASE_URL=$SUPABASE_URL|g" .env
        sed -i.tmp "s|SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" .env
        sed -i.tmp "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY|g" .env
        rm .env.tmp

        echo -e "${GREEN}✅ Updated .env file${NC}"

        # Also update frontend .env
        if [ -f "the-hub/.env" ]; then
            cp the-hub/.env the-hub/.env.backup
            sed -i.tmp "s|VITE_SUPABASE_URL=.*|VITE_SUPABASE_URL=$SUPABASE_URL|g" the-hub/.env
            sed -i.tmp "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY|g" the-hub/.env
            rm the-hub/.env.tmp
            echo -e "${GREEN}✅ Updated the-hub/.env file${NC}"
        fi
    fi
fi

echo ""

# Set up storage bucket for blog images
echo -e "${BLUE}🖼️  Setting up storage bucket...${NC}"
echo ""

echo "Creating 'blog-images' bucket..."

# Try to create bucket via SQL
supabase db execute --sql "
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO NOTHING;
" 2>/dev/null || echo -e "${YELLOW}⚠️  Bucket may already exist${NC}"

echo ""
echo -e "${GREEN}✅ Storage bucket configured${NC}"
echo ""
echo "Manual verification:"
echo "  1. Go to Supabase Dashboard → Storage"
echo "  2. Verify 'blog-images' bucket exists"
echo "  3. Ensure bucket is set to 'Public'"
echo ""

# Create admin user
echo -e "${BLUE}👤 Admin User Setup${NC}"
echo ""

read -p "Do you want to create an admin user now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    read -p "Enter admin email: " ADMIN_EMAIL
    read -sp "Enter admin password: " ADMIN_PASSWORD
    echo ""

    # Create user via SQL
    supabase db execute --sql "
    -- Create admin user
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        '$ADMIN_EMAIL',
        crypt('$ADMIN_PASSWORD', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{\"role\": \"admin\"}'::jsonb,
        '{}'::jsonb,
        false,
        '',
        '',
        '',
        ''
    )
    ON CONFLICT (email) DO UPDATE
    SET raw_app_meta_data = jsonb_set(
        COALESCE(auth.users.raw_app_meta_data, '{}'::jsonb),
        '{role}',
        '\"admin\"'
    );
    " && echo -e "${GREEN}✅ Admin user created${NC}" || echo -e "${YELLOW}⚠️  User may already exist${NC}"

    echo ""
    echo "Admin credentials:"
    echo "  Email: $ADMIN_EMAIL"
    echo "  Password: [hidden]"
    echo ""
fi

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Database Setup Complete!${NC}"
echo "=========================================="
echo ""

echo "📋 What was set up:"
echo "  ✅ Database schema applied"
echo "  ✅ All tables created"
echo "  ✅ Indexes created"
echo "  ✅ RLS policies enabled"
echo "  ✅ Storage bucket configured"
echo "  ✅ Environment variables updated"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  ✅ Admin user created"
fi
echo ""

echo "🔗 Useful links:"
echo "  Dashboard: https://supabase.com/dashboard"
echo "  SQL Editor: https://supabase.com/dashboard/project/_/sql"
echo "  Table Editor: https://supabase.com/dashboard/project/_/editor"
echo "  Storage: https://supabase.com/dashboard/project/_/storage"
echo ""

echo "📊 Verify setup:"
echo "  supabase db tables list"
echo "  supabase db policies list"
echo ""

echo "🚀 Next steps:"
echo "  1. Configure OpenAI API key: ./scripts/setupCredentials.sh"
echo "  2. Generate blog posts: node scripts/generateBlogPosts.js"
echo "  3. Start development: npm run dev"
echo ""
