# Cloud Clips Convex Backend

This directory contains the Convex backend configuration for Cloud Clips.

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Initialize Convex:
```bash
npx convex dev
```

## Project Structure

```
convex/
├── schema.ts           # Database schema
├── auth.ts            # Convex Auth configuration
├── index.ts           # Exports all functions
├── users/             # User queries and mutations
├── barbers/           # Barber queries and mutations
├── appointments/      # Appointment queries and mutations
├── reviews/           # Review queries and mutations
├── messages/          # Chat queries and mutations
├── payments/          # Stripe payment actions
└── products/          # Product queries and mutations
```

## Schema

The database includes the following tables:
- `users` - User accounts with roles (client/barber/admin)
- `barberProfiles` - Extended profile for barbers
- `appointments` - Booking records
- `reviews` - Barber ratings and reviews
- `messages` - Chat messages
- `conversations` - Chat conversation metadata
- `products` - Marketplace products
- `orders` - Product purchase orders
- `coupons` - Promotion codes
- `notifications` - User notifications

## Authentication

Supported authentication methods:
- Magic Links (via Resend email)
- Google OAuth
- Apple Sign In

## Environment Variables

Required environment variables:
- `CONVEX_DEPLOYMENT` - Convex deployment URL
- `CONVEX_DEPLOY_KEY` - Convex deploy key
- `RESEND_API_KEY` - Resend API key for email auth
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` - Google OAuth credentials
- `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET` - Apple Sign In credentials
- `STRIPE_SECRET_KEY` / `STRIPE_PUBLISHABLE_KEY` - Stripe API keys
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `APP_URL` - Application URL

## Development

Start the Convex dev server:
```bash
npm run dev
```

Deploy to production:
```bash
npm run deploy
```
