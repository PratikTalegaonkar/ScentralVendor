# Android Kiosk Apps for Scentra Vending Machine

## Top Recommendations

### 1. **Fully Kiosk Browser** (Highly Recommended)
- **Cost**: €8.90/month or €890 lifetime
- **Why Perfect for Vending Machines**:
  - Built specifically for web-based kiosks
  - Advanced touch controls and gesture blocking
  - Auto-reload if connection drops
  - Remote management via cloud dashboard
  - Screen wake/sleep scheduling
  - Crash recovery and auto-restart
- **Setup**: Install app → Enter your Pi URL → Enable kiosk mode
- **Best For**: Professional commercial deployment

### 2. **KioskHome** (Best Free Option)
- **Cost**: Free
- **Features**:
  - Simple launcher replacement
  - Blocks home button and recent apps
  - Auto-start specified app (Chrome)
  - Basic admin PIN protection
- **Limitations**: Less robust than paid solutions
- **Setup**: Install → Set as default launcher → Configure Chrome to open your URL
- **Best For**: Budget-friendly testing and small-scale deployment

### 3. **SureLock** 
- **Cost**: $2.99/month per device
- **Features**:
  - Enterprise-grade kiosk solution
  - Remote device management
  - Whitelist specific websites only
  - Scheduled operations and updates
  - Tamper-proof once configured
- **Best For**: High-security commercial environments

### 4. **Kiosk Browser Lockdown**
- **Cost**: Free with ads, $4.99 ad-free
- **Features**:
  - Browser-focused kiosk mode
  - URL whitelisting
  - Touch gesture controls
  - Auto-reload on errors
- **Best For**: Simple browser-only kiosks

### 5. **Android Kiosk App**
- **Cost**: Free
- **Features**:
  - Open source solution
  - Basic lockdown functionality
  - Customizable interface
- **Limitations**: Requires technical setup
- **Best For**: Developers who want full control

## Recommended Setup Process

### For Fully Kiosk Browser (Professional Choice):
1. Install Fully Kiosk Browser from Play Store
2. Open app and go to Settings
3. Enter your vending machine URL: `http://[PI_IP]:5000`
4. Enable these settings:
   - Kiosk Mode: ON
   - Hide Navigation Bar: ON
   - Block Status Bar: ON
   - Prevent Sleep: ON
   - Auto Reload on Error: ON
   - Touch Sound: OFF
5. Set admin password to prevent tampering
6. Test all payment flows thoroughly

### For KioskHome (Free Choice):
1. Install KioskHome and Chrome browser
2. Set KioskHome as default launcher
3. Configure Chrome with your vending machine URL as homepage
4. Set Chrome to full-screen mode
5. Configure KioskHome to auto-launch Chrome

## Additional Tablet Configuration

### System Settings:
- **Display**: Keep screen on while charging
- **Security**: Disable lock screen
- **Apps**: Disable app installation from unknown sources
- **Network**: Set up WiFi auto-reconnect
- **Developer Options**: Enable "Stay awake"

### Physical Considerations:
- Mount tablet at comfortable touch height (42-48 inches)
- Ensure charging port is accessible
- Consider anti-theft mounting hardware
- Plan for cable management

## Testing Checklist:
- [ ] Touch responsiveness across all interface elements
- [ ] Payment flow completion (Razorpay integration)
- [ ] Auto-recovery after network disconnection
- [ ] Auto-restart after power cycle
- [ ] Prevention of accidental exits
- [ ] Screen brightness in various lighting conditions

Your Pi's current URL: http://[Run 'hostname -I' on Pi]:5000