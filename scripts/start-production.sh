#!/bin/bash

# Scentra Vending Machine - Production Start Script
# This script starts the application in production mode

set -e

echo "🚀 Starting Scentra Vending Machine in Production Mode"
echo "====================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please copy .env.raspberry-pi to .env and configure your settings"
    exit 1
fi

# Source environment variables
source .env

# Check if database is accessible
echo "🔍 Checking database connection..."
if ! npm run db:push --silent; then
    echo "❌ Database connection failed"
    echo "Please check your DATABASE_URL in .env file"
    exit 1
fi

echo "✅ Database connected successfully"

# Build the application if dist doesn't exist
if [ ! -d "dist" ]; then
    echo "🔨 Building application..."
    npm run build
fi

# Start the application
echo "🎯 Starting application on port ${PORT:-5000}..."
NODE_ENV=production tsx server/index.ts