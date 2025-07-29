# GitHub Repository Setup for Raspberry Pi Deployment

This guide explains how to set up your GitHub repository for automatic deployment to Raspberry Pi.

## Step 1: Create GitHub Repository

1. **Create a new repository** on GitHub
2. **Clone this project** to your local machine
3. **Push to your repository**:
```bash
git remote add origin https://github.com/yourusername/scentra-vending-machine.git
git branch -M main
git push -u origin main
```

## Step 2: Set up GitHub Secrets

Go to your repository **Settings > Secrets and variables > Actions** and add these secrets:

### Required Secrets:
- `PI_HOST`: Your Raspberry Pi IP address (e.g., `192.168.1.100`)
- `PI_USERNAME`: SSH username on Pi (usually `pi` or `scentra`)
- `PI_SSH_KEY`: Your private SSH key content
- `PI_PORT`: SSH port (usually `22`)

### Optional Secrets (for environment):
- `RAZORPAY_KEY_ID`: Your Razorpay API key
- `RAZORPAY_KEY_SECRET`: Your Razorpay secret key
- `SESSION_SECRET`: Random session secret string

## Step 3: Generate SSH Keys

On your **local machine** (not the Pi):

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -f ~/.ssh/scentra_pi -C "github-deployment"

# Copy public key to Raspberry Pi
ssh-copy-id -i ~/.ssh/scentra_pi.pub pi@YOUR_PI_IP_ADDRESS

# Display private key (copy this to GitHub secret PI_SSH_KEY)
cat ~/.ssh/scentra_pi
```

## Step 4: Prepare Raspberry Pi

### 4.1 Initial Setup on Raspberry Pi
```bash
# Connect to your Pi
ssh pi@YOUR_PI_IP_ADDRESS

# Create application directory
sudo mkdir -p /home/scentra
sudo chown pi:pi /home/scentra

# Clone your repository
cd /home/scentra
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine

# Run initial setup
chmod +x scripts/raspberry-pi-setup.sh
sudo ./scripts/raspberry-pi-setup.sh
```

### 4.2 Configure Environment
```bash
# Create environment file
cp .env.raspberry-pi .env
nano .env
```

Update the `.env` file with your settings:
```env
DATABASE_URL=postgresql://scentra_user:scentra_password@localhost:5432/scentra_db
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
SESSION_SECRET=your_random_session_secret
NODE_ENV=production
PORT=5000
```

### 4.3 Test Manual Deployment
```bash
# Make deployment script executable
chmod +x scripts/github-deploy.sh

# Test deployment script
sudo ./scripts/github-deploy.sh
```

## Step 5: Automated Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy-raspberry-pi.yml`) will:

1. **Trigger on push** to main branch
2. **Build the application**
3. **Deploy to Raspberry Pi** via SSH
4. **Restart the service**
5. **Verify deployment**

### Manual Trigger
You can also trigger deployment manually:
1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Deploy to Raspberry Pi** workflow
4. Click **Run workflow**

## Step 6: Monitor Deployment

### View GitHub Actions Logs
- Go to **Actions** tab in your repository
- Click on the latest workflow run
- View deployment logs

### Check Raspberry Pi Status
```bash
# SSH to your Pi
ssh pi@YOUR_PI_IP_ADDRESS

# Check service status
sudo systemctl status scentra

# View application logs
sudo journalctl -u scentra -f

# Check if app is running
curl http://localhost:5000
```

## Step 7: Directory Structure

Your repository should have this structure:
```
scentra-vending-machine/
├── .github/
│   └── workflows/
│       └── deploy-raspberry-pi.yml
├── scripts/
│   ├── raspberry-pi-setup.sh
│   ├── github-deploy.sh
│   └── start-production.sh
├── client/
├── server/
├── shared/
├── .env.raspberry-pi
├── docker-compose.raspberry-pi.yml
├── nginx.raspberry-pi.conf
├── README.md
├── DEPLOYMENT.md
└── GITHUB_SETUP.md
```

## Troubleshooting

### Deployment Fails
```bash
# Check GitHub Actions logs
# Then SSH to Pi and check:
sudo journalctl -u scentra -n 50
```

### SSH Connection Issues
```bash
# Test SSH connection
ssh -i ~/.ssh/scentra_pi pi@YOUR_PI_IP_ADDRESS

# Check SSH key permissions
chmod 600 ~/.ssh/scentra_pi
chmod 644 ~/.ssh/scentra_pi.pub
```

### Service Won't Start
```bash
# Check service logs
sudo journalctl -u scentra -f

# Check if port is in use
sudo netstat -tlnp | grep :5000

# Restart service manually
sudo systemctl restart scentra
```

### Database Issues
```bash
# Check database status
sudo systemctl status postgresql

# Connect to database
sudo -u postgres psql -d scentra_db

# Reset database (if needed)
npm run db:push
```

## Security Best Practices

1. **Use strong passwords** for database and admin accounts
2. **Change default SSH port** (optional)
3. **Set up UFW firewall**:
```bash
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
```

4. **Regular updates**:
```bash
sudo apt update && sudo apt upgrade -y
```

5. **Monitor logs** regularly for suspicious activity

## Production Checklist

- [ ] Repository created and pushed to GitHub
- [ ] GitHub secrets configured
- [ ] SSH keys generated and configured
- [ ] Raspberry Pi setup completed
- [ ] Environment variables configured
- [ ] Database initialized
- [ ] Service running and enabled
- [ ] Nginx configured and running
- [ ] GitHub Actions workflow tested
- [ ] Admin password changed from default
- [ ] SSL certificate configured (if needed)
- [ ] Firewall configured
- [ ] Monitoring set up

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Check Raspberry Pi service logs: `sudo journalctl -u scentra -f`
3. Verify SSH connectivity
4. Test database connection
5. Check network configuration