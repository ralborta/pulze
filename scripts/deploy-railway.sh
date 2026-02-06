#!/bin/bash
set -e

echo "🚀 Deploying PULZE Bot to Railway..."

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm i -g @railway/cli
fi

# Login check
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Link project (if not already linked)
if [ ! -f ".railway" ]; then
    echo "🔗 Linking Railway project..."
    railway link
fi

# Deploy desde la raíz (Dockerfile y pnpm-lock.yaml están aquí)
echo "📦 Building and deploying from repo root..."
railway up

echo "✅ Deployment complete!"
echo "📊 View logs: railway logs"
echo "🌐 View dashboard: railway open"
