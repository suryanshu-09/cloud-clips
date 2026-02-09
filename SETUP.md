# Development Environment Setup Guide

This guide walks you through setting up your local development environment for Cloud Clips.

## Prerequisites

- **Node.js** 18+ and npm
- **Bun** (for mobile app): Install from https://bun.sh
- **Git**
- **Expo Go** app on your mobile device (for testing)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd cloud-clips
npm run install:all
```

This will:
- Install root dependencies
- Install mobile app dependencies (using Bun)
- Install backend dependencies
- Copy `.env.example` files to `.env` (if they don't exist)

### 2. Configure Environment Variables

#### Mobile App (`mobile/.env`)

```bash
cd mobile
cp .env.example .env
```

Edit `.env` and set at minimum:
- `EXPO_PUBLIC_CONVEX_URL` - Your Convex deployment URL
- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe test key (optional for basic dev)

#### Backend (`backend/.env`)

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set:
- `CONVEX_DEPLOYMENT` - Your Convex deployment name
- `RESEND_API_KEY` - For email magic links (optional, dev mode skips emails)
- `STRIPE_SECRET_KEY` - For payments (optional, dev mode mocks payments)

### 3. Set Up Convex

1. Create a Convex account at https://convex.dev
2. Create a new project
3. Run the dev server:

```bash
cd backend
npx convex dev
```

This will:
- Authenticate with Convex
- Deploy the schema and functions
- Show your deployment URL

Copy the deployment URL to your `mobile/.env` file as `EXPO_PUBLIC_CONVEX_URL`.

### 4. Start Development

#### Option A: Run Both (Recommended)

From the root directory:

```bash
npm run dev:all
```

This starts both the Convex backend and Expo dev server.

#### Option B: Run Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Mobile):
```bash
cd mobile
bun dev
```

## Environment Variables Reference

### Mobile App (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_CONVEX_URL` | Yes | Your Convex deployment URL |
| `EXPO_PUBLIC_DEV_MODE` | No | Enable dev helpers (default: true) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | No | Google Sign-In (Web) |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | No | Google Sign-In (iOS) |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Error tracking |
| `EXPO_PUBLIC_EAS_PROJECT_ID` | No | Expo Application Services |

### Backend (.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name |
| `RESEND_API_KEY` | No | Email service API key |
| `AUTH_GOOGLE_ID` | No | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | No | Google OAuth client secret |
| `STRIPE_SECRET_KEY` | No | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret |

## Available Scripts

### Root Level

| Script | Description |
|--------|-------------|
| `npm run dev` | Start mobile dev server |
| `npm run dev:backend` | Start Convex dev server |
| `npm run dev:all` | Start both concurrently |
| `npm run setup` | Install deps and setup env files |
| `npm run setup:env` | Copy .env.example to .env |
| `npm run clean` | Remove all node_modules and build artifacts |
| `npm run lint` | Run ESLint on mobile app |
| `npm run format` | Run Prettier on mobile app |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run tests |
| `npm run convex:deploy` | Deploy to Convex production |

### Mobile App

| Script | Description |
|--------|-------------|
| `bun dev` | Start Expo dev server |
| `bun android` | Run on Android |
| `bun ios` | Run on iOS |
| `bun lint` | Run ESLint |
| `bun format` | Format with Prettier |
| `bun type-check` | TypeScript checking |
| `bun test` | Run Jest tests |

### Backend

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Convex dev server |
| `npm run deploy` | Deploy to production |
| `npm run typecheck` | TypeScript checking |
| `npm run convex:logs` | View Convex logs |

## Testing on Device

1. Install **Expo Go** from App Store / Play Store
2. Start the dev server: `bun dev`
3. Scan the QR code with your phone camera (iOS) or Expo Go (Android)
4. The app will hot reload as you make changes

## Troubleshooting

### "EXPO_PUBLIC_CONVEX_URL is not set"

Run `cp mobile/.env.example mobile/.env` and fill in your Convex URL.

### Convex authentication errors

Run `npx convex dev` in the backend directory to re-authenticate.

### Port already in use

Convex dev server uses port 3210 by default. Expo uses port 8081.

### Clean everything and restart

```bash
npm run clean
npm run install:all
npm run dev:all
```

## Next Steps

- See [README.md](./README.md) for project overview
- See [TODO.md](./TODO.md) for current development tasks
- Read the [AGENTS.md](./AGENTS.md) for development guidelines
