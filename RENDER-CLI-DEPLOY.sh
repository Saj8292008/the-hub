#!/bin/bash

# Render CLI Deployment Script
echo "🎨 Deploying to Render.com via CLI"
echo "====================================="
echo ""

echo "Step 1: Login to Render (opens browser)"
render login
echo ""

echo "Step 2: Create service from render.yaml"
render blueprints deploy --repo https://github.com/Saj8292008/the-hub
echo ""

echo "✅ Deployment initiated!"
echo ""
echo "Useful commands:"
echo "  render services list          - List all services"
echo "  render logs <service-id>      - View logs"
echo "  render deploys list           - List deploys"
echo "  render open <service-id>      - Open service in browser"
