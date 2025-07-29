#!/bin/bash

# Scentra Vending Machine - Raspberry Pi Setup Script
# This script sets up the complete environment for production deployment

set -e

echo "🍓 Scentra Vending Machine - Raspberry Pi Setup"
echo "=============================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "❌ This script must be run as root (use sudo)"
   exit 1
fi

# Create scentra user if it doesn't exist
if ! id "scentra" &>/dev/null; then
    echo "👤 Creating scentra user..."
    useradd -m -s /bin/bash scentra
    usermod -aG sudo scentra
    echo "✅ User created successfully"
fi

# Update system packages
echo "📦 Updating system packages..."
apt update && apt upgrade -y
echo "✅ System updated"

# Install required system packages
echo "🔧 Installing system dependencies..."
apt install -y \
    curl \
    wget \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    ufw \
    htop \
    nano \
    unclutter \
    chromium-browser

echo "✅ System packages installed"

# Install Node.js 20
echo "📥 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
echo "✅ Node.js $(node --version) installed"

# Install Docker
echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
usermod -aG docker pi
usermod -aG docker scentra
rm get-docker.sh
echo "✅ Docker installed"

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
echo "✅ Docker Compose installed"

# Setup PostgreSQL
echo "🗄️ Configuring PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER scentra_user WITH PASSWORD 'scentra_password';" || true
sudo -u postgres psql -c "CREATE DATABASE scentra_db OWNER scentra_user;" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE scentra_db TO scentra_user;" || true
echo "✅ PostgreSQL configured"

# Setup Nginx
echo "🌐 Configuring Nginx..."
systemctl stop nginx || true

# Copy Nginx configuration if it exists
if [ -f "nginx.raspberry-pi.conf" ]; then
    cp nginx.raspberry-pi.conf /etc/nginx/nginx.conf
    echo "✅ Nginx configuration copied"
else
    echo "⚠️ nginx.raspberry-pi.conf not found, using default configuration"
fi

# Setup UFW Firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 5000/tcp # Application
echo "✅ Firewall configured"

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /home/scentra
chown scentra:scentra /home/scentra

# Setup systemd service
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/scentra.service << EOF
[Unit]
Description=Scentra Vending Machine Application
After=network.target postgresql.service
Wants=postgresql.service

[Service]
Type=simple
User=scentra
WorkingDirectory=/home/scentra/scentra-vending-machine
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable scentra
echo "✅ Systemd service created"

# Setup GPIO permissions (for hardware integration)
echo "🔌 Setting up GPIO permissions..."
usermod -aG gpio scentra || true
usermod -aG gpio pi || true

# Add device permissions
echo 'SUBSYSTEM=="gpio", GROUP="gpio", MODE="0664"' > /etc/udev/rules.d/99-gpio.rules
echo 'SUBSYSTEM=="pwm", GROUP="gpio", MODE="0664"' >> /etc/udev/rules.d/99-gpio.rules
udevadm control --reload-rules
echo "✅ GPIO permissions configured"

# Optimize for Raspberry Pi
echo "⚡ Optimizing system for Raspberry Pi..."

# Increase GPU memory split
echo "gpu_mem=128" >> /boot/config.txt

# Optimize PostgreSQL for Pi
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | head -1 | awk '{print $2}' | cut -d. -f1)
PG_CONFIG="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"

if [ -f "$PG_CONFIG" ]; then
    # Backup original config
    cp "$PG_CONFIG" "$PG_CONFIG.backup"
    
    # Apply Pi-optimized settings
    sed -i "s/#shared_buffers = 128MB/shared_buffers = 64MB/" "$PG_CONFIG"
    sed -i "s/#effective_cache_size = 4GB/effective_cache_size = 256MB/" "$PG_CONFIG"
    sed -i "s/#maintenance_work_mem = 64MB/maintenance_work_mem = 16MB/" "$PG_CONFIG"
    sed -i "s/#checkpoint_completion_target = 0.5/checkpoint_completion_target = 0.9/" "$PG_CONFIG"
    sed -i "s/#wal_buffers = -1/wal_buffers = 16MB/" "$PG_CONFIG"
    
    systemctl restart postgresql
fi

echo "✅ System optimized"

# Create startup script
echo "🚀 Creating startup scripts..."
cat > /home/scentra/start-kiosk.sh << 'EOF'
#!/bin/bash
# Start kiosk mode
export DISPLAY=:0
xset s noblank
xset s off
xset -dpms
unclutter -idle 0.5 -root &
chromium-browser --noerrdialogs --disable-infobars --kiosk --disable-session-crashed-bubble --disable-features=TranslateUI http://localhost:5000
EOF

chmod +x /home/scentra/start-kiosk.sh
chown scentra:scentra /home/scentra/start-kiosk.sh
echo "✅ Kiosk script created"

# Final instructions
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Clone your repository: git clone https://github.com/yourusername/scentra-vending-machine.git /home/scentra/scentra-vending-machine"
echo "2. Configure environment: cp /home/scentra/scentra-vending-machine/.env.raspberry-pi /home/scentra/scentra-vending-machine/.env"
echo "3. Edit environment file: nano /home/scentra/scentra-vending-machine/.env"
echo "4. Install app dependencies: cd /home/scentra/scentra-vending-machine && npm install"
echo "5. Setup database: npm run db:push"
echo "6. Start service: sudo systemctl start scentra"
echo "7. Enable kiosk mode: Add '/home/scentra/start-kiosk.sh &' to ~/.config/openbox/autostart"
echo ""
echo "🌐 Your app will be available at: http://localhost:5000"
echo "🔐 Admin panel: http://localhost:5000/admin (username: admin, password: admin)"
echo ""
echo "🔧 Useful commands:"
echo "  sudo systemctl status scentra     # Check service status"
echo "  sudo journalctl -u scentra -f     # View logs"
echo "  sudo systemctl restart scentra    # Restart service"
echo ""
echo "✅ Scentra Vending Machine setup complete!"