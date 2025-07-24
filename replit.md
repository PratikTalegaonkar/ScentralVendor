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