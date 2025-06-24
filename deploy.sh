#!/bin/bash

# Scentra Vending Machine - Raspberry Pi Deployment Script
set -e

echo "🚀 Starting Scentra Vending Machine deployment on Raspberry Pi..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and log back in for group changes to take effect."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Installing..."
    sudo apt-get update
    sudo apt-get install -y docker-compose-plugin
fi

# Create necessary directories
echo "📁 Creating deployment directories..."
mkdir -p logs ssl

# Copy environment file
if [ ! -f .env ]; then
    echo "📝 Creating environment file from template..."
    cp .env.production .env
    echo "⚠️  Please edit .env file with your actual credentials before continuing!"
    echo "   Especially update POSTGRES_PASSWORD and Razorpay keys"
    read -p "Press Enter when you've updated the .env file..."
fi

# Build and start services
echo "🏗️  Building Docker images..."
docker-compose build --no-cache

echo "🗄️  Starting database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "🗃️  Running database migrations..."
docker-compose run --rm app npm run db:push

echo "🚀 Starting all services..."
docker-compose up -d

# Show status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Application URLs:"
echo "   - Direct access: http://localhost:5000"
echo "   - With Nginx: http://localhost"
echo ""
echo "🔧 Useful commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart app: docker-compose restart app"
echo "   - View database: docker-compose exec postgres psql -U scentra -d scentra_vending"
echo ""
echo "📱 For touch screen setup, configure your display and browser to launch:"
echo "   chromium-browser --kiosk --disable-infobars http://localhost"