#!/bin/bash

# Run Blog Post Generation Script
# Generates 20 AI-powered blog posts

echo "======================================"
echo "  AI Blog Post Generation Script"
echo "======================================"
echo ""
echo "This will generate 20 blog posts using GPT-4."
echo "Estimated time: 10-15 minutes"
echo "Estimated cost: ~$2.00"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "Starting generation..."
echo ""

# Run the Node.js script
node scripts/generateBlogPosts.js

echo ""
echo "======================================"
echo "Generation complete!"
echo "View posts at: http://localhost:5173/blog"
echo "======================================"
