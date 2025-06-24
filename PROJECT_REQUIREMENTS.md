# Scentra Perfume Vending Machine - Project Requirements

## System Requirements

### Runtime Environment
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **TypeScript**: 5.x

### Database
- **PostgreSQL**: >= 13.0

## Environment Variables

Create a `.env` file in the root directory with:

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Database Connection
DATABASE_URL=postgresql://username:password@host:port/database
```

## Key Dependencies

### Frontend
- React 18.x with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Framer Motion for animations
- Radix UI components
- TanStack Query for data fetching
- React Hook Form for form handling
- Wouter for routing

### Backend
- Express.js server
- Drizzle ORM with PostgreSQL
- Razorpay payment integration
- Stripe payment support
- Session management

### Development Tools
- TypeScript compilation
- Hot module replacement
- ESLint and Prettier
- PostCSS processing

## Installation Steps

1. **Install Node.js 18+**
2. **Clone and setup project**:
   ```bash
   npm install
   ```
3. **Setup PostgreSQL database**
4. **Configure environment variables** in `.env` file
5. **Run database migrations**:
   ```bash
   npm run db:push
   ```
6. **Start development server**:
   ```bash
   npm run dev
   ```

## Production Deployment

### Build Process
```bash
npm run build
npm start
```

### Recommended Production Setup
- **Process Manager**: PM2
- **Reverse Proxy**: Nginx
- **Database**: PostgreSQL with connection pooling
- **Session Storage**: Redis (optional)
- **SSL**: Let's Encrypt or similar

## Payment Integration

### Razorpay Setup
1. Create Razorpay account
2. Get API keys from dashboard
3. Configure test/production keys in environment
4. Test payment flow with test cards

### Supported Payment Methods
- UPI payments
- Credit/Debit cards
- Net banking
- Digital wallets
- EMI options

## Architecture

### Frontend (React/Vite)
- Touch-optimized vending machine interface
- Responsive design for various screen sizes
- Real-time payment processing
- Admin panel for inventory management

### Backend (Express/PostgreSQL)
- RESTful API endpoints
- Secure payment processing
- Inventory management system
- Order tracking and history
- Admin authentication

### Database Schema
- Products table with inventory tracking
- Orders table with payment status
- Admin sessions for authentication
- Stock management for sprays and bottles

## Performance Considerations

- Optimized bundle size with Vite
- Image optimization and lazy loading
- Database query optimization
- Caching strategies for product data
- Real-time inventory updates

## Security Features

- Secure payment processing with Razorpay
- Environment variable protection
- Input validation with Zod
- SQL injection prevention
- Admin authentication tokens
- HTTPS enforcement (production)