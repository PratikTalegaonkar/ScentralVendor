# 🌟 Scentra Perfume Vending Machine

A sophisticated luxury perfume vending machine application designed for Raspberry Pi deployment with touch-screen interface, real-time inventory management, and integrated payment processing.

![Scentra Vending Machine](https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=800&h=400&fit=crop)

## 🚀 Features

### 🎯 **Customer Experience**
- **Touch-optimized interface** with luxury design aesthetics
- **Fragrance sampling** via spray dispensers
- **Multiple bottle sizes** (30ml, 60ml, 100ml) for purchase
- **Integrated payments** through Razorpay with multiple payment methods
- **Real-time inventory** showing availability across all products

### 🛡️ **Admin Dashboard**
- **Comprehensive inventory management** with real-time stock tracking
- **Multi-slot assignment system** supporting flexible product placement
- **Sales analytics** with daily, weekly, and monthly reports
- **Order management** with payment status tracking
- **Stock validation** preventing over-assignment beyond inventory limits

### 🔧 **Technical Specifications**
- **React 18** with TypeScript for type-safe frontend development
- **Express.js** backend with PostgreSQL database
- **Docker containerization** for consistent deployment
- **Nginx reverse proxy** with security headers and rate limiting
- **GitHub Actions** for automated CI/CD deployment

## 📋 Quick Start

### Option 1: Automated Raspberry Pi Setup

```bash
# Clone repository
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine

# Run automated setup (Raspberry Pi)
sudo ./scripts/raspberry-pi-setup.sh

# Configure environment
cp .env.raspberry-pi .env
nano .env  # Add your API keys

# Start application
npm run db:push
sudo systemctl start scentra
```

### Option 2: Docker Deployment

```bash
# Clone and configure
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine
cp .env.raspberry-pi .env

# Start with Docker Compose
docker-compose -f docker-compose.raspberry-pi.yml up -d
```

### Option 3: Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

## 🔐 Environment Configuration

Create `.env` file with these required variables:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/scentra_db
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key
SESSION_SECRET=your_random_session_secret
NODE_ENV=production
PORT=5000
```

## 🚢 Deployment Options

### GitHub Actions (Recommended)

1. **Fork this repository**
2. **Configure GitHub secrets**:
   - `PI_HOST`: Raspberry Pi IP address
   - `PI_USERNAME`: SSH username (usually `pi`)
   - `PI_SSH_KEY`: Private SSH key content
   - `PI_PORT`: SSH port (usually `22`)

3. **Push to main branch** → Automatic deployment!

### Manual Deployment

```bash
# SSH to Raspberry Pi
ssh pi@your-pi-ip

# Clone repository
git clone https://github.com/yourusername/scentra-vending-machine.git
cd scentra-vending-machine

# Run setup script
chmod +x scripts/raspberry-pi-setup.sh
sudo ./scripts/raspberry-pi-setup.sh
```

## 📊 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Touch Screen  │────│  React Frontend  │────│  Express API    │
│   (Customer)    │    │  (Vite + TS)     │    │  (Node.js)      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │────│  Admin Dashboard │────│  PostgreSQL     │
│   (Management)  │    │  (Real-time)     │    │  (Database)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Razorpay      │────│  Payment Gateway │────│  Hardware GPIO  │
│   (Payments)    │    │  (Secure)        │    │  (Dispensers)   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔧 Hardware Integration

### GPIO Configuration (Raspberry Pi)
- **Spray Dispensers**: GPIO pins 18, 19, 20, 21, 22 (5 slots)
- **Bottle Dispensers**: GPIO pins 23-37 (15 slots with servo motors)
- **Status LEDs**: GPIO pins 2, 3, 4 (Power, Network, Error)
- **Touch Screen**: DSI or HDMI connection with USB touch input

### Recommended Hardware
- **Raspberry Pi 4** (4GB+ RAM)
- **7" Touch Screen** or larger
- **Servo Motors** for bottle dispensing
- **Solenoid Valves** for spray dispensing
- **Power Supply** (5V 4A minimum)

## 📱 Kiosk Mode Setup

```bash
# Install kiosk packages
sudo apt install chromium-browser unclutter -y

# Configure auto-start
echo "chromium-browser --kiosk --disable-infobars --disable-session-crashed-bubble http://localhost:5000" >> ~/.config/openbox/autostart

# Enable auto-login
sudo raspi-config
# Navigate to: Boot Options > Desktop Autologin
```

## 🛡️ Security Features

- **Rate limiting** on API endpoints
- **Session-based authentication** for admin access
- **PCI-compliant payments** through Razorpay
- **HTTPS ready** with SSL certificate support
- **Firewall configuration** with UFW
- **Security headers** via Nginx

## 📈 Analytics & Monitoring

### Built-in Analytics
- **Real-time sales tracking**
- **Inventory heatmaps** showing popular products
- **Revenue analytics** with trend analysis
- **Stock level monitoring** with alerts
- **Usage patterns** and peak time analysis

### Health Monitoring
```bash
# Check service status
sudo systemctl status scentra

# View application logs
sudo journalctl -u scentra -f

# Test API health
curl http://localhost:5000/health
```

## 🔧 API Endpoints

### Customer Endpoints
- `GET /api/products` - Available products
- `POST /api/orders` - Create spray order
- `POST /api/bottle-orders` - Create bottle order
- `POST /api/razorpay/verify` - Verify payment

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/products` - Product management
- `GET /api/admin/orders` - Order history
- `GET /api/admin/analytics` - Sales analytics

## 📚 Documentation

- 📖 **[Setup Guide](DEPLOYMENT.md)** - Complete deployment instructions
- 🔧 **[GitHub Setup](GITHUB_SETUP.md)** - Automated deployment configuration
- ⚡ **[Quick Start](QUICK_START_RASPBERRY_PI.md)** - 30-minute setup guide
- 🔐 **[Security Guide](SECURITY.md)** - Production security hardening

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting
- **Service won't start**: Check logs with `sudo journalctl -u scentra -n 20`
- **Database issues**: Run `npm run db:push` to sync schema
- **Payment failures**: Verify Razorpay credentials in `.env`
- **GPIO issues**: Check hardware connections and permissions

### Getting Help
- 📧 Create an issue on GitHub
- 💬 Check existing discussions
- 📚 Review documentation guides

## 🌟 Acknowledgments

- **Razorpay** for payment processing
- **Unsplash** for high-quality product images
- **React** and **Express** communities
- **Raspberry Pi Foundation** for hardware platform

---

**Made with ❤️ for luxury fragrance retail automation**

*Transform your fragrance business with intelligent vending technology*