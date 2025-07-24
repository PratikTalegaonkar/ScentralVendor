# Scentra Vending Machine - Raspberry Pi Deployment Guide

## Prerequisites

### Hardware Requirements
- Raspberry Pi 4 (4GB RAM minimum, 8GB recommended)
- microSD card (32GB minimum, Class 10)
- Touch display (7" or larger recommended)
- Stable internet connection
- Optional: External storage for database persistence

### Software Requirements
- Raspberry Pi OS (64-bit recommended)
- Docker and Docker Compose
- SSH access (for remote deployment)

## Quick Deployment

### 1. Prepare Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install git if not present
sudo apt install -y git

# Clone your project
git clone <your-repository-url>
cd scentra-vending-machine
```

### 2. Configure Environment

```bash
# Copy and edit environment variables
cp .env.production .env
nano .env
```

Update these critical values in `.env`:
```env
POSTGRES_PASSWORD=your_secure_password_here
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Deploy Application

```bash
# Run deployment script
./deploy.sh
```

The script will:
- Install Docker if needed
- Build the application
- Start PostgreSQL database
- Run database migrations
- Launch the vending machine app

### 4. Access Application

- Direct access: `http://raspberry-pi-ip:5000`
- With Nginx: `http://raspberry-pi-ip`

## Touch Screen Setup

### Configure Kiosk Mode

1. **Install Chromium**:
```bash
sudo apt install -y chromium-browser unclutter
```

2. **Create kiosk script** (`/home/pi/kiosk.sh`):
```bash
#!/bin/bash
export DISPLAY=:0
unclutter -idle 0.5 -root &
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5000
```

3. **Auto-start on boot**:
```bash
# Add to /etc/xdg/lxsession/LXDE-pi/autostart
@/home/pi/kiosk.sh
```

### Touch Calibration
```bash
# Install calibration tool
sudo apt install -y xinput-calibrator

# Run calibration
xinput_calibrator
```

## Production Optimizations

### 1. Enable Hardware Acceleration
```bash
# Add to /boot/config.txt
gpu_mem=128
dtoverlay=vc4-fkms-v3d
```

### 2. Optimize for Kiosk
```bash
# Disable screensaver
sudo apt install -y xscreensaver
# Configure in GUI: Applications > Preferences > Screensaver

# Hide cursor automatically
sudo apt install -y unclutter
```

### 3. Auto-restart Services
```bash
# Add to crontab for auto-restart
@reboot cd /path/to/project && docker-compose up -d
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check service status
docker-compose ps

# View application logs
docker-compose logs -f app

# Monitor system resources
htop
```

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U scentra scentra_vending > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U scentra scentra_vending < backup.sql
```

### Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Docker permission denied**:
```bash
sudo usermod -aG docker $USER
# Log out and back in
```

2. **Port already in use**:
```bash
# Check what's using port 5000
sudo netstat -tulpn | grep :5000
# Kill process if needed
sudo kill -9 <PID>
```

3. **Database connection failed**:
```bash
# Check database status
docker-compose logs postgres
# Restart database
docker-compose restart postgres
```

4. **Touch screen not responding**:
```bash
# Check input devices
xinput list
# Recalibrate
xinput_calibrator
```

### Performance Tuning

1. **Increase swap space**:
```bash
sudo dphys-swapfile swapoff
sudo nano /etc/dphys-swapfile
# Set CONF_SWAPSIZE=2048
sudo dphys-swapfile setup
sudo dphys-swapfile swapon
```

2. **Optimize PostgreSQL**:
```bash
# Add to docker-compose.yml postgres service
command: postgres -c shared_preload_libraries=pg_stat_statements -c max_connections=50 -c shared_buffers=128MB
```

## Security Considerations

### Network Security
- Change default passwords
- Use firewall (ufw)
- Enable SSH key authentication
- Disable unnecessary services

### Application Security
- Use HTTPS in production
- Regular security updates
- Monitor access logs
- Implement rate limiting

## Hardware Integration

### GPIO Integration (Optional)
For dispensing mechanism control:

```javascript
// Example GPIO control (requires additional setup)
const gpio = require('rpi-gpio');

// Control dispensing mechanism
function dispenseProduct(productId) {
  gpio.setup(18, gpio.DIR_OUT);
  gpio.write(18, true);
  setTimeout(() => gpio.write(18, false), 1000);
}
```

### LED Status Indicators
```javascript
// Status LED control
const statusLeds = {
  ready: 12,    // Green LED
  processing: 16, // Yellow LED
  error: 18     // Red LED
};
```

## Maintenance Schedule

### Daily
- Check application status
- Monitor disk space
- Review transaction logs

### Weekly
- Database backup
- System updates
- Log rotation

### Monthly
- Security updates
- Performance review
- Hardware inspection