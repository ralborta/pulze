#!/bin/bash
set -e

echo "🎉 Setting up PULZE project..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi

# Install pnpm if not present
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

# Install dependencies
echo "📥 Installing dependencies..."
pnpm install

# Copy env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/pulze"

# OpenAI
OPENAI_API_KEY="sk-..."

# WhatsApp
BOT_NAME="PULZE Coach"
BOT_PHONE_NUMBER=""

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# URLs
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_WEB_URL="http://localhost:3000"
EOF
    echo "✅ .env file created. Please fill in your API keys!"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Edit .env file with your credentials"
echo "2. Run 'pnpm dev:bot' to start the bot"
echo "3. Run 'pnpm dev:web' to start the webapp"
echo ""
echo "📖 Read README.md for more info"
