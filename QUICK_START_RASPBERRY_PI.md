# 🍓 Quick Start: Raspberry Pi Deployment

Get your Scentra Vending Machine running on Raspberry Pi in under 30 minutes!

## Prerequisites

- Raspberry Pi 4 (4GB+ RAM)
- Raspberry Pi OS installed
- Internet connection
- SSH enabled

## Option 1: Automated Setup (Recommended)

### Step 1: Connect to your Pi
```bash
ssh pi@<your-pi-ip>
```

### Step 2: Clone and run setup
```bash
git clone https://github.com/<your-username>/scentra-vending-machine.git
cd scentra-vending-machine
sudo ./scripts/raspberry-pi-setup.sh
```

### Step 3: Configure environment
```bash
nano .env
```
Add your credentials:
```env
DATABASE_URL=postgresql://scentra_user:scentra_password@localhost:5432/scentra_db
RAZORPAY_KEY_ID=your_key_here
RAZORPAY_KEY_SECRET=your_secret_here
SESSION_SECRET=random_secret_string
```

### Step 4: Start the application
```bash
npm run db:push
sudo systemctl start scentra
```

### Step 5: Access your app
Open browser: `http://<your-pi-ip>`

## Option 2: Docker Deployment

```bash
# Clone repository
git clone https://github.com/<your-username>/scentra-vending-machine.git
cd scentra-vending-machine

# Copy environment
cp .env.raspberry-pi .env
nano .env  # Add your credentials

# Start with Docker
docker-compose -f docker-compose.raspberry-pi.yml up -d
```

## GitHub Auto-Deployment Setup

### 1. Generate SSH Key
```bash
ssh-keygen -t ed25519 -f ~/.ssh/scentra_pi
ssh-copy-id -i ~/.ssh/scentra_pi.pub pi@<your-pi-ip>
```

### 2. Add GitHub Secrets
In your repository Settings > Secrets:
- `PI_HOST`: Your Pi's IP address
- `PI_USERNAME`: `pi`
- `PI_SSH_KEY`: Content of `~/.ssh/scentra_pi`
- `PI_PORT`: `22`

### 3. Deploy automatically
Every push to main branch will auto-deploy to your Pi!

## Verification Commands

```bash
# Check service status
sudo systemctl status scentra

# View logs
sudo journalctl -u scentra -f

# Test connection
curl http://localhost:5000

# Check database
sudo -u postgres psql -d scentra_db -c "\dt"
```

## Admin Access

- URL: `http://<your-pi-ip>/admin`
- Username: `admin`
- Password: `admin` (change this!)

## Troubleshooting

### Service won't start
```bash
sudo journalctl -u scentra -n 20
npm run db:push
sudo systemctl restart scentra
```

### Can't connect to database
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Permission issues
```bash
sudo chown -R scentra:scentra /home/pi/scentra-vending-machine
```

## Kiosk Mode (Touch Screen)

```bash
# Install packages
sudo apt install chromium-browser unclutter -y

# Auto-start kiosk
echo "/home/pi/scentra-vending-machine/start-kiosk.sh &" >> ~/.config/openbox/autostart

# Enable auto-login
sudo raspi-config
# Boot Options > Desktop Autologin
```

## Security Hardening

```bash
# Change default passwords
sudo passwd pi
sudo passwd postgres

# Setup firewall
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80

# Update system
sudo apt update && sudo apt upgrade -y
```

## Hardware Integration Ready

The application is prepared for:
- ✅ Spray dispensers (GPIO control)
- ✅ Bottle dispensers (Servo motors)
- ✅ Touch screen interface
- ✅ Payment terminal integration
- ✅ LED status indicators

## Next Steps

1. **Test the application** with sample products
2. **Configure payment gateway** with live credentials
3. **Set up hardware integration** for dispensers
4. **Configure touch screen** for kiosk mode
5. **Set up monitoring** and backups

## Support

- 📚 Full documentation: `DEPLOYMENT.md`
- 🔧 GitHub setup: `GITHUB_SETUP.md`
- 🛠️ Hardware integration: Contact support

**Your Scentra Vending Machine is now ready to serve customers!** 🎉