#!/bin/bash
set -e

echo "🚀 Deploying PULZE Web & Backoffice to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

# Deploy Web App
echo "📱 Deploying WebApp..."
cd apps/web
vercel --prod

echo "✅ Deployment complete!"
echo "🌐 Your app is live!"

# Note: Add backoffice deployment when ready
# cd ../backoffice
# vercel --prod
