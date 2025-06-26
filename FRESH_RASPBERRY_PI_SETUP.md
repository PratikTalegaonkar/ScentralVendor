# Fresh Raspberry Pi Setup for Scentra Vending Machine

## Prerequisites
- Raspberry Pi 4 (4GB+ RAM recommended)
- 32GB+ microSD card (Class 10 or better)
- Fresh Raspberry Pi OS installation
- Internet connection

## Step 1: Initial System Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl vim htop

# Enable SSH (if needed for remote access)
sudo systemctl enable ssh
sudo systemctl start ssh
```

## Step 2: Install Docker

```bash
# Install Docker using official script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt-get install -y docker-compose-plugin

# Log out and back in for group changes
echo "Please log out and log back in, then continue..."
```

## Step 3: Clone and Setup Project

```bash
# Clone your repository (replace with your actual repo URL)
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine

# Or if using a different repository name:
# git clone <your-repo-url>
# cd <your-project-directory>
```

## Step 4: Create Environment Configuration

```bash
# Create production environment file
cat > .env << 'EOF'
# Production Environment Configuration
POSTGRES_PASSWORD=scentra_secure_password_2024
DATABASE_URL=postgresql://scentra:scentra_secure_password_2024@postgres:5432/scentra_vending

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_JC3STLbbaI4tzF
RAZORPAY_KEY_SECRET=UWgSetKohp5TbYd2RwYMiNfQ

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=scentra_session_secret_2024_change_this
EOF

# Edit environment file with your actual credentials
nano .env
```

## Step 5: Create Deployment Files

```bash
# Create optimized Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy source code
COPY --chown=nextjs:nodejs . .

# Build application
RUN npm run build && npm prune --production

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/products', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Start application
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
EOF
```

```bash
# Create Docker Compose file
cat > docker-compose.yml << 'EOF'
services:
  postgres:
    image: postgres:15-alpine
    container_name: scentra-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: scentra_vending
      POSTGRES_USER: scentra
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U scentra -d scentra_vending"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    container_name: scentra-app
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      RAZORPAY_KEY_ID: ${RAZORPAY_KEY_ID}
      RAZORPAY_KEY_SECRET: ${RAZORPAY_KEY_SECRET}
      SESSION_SECRET: ${SESSION_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - app_logs:/app/logs

volumes:
  postgres_data:
  app_logs:
EOF
```

## Step 6: Deploy Application

```bash
# Create deployment script
cat > deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "Starting Scentra Vending Machine deployment..."

# Clean up any existing containers
docker compose down 2>/dev/null || true

# Build application
echo "Building application..."
docker compose build --no-cache

# Start database
echo "Starting database..."
docker compose up -d postgres

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 15

# Run database migrations
echo "Running database migrations..."
docker compose run --rm app npm run db:push

# Start all services
echo "Starting all services..."
docker compose up -d

# Show status
echo "Service Status:"
docker compose ps

echo ""
echo "Deployment complete!"
echo "Application available at: http://localhost:5000"
echo "Database available at: localhost:5432"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Stop services: docker compose down"
echo "  Restart app: docker compose restart app"
EOF

chmod +x deploy.sh
./deploy.sh
```

## Step 7: Setup Touch Screen (Optional)

```bash
# Install Chromium for kiosk mode
sudo apt install -y chromium-browser unclutter

# Create kiosk startup script
cat > /home/pi/start-kiosk.sh << 'EOF'
#!/bin/bash
export DISPLAY=:0
unclutter -idle 0.5 -root &
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000
EOF

chmod +x /home/pi/start-kiosk.sh

# Add to autostart (optional)
echo "@/home/pi/start-kiosk.sh" >> ~/.config/lxsession/LXDE-pi/autostart
```

## Step 8: System Optimizations

```bash
# Optimize memory for PostgreSQL
echo "vm.swappiness=10" | sudo tee -a /etc/sysctl.conf

# Increase swap space
sudo dphys-swapfile swapoff
sudo sed -i 's/CONF_SWAPSIZE=100/CONF_SWAPSIZE=1024/' /etc/dphys-swapfile
sudo dphys-swapfile setup
sudo dphys-swapfile swapon

# Enable Docker to start on boot
sudo systemctl enable docker

# Create systemd service for auto-start
sudo cat > /etc/systemd/system/scentra-vending.service << 'EOF'
[Unit]
Description=Scentra Vending Machine
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/pi/scentra-vending-machine
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0
User=pi

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable scentra-vending.service
```

## Monitoring and Maintenance

```bash
# View application logs
docker compose logs -f app

# View database logs
docker compose logs -f postgres

# Monitor system resources
htop

# Backup database
docker compose exec postgres pg_dump -U scentra scentra_vending > backup_$(date +%Y%m%d).sql

# Update application
git pull
docker compose build --no-cache
docker compose up -d
```

## Troubleshooting

### Check disk space
```bash
df -h
```

### Free up space if needed
```bash
sudo apt autoremove -y
sudo apt autoclean
docker system prune -f
```

### Restart services
```bash
docker compose restart
```

### Check service status
```bash
docker compose ps
docker compose logs
```

This setup provides a production-ready deployment with automatic startup, health checks, and proper logging.