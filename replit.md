# Scentra Perfume Vending Machine - System Architecture

## Overview

Scentra is a luxury perfume vending machine application designed for Raspberry Pi deployment. The system enables customers to try fragrances through spray dispensing and purchase perfume bottles. It features a modern React frontend with a touch-friendly interface, Express.js backend, PostgreSQL database, and integrated payment processing through Razorpay.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom luxury theming (gold, charcoal, platinum colors)
- **UI Components**: Radix UI components for accessibility and consistency
- **Animations**: Framer Motion for smooth transitions and engaging interactions
- **State Management**: React hooks and TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Express sessions with PostgreSQL storage
- **Payment Integration**: Razorpay for Indian market payment processing
- **API Design**: RESTful API with JSON responses

### Database Schema
The system uses PostgreSQL with the following main entities:
- **Users**: Admin authentication and management
- **Products**: Perfume information with multiple stock types (spray, 30ml, 60ml, 100ml bottles)
- **Orders**: Transaction records with payment status tracking
- **Admin Sessions**: Secure admin authentication tokens

## Key Components

### Vending Machine Interface
- **Screensaver**: Rotating high-quality perfume images with brand messaging
- **Welcome Screen**: Entry point with options to try fragrances or explore collection
- **Product Selection**: Grid display of available perfumes with quantity selection
- **Payment Modal**: Integrated Razorpay payment processing
- **Success Screens**: Order confirmation and bottle purchase upselling
- **Admin Panel**: Product management and order tracking interface

### Payment Processing
- **Primary Gateway**: Razorpay integration supporting multiple payment methods
- **Fallback Support**: Stripe integration for future expansion
- **Order Management**: Complete order lifecycle tracking from creation to fulfillment

### Inventory Management
- **Multi-tier Stock**: Separate tracking for spray samples and bottle sizes
- **Real-time Updates**: Stock levels updated on each transaction
- **Admin Controls**: Inventory management through secure admin interface

## Data Flow

1. **Customer Interaction**: Touch interface guides users through product selection
2. **Payment Processing**: Secure Razorpay integration handles transactions
3. **Order Creation**: Successful payments create order records in database
4. **Stock Management**: Inventory automatically decremented upon purchase
5. **Fulfillment**: Physical dispensing triggered by successful payment
6. **Upselling**: Post-purchase bottle recommendations based on selection

## External Dependencies

### Payment Services
- **Razorpay**: Primary payment gateway for Indian market
- **Stripe**: Secondary payment option for international expansion

### Database
- **PostgreSQL**: Production database with connection pooling
- **Neon Serverless**: Cloud database option for development

### Infrastructure
- **Docker**: Containerized deployment for consistent environments
- **Nginx**: Reverse proxy with rate limiting and security headers
- **Docker Compose**: Multi-service orchestration for production deployment

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **Database**: Local PostgreSQL or Neon cloud database
- **Environment**: Node.js 18+ with npm package management

### Production Deployment
- **Target Platform**: Raspberry Pi 4 (4GB+ RAM recommended)
- **Containerization**: Docker multi-stage builds for optimized images
- **Orchestration**: Docker Compose with health checks and auto-restart policies
- **Reverse Proxy**: Nginx for load balancing and security
- **Database**: PostgreSQL with persistent volumes
- **Monitoring**: Health checks for both application and database services

### Security Considerations
- **Admin Authentication**: Session-based authentication with secure tokens
- **Payment Security**: PCI-compliant payment processing through Razorpay
- **Network Security**: Reverse proxy with rate limiting and security headers
- **Data Protection**: Environment variable management for sensitive credentials

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### January 29, 2025 - Complete GitHub Export Package & Production Deployment System
- GITHUB EXPORT COMPLETE: Created comprehensive repository package ready for GitHub deployment
- Professional README.md: Complete documentation with features, setup guides, and system architecture
- GitHub Actions workflow: Automated CI/CD pipeline for Raspberry Pi deployment on code push
- Production scripts: Automated Raspberry Pi setup script with all dependencies and configurations
- Environment templates: Complete .env.raspberry-pi template with all necessary configuration options
- Docker configurations: Production-ready Docker Compose setup with Nginx reverse proxy
- Documentation suite: DEPLOYMENT.md, GITHUB_SETUP.md, QUICK_START_RASPBERRY_PI.md guides
- Security hardening: UFW firewall, rate limiting, GPIO permissions, and systemd service setup
- Kiosk mode ready: Full-screen touch interface with auto-startup scripts for vending machine operation
- Hardware integration: GPIO pin configurations for spray dispensers and bottle servos
- MIT License: Open source licensing for commercial and personal use
- Image fixes: Enhanced error handling and fallback systems for product image display
- Repository structure: Complete file organization with proper .gitignore and executable scripts

### January 29, 2025 - Inventory-Based Slot Assignment Validation System
- MAJOR ENHANCEMENT: Implemented comprehensive inventory validation for bottle slot assignments
- Cross-slot inventory tracking: System prevents assigning more units across all slots than available in product inventory
- Real-time availability display: Shows available quantity for each product variant when assigning to slots
- Smart input validation: Slot quantity input automatically limited to available inventory quantity
- Enhanced error handling: Clear error messages when attempting to exceed inventory limits
- API endpoint added: GET /api/admin/products/:productId/available-quantity/:bottleSize for real-time availability
- Database validation: Server-side validation prevents over-assignment even if UI bypassed
- Example: Product with 6 total units can have max 6 units assigned across all slots combined
- UI improvements: "Available: X" indicator, disabled assign button when exceeding limits
- Complete integration with existing slot management system while respecting inventory constraints

### January 29, 2025 - Editable Stock Management & Complete Keyboard Integration
- REDESIGNED: Product inventory with editable bottle stock levels that update automatically with sales
- Clear product display: large product image (96x96), product name, description, and availability status
- Dedicated edit button: prominent "Edit Product Details & Pricing" button for each product
- EDITABLE STOCK SYSTEM: Admin can set initial bottle stock levels (30ml, 60ml, 100ml) via edit form
- Sales-linked inventory: stock levels automatically decrease when products are purchased
- Visual stock indicators: color-coded cards with background tinting (green/yellow/red) based on stock levels
- Read-only stock display: removed +/- buttons from main view, showing only current stock with sales tracking
- Stock management in edit form: separate input fields for setting bottle stock levels (max 20 each)
- Price display: current pricing shown for spray and all bottle sizes within stock cards
- Stock status badges: clear indicators for stock levels with automatic sales tracking
- Professional styling: luxury color scheme with luxe-gold accents and clean card-based layout
- Enhanced user experience: smooth animations, clear visual hierarchy, and intuitive touch-friendly controls
- MAJOR ACCESSIBILITY UPDATE: All input fields now support physical keyboards when connected to Raspberry Pi
- Dual input system: real HTML input elements for keyboard users + touch keyboards for screen-only mode
- Input styling: dark theme compatible fields with proper placeholder text and validation
- Number inputs: proper step values (0.01) and min values (0) for price fields with rupee symbol display
- Keyboard accessibility: Tab navigation, Enter to submit, proper input types (text, number, url)
- Direct keyboard activation: keyboards appear immediately when clicking/focusing input fields (no icon buttons needed)  
- Enhanced user experience: seamless keyboard integration with proper z-index layering (z-[100]) above all modals
- Clean interface: removed virtual keyboard icons for streamlined touch experience
- CLIPBOARD INTEGRATION: Added paste button for Image URL field to easily paste image links from clipboard
- Smart URL validation: Automatically validates pasted content to ensure it's a proper URL format
- User-friendly feedback: Clear success/error messages when pasting URLs from clipboard

### January 29, 2025 - Fixed Slot Assignment Authentication & API Integration
- CRITICAL FIX: Added missing authentication headers to all slot assignment API calls
- Authentication tokens: All slot management requests now include Bearer token from localStorage
- Spray slot assignment: Fixed 401 authentication errors for assign/remove operations
- Bottle slot assignment: Fixed 401 authentication errors for assign/remove operations  
- Real-time UI updates: Slot changes now properly refresh the admin dashboard interface
- Error handling: Improved error messages for failed slot operations
- Backend integration: Corrected API endpoint usage to match server route definitions

### January 29, 2025 - Multi-Size Bottle Slot Assignment System Complete
- MAJOR FEATURE COMPLETE: Same product can now be assigned to multiple bottle slots with different sizes
- Multi-slot capability: Product A can be in slot 1 (30ml), slot 2 (60ml), and slot 3 (100ml) simultaneously
- Database architecture: Uses bottleSlotAssignments table for flexible multi-slot assignments per product
- UI fallback system: Handles authentication issues with graceful fallback to product data
- Real-time updates: Slot assignments and removals immediately visible in admin dashboard
- Conflict prevention: Only clears specific slot assignments, preserves other slots for same product
- Enhanced bottle slot queries: Returns full product and assignment data for accurate display
- Spray slots unchanged: Maintains one-product-per-slot behavior (working correctly)

### January 29, 2025 - Fixed Database Constraints for Slot Assignment System
- CRITICAL DATABASE FIX: Added missing unique constraints for slot assignment tables
- PostgreSQL constraints: Created unique indexes for spray_slot_assignments (slot_number, product_id)
- PostgreSQL constraints: Created unique indexes for bottle_slot_assignments (slot_number, product_id, bottle_size)
- Resolved "ON CONFLICT" database errors that prevented slot assignments from working
- Fixed "there is no unique or exclusion constraint matching" PostgreSQL error
- Slot assignment operations now properly use UPSERT functionality without database conflicts

### January 29, 2025 - Quick Product Preview Modal & Enhanced Admin Interface
- CREATED: Touch-friendly product preview modal with comprehensive product details
- Professional modal design: animated entrance/exit, gradient backgrounds, luxury styling
- Product overview: high-quality image display, pricing grid, availability status
- Stock visualization: real-time stock levels with color-coded status indicators
- Interactive features: preview button on each product card, edit product integration
- Enhanced admin workflow: quick preview before editing, comprehensive product information
- Touch-optimized: large buttons, smooth animations, mobile-friendly responsive design
- Professional styling: white input area, blue cursor, clean typography, subtle borders
- Added bottle stock limits: maximum 20 units for all bottle sizes (30ml, 60ml, 100ml)
- Spray stock remains unlimited with clear "(unlimited)" indicator in admin dashboard
- Enhanced stock management: visual limit warnings, disabled buttons at max capacity
- Clear stock display format: "current/max" (e.g., "15/20") with red text when at limit
- Full keyboard support: all admin inputs now work with virtual keyboard and numpad
- McDonald's kiosk styling maintained: large touch buttons, rounded corners, scale animations

### January 28, 2025 - McDonald's Kiosk-Style Interface & Fixed Virtual Keyboard Issues
- MAJOR UI/UX REDESIGN: Implemented McDonald's kiosk-style numpad and virtual keyboard interfaces
- Fixed critical virtual keyboard callback function errors that prevented admin login functionality
- Enhanced touch-friendly interface with larger buttons (height: 80px), better spacing, and rounded corners
- Added visual feedback with active:scale-95 transforms and color transitions
- Implemented gradient backgrounds and enhanced shadow effects for premium look
- Virtual keyboard features: larger keys, QWERTY layout, clear labeling (SHIFT, DELETE, SPACE)
- Numpad features: 3x4 grid layout, large numeric buttons, clear/delete functionality
- Color scheme: white buttons with blue hover states, red action buttons, gold accents
- Enhanced accessibility with high contrast and clear visual hierarchy
- Fixed VirtualInputLogin component to properly handle onKey events instead of deprecated onKeyPress
- All admin dashboard functionality now working with touch-optimized input components

### January 28, 2025 - Flexible Slot Management System Implementation
- MAJOR ARCHITECTURE REDESIGN: Implemented flexible slot assignment system allowing multiple products per slot
- Customer view now displays ALL available products with smart availability logic
- Products marked as "out of stock" if no slot assigned OR if actual inventory is zero
- Enhanced out-of-stock overlay shows specific reason (no inventory vs no slot assigned)
- Created new database schema with `spraySlotAssignments` and `bottleSlotAssignments` tables
- Added comprehensive API endpoints for flexible slot management operations
- Inventory-based dispensing logic: products dispense based on actual stock levels, not slot-specific stock
- Slot assignments act as availability indicators rather than inventory containers
- Priority-based slot assignment system for multiple products in same slot
- Backward compatibility maintained with existing bottle slot management system
- Complete separation of concerns: slots determine availability, inventory determines dispensing capability

### January 27, 2025 - Database Persistence & Admin Panel Real-time Updates
- CRITICAL FIX: Switched from in-memory storage (MemStorage) to PostgreSQL database storage (DatabaseStorage)
- All admin panel data now persists properly between transactions and server restarts
- Fixed bottle stock inventory updates not reflecting in admin panel after purchases
- Enhanced cache invalidation system to refresh admin panel data after spray and bottle transactions
- Added automatic 5-second refresh intervals in admin panel for real-time inventory tracking
- Slot-based product filtering ensures customers only see fragrances assigned to physical slots
- Payment verification now correctly decrements stock for both spray samples and bottle purchases
- Admin login credentials: username 'admin', password 'admin' or blank (test mode)
- Complete integration between customer transactions and admin inventory management

### January 24, 2025 - Real-time Inventory Heatmap & Size-Based Pricing System
- Implemented comprehensive real-time inventory heatmap showing most popular fragrance slots
- Added slotUsageStats database table to track usage patterns and popularity scores
- Created HeatmapDisplay component with live visualization of slot popularity
- Visual heat levels: cold (blue), warm (yellow), hot (orange), very hot (red)
- Real-time analytics showing most popular fragrances, total usage, and active slots
- Heat intensity visualization with glowing effects based on popularity scores
- Automatic data refresh every 30 seconds with manual refresh capability
- Time-since-last-use indicators for all slots (spray and bottle)
- Trending slots analysis with usage count tracking
- Color-coded slot popularity with percentage scoring
- Enhanced slot management system with individual fragrance and size selection
- Bottle slots now support any fragrance with specific size assignment (30ml, 60ml, 100ml)
- Individual stock management for each of the 15 bottle slots
- Backend API endpoints for usage tracking, heatmap data, and analytics
- Added separate pricing for different bottle sizes (30ml, 60ml, 100ml) in product management
- Enhanced product creation and editing forms with size-specific pricing controls
- Updated database schema to support individual pricing for each bottle size
- Product cards now display all pricing tiers for spray and bottle options

### January 24, 2025 - Raspberry Pi Deployment Success & Node.js 20 Upgrade
- Successfully resolved deployment issues by upgrading to Node.js 20.19.3
- Fixed import.meta.dirname compatibility issues that caused application crashes
- Confirmed working deployment with Razorpay payment integration
- Application now running stably at http://localhost:5000 with full functionality
- Created comprehensive fresh install guide for new Raspberry Pi setups
- Database migrations and API endpoints responding correctly
- Touch-optimized vending machine interface fully operational

### December 25, 2024 - Razorpay Integration & Docker Deployment
- Configured Razorpay as exclusive payment processor with test credentials
- Enhanced payment UI with detailed supported payment methods
- Added Razorpay integration to bottle purchase flow
- Created complete Docker-based deployment solution for Raspberry Pi
- Added production environment configuration files
- Implemented touch screen kiosk mode setup
- Added comprehensive deployment documentation

### Key Files Added/Modified
- Docker configuration: Dockerfile (fixed), docker-compose.yml
- Deployment documentation: FRESH_RASPBERRY_PI_SETUP.md
- Deployment scripts: deploy.sh, cleanup-and-deploy.sh
- Environment configuration: .env with Razorpay credentials
- Payment integration: Enhanced payment-modal.tsx and thank-you-screen.tsx

## Changelog

- December 25, 2024: Razorpay payment integration and Raspberry Pi deployment setup
- June 24, 2025: Initial setup