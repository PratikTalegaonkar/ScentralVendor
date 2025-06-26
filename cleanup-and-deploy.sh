#!/bin/bash

echo "🧹 Cleaning up Docker system to free space..."

# Stop any running containers
docker compose down 2>/dev/null || true

# Clean up Docker system
docker system prune -af --volumes
docker builder prune -af

echo "💾 Checking available disk space..."
df -h

echo "🏗️ Creating optimized Dockerfile..."
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies and build in one layer to reduce image size
RUN npm ci && \
    mkdir -p dist && \
    chown -R nextjs:nodejs /app

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application and clean up dev dependencies
RUN npm run build && \
    npm prune --production && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/products', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
EOF

echo "🚀 Starting optimized deployment..."

# Build with no cache to ensure clean build
docker compose build --no-cache app

echo "🗄️ Starting database..."
docker compose up -d postgres

echo "⏳ Waiting for database..."
sleep 20

echo "🗃️ Running database migrations..."
docker compose run --rm app npm run db:push

echo "🚀 Starting all services..."
docker compose up -d

echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Access your app at: http://localhost:5000"