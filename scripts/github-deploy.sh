#!/bin/bash

# GitHub Deployment Script for Raspberry Pi
# This script is executed via GitHub Actions

set -e

APP_DIR="/home/scentra/scentra-vending-machine"
SERVICE_NAME="scentra"

echo "🔄 Starting GitHub deployment process..."

# Navigate to application directory
cd "$APP_DIR"

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install/update dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build application
echo "🔨 Building application..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npm run db:push

# Restart the service
echo "🔄 Restarting service..."
sudo systemctl restart "$SERVICE_NAME"

# Check service status
echo "✅ Checking service status..."
sleep 5
sudo systemctl is-active --quiet "$SERVICE_NAME" && echo "Service is running" || echo "Service failed to start"

# Show recent logs
echo "📋 Recent service logs:"
sudo journalctl -u "$SERVICE_NAME" -n 10 --no-pager

echo "🎉 Deployment completed successfully!"