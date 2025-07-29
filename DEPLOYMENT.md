# Raspberry Pi Deployment Guide

This guide will help you deploy the Scentra Vending Machine on a Raspberry Pi using GitHub.

## Prerequisites

- Raspberry Pi 4 (4GB+ RAM recommended)
- Raspberry Pi OS (64-bit) installed
- SSH enabled on Raspberry Pi
- GitHub repository with your code

## Step 1: Initial Raspberry Pi Setup

### 1.1 Connect to your Raspberry Pi
```bash
ssh pi@<your-pi-ip-address>
```

### 1.2 Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Git
```bash
sudo apt install git -y
```

## Step 2: Clone and Setup the Application

### 2.1 Clone your repository
```bash
cd /home/pi
git clone https://github.com/<your-username>/<your-repo-name>.git scentra-vending-machine
cd scentra-vending-machine
```

### 2.2 Run the automated setup script
```bash
chmod +x scripts/raspberry-pi-setup.sh
sudo ./scripts/raspberry-pi-setup.sh
```

This script will:
- Install Node.js 20
- Install PostgreSQL
- Create database and user
- Install application dependencies
- Set up Nginx reverse proxy
- Create systemd service
- Configure kiosk mode

## Step 3: Configure Environment

### 3.1 Edit environment variables
```bash
sudo nano .env
```

Update the following variables:
```env
DATABASE_URL=postgresql://scentra_user:scentra_password@localhost:5432/scentra_db
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
SESSION_SECRET=your_session_secret_here
NODE_ENV=production
PORT=5000
```

### 3.2 Initialize the database
```bash
npm run db:push
```

## Step 4: Start the Application

### 4.1 Start and enable the service
```bash
sudo systemctl start scentra
sudo systemctl enable scentra
```

### 4.2 Check service status
```bash
sudo systemctl status scentra
```

### 4.3 View logs
```bash
sudo journalctl -u scentra -f
```

## Step 5: Set up GitHub Actions (Optional)

### 5.1 Create GitHub Secrets

In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

- `PI_HOST`: Your Raspberry Pi IP address
- `PI_USERNAME`: SSH username (usually 'pi' or 'scentra')
- `PI_SSH_KEY`: Your private SSH key content
- `PI_PORT`: SSH port (usually 22)

### 5.2 SSH Key Setup

On your Raspberry Pi:
```bash
# Generate SSH key pair
ssh-keygen -t ed25519 -C "github-actions"

# Add public key to authorized_keys
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Copy private key content for GitHub secret
cat ~/.ssh/id_ed25519
```

## Step 6: Access the Application

### 6.1 Web Interface
- Open browser and go to: `http://<your-pi-ip-address>`
- For local access: `http://localhost`

### 6.2 Admin Dashboard
- Navigate to: `http://<your-pi-ip-address>/admin`
- Login with:
  - Username: `admin`
  - Password: `admin`

## Step 7: Kiosk Mode Setup (Optional)

### 7.1 Install desktop environment (if not already installed)
```bash
sudo apt install xorg openbox chromium-browser unclutter -y
```

### 7.2 Auto-start kiosk mode
```bash
# Edit autostart file
nano ~/.config/openbox/autostart

# Add the following line:
/home/pi/scentra-vending-machine/start-kiosk.sh &
```

### 7.3 Enable auto-login (optional)
```bash
sudo raspi-config
# Navigate to: System Options > Boot / Auto Login > Desktop Autologin
```

## Troubleshooting

### Service Issues
```bash
# Check service status
sudo systemctl status scentra

# View detailed logs
sudo journalctl -u scentra -n 50

# Restart service
sudo systemctl restart scentra
```

### Database Issues
```bash
# Connect to database
sudo -u postgres psql -d scentra_db

# Check database tables
\dt

# Exit database
\q
```

### Network Issues
```bash
# Check if port 5000 is listening
sudo netstat -tlnp | grep :5000

# Check Nginx status
sudo systemctl status nginx

# Test Nginx configuration
sudo nginx -t
```

### Permission Issues
```bash
# Fix ownership
sudo chown -R scentra:scentra /home/pi/scentra-vending-machine

# Fix service permissions
sudo chmod +x scripts/raspberry-pi-setup.sh
```

## Updating the Application

### Manual Update
```bash
cd /home/pi/scentra-vending-machine
git pull origin main
npm ci --production
npm run build
sudo systemctl restart scentra
```

### Automatic Update (via GitHub Actions)
Push changes to your main branch, and GitHub Actions will automatically deploy to your Raspberry Pi.

## Security Considerations

1. **Change default passwords**
2. **Set up firewall**:
```bash
sudo ufw enable
sudo ufw allow 22  # SSH
sudo ufw allow 80  # HTTP
```

3. **Use environment variables for secrets**
4. **Regular system updates**:
```bash
sudo apt update && sudo apt upgrade -y
```

## Hardware Integration

### Touch Screen Setup
```bash
# Install touch screen drivers (example for official Pi touchscreen)
sudo apt install xserver-xorg-input-evdev -y
```

### Hardware GPIO Integration
The application is ready for hardware integration. You can extend the codebase to control:
- Spray dispensers via GPIO pins
- Bottle dispensers via servo motors
- LED indicators
- Physical buttons

## Support

For issues or questions:
1. Check the logs: `sudo journalctl -u scentra -f`
2. Verify database connection
3. Check GitHub repository issues
4. Review this deployment guide