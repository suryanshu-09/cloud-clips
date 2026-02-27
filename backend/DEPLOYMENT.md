# Cloud Clips - Convex Deployment Guide

This guide covers deploying and configuring the Convex backend for Cloud Clips.

## Prerequisites

- Node.js 18+ installed
- Convex account (sign up at [convex.dev](https://convex.dev))
- Resend account for email magic links
- Stripe account for payments (optional)
- Google Cloud Console account (optional, for OAuth)
- Apple Developer account (optional, for Sign In with Apple)

---

## Initial Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Initialize Convex Project

```bash
npx convex dev
```

This will:
- Authenticate with Convex
- Create a new project (or link existing)
- Generate the deployment URL
- Start the local dev server

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your actual values (see Environment Variables section below).

---

## Environment Variables

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `CONVEX_DEPLOYMENT` | Your deployment name | Convex Dashboard > Settings |
| `RESEND_API_KEY` | Email service API key | [resend.com/api-keys](https://resend.com/api-keys) |
| `AUTH_EMAIL_FROM` | Verified sender email | Resend Dashboard > Domains |

### OAuth Variables (Optional)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | Google Cloud Console |
| `AUTH_APPLE_ID` | Apple Services ID | [Apple Developer](https://developer.apple.com/account/resources/) |
| `AUTH_APPLE_SECRET` | Apple Private Key | Apple Developer > Keys |
| `AUTH_APPLE_TEAM_ID` | Apple Team ID (10 chars) | Apple Developer > Membership |
| `AUTH_APPLE_KEY_ID` | Apple Key ID | Apple Developer > Keys |

### Stripe Variables (Optional)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Stripe Dashboard > Webhooks |
| `STRIPE_PLATFORM_ACCOUNT_ID` | Your Stripe account ID | Stripe Dashboard > Settings |
| `STRIPE_APPLICATION_FEE_PERCENT` | Platform fee % | Set to your commission rate |

---

## OAuth Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select existing
3. Enable "Google+ API" or "Google Identity Toolkit API"
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure authorized redirect URIs:
   - `https://<your-deployment>.convex.site/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### Apple Sign In Setup

1. Go to [Apple Developer](https://developer.apple.com/account/resources/)
2. Certificates, Identifiers & Profiles > Identifiers
3. Create a Services ID with Sign In with Apple enabled
4. Create a private key for Sign In with Apple
5. Note the Key ID and download the .p8 file
6. Convert private key to single-line format:
   ```bash
   awk 'NF {sub(/\r/, ""); printf "%s\\n",$0}' AuthKey_XXX.p8
   ```
7. Add to `.env` as `AUTH_APPLE_SECRET`

---

## Database Schema

The schema is defined in `convex/schema.ts` and includes:

- **users** - Core user accounts with roles
- **barberProfiles** - Extended barber business profiles
- **appointments** - Booking records
- **reviews** - Ratings and reviews
- **conversations** - Chat conversation metadata
- **messages** - Chat messages
- **products** - Marketplace products
- **orders** - Product purchase orders
- **coupons** - Promotion codes
- **notifications** - User notifications

### Deploy Schema

```bash
npx convex dev
# Schema is automatically pushed during development
```

---

## Authentication Configuration

Auth is configured in `convex/auth.ts` with three providers:

1. **Magic Links** - Email-based authentication via Resend
2. **Google OAuth** - Social login
3. **Apple Sign In** - iOS social login

### Magic Links Setup

1. Sign up at [resend.com](https://resend.com)
2. Verify your domain
3. Create an API key
4. Add to `.env`:
   ```
   RESEND_API_KEY=re_your_key_here
   AUTH_EMAIL_FROM=noreply@yourdomain.com
   ```

---

## Deployment Commands

### Development

```bash
# Start local dev server with hot reload
npx convex dev
```

### Production Deployment

```bash
# Deploy to production
npx convex deploy

# Deploy with specific deploy key (CI/CD)
CONVEX_DEPLOY_KEY=your_key npx convex deploy
```

### Environment Management

```bash
# Set environment variable
npx convex env set VARIABLE_NAME value

# Get environment variable
npx convex env get VARIABLE_NAME

# List all environment variables
npx convex env list

# Remove environment variable
npx convex env unset VARIABLE_NAME
```

---

## File Storage

Convex provides file storage for images and attachments.

### Storage Buckets

Configured in `convex/storage.ts`:

- **avatars** - User profile pictures
- **portfolio** - Barber portfolio images
- **products** - Product images
- **reviews** - Review photos
- **messages** - Message attachments

### Storage Limits

- Default: 1GB per deployment
- Contact Convex for increased limits

---

## Stripe Integration

### Webhook Setup

1. In Stripe Dashboard, create a webhook endpoint:
   - URL: `https://<your-deployment>.convex.site/api/stripe/webhook`
   - Events to listen for:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `account.updated` (for Connect)

2. Copy the webhook signing secret to `.env`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   ```

### Connect Onboarding

Barbers must complete Stripe Connect onboarding to receive payments:

1. Barber signs up and creates profile
2. System generates Connect onboarding link
3. Barber completes Stripe verification
4. Barber can now receive payments

---

## Monitoring & Logs

### Convex Dashboard

Access at: `https://dashboard.convex.dev`

Features:
- Real-time query logs
- Function execution metrics
- Database usage stats
- File storage usage

### Log Levels

Set in `.env`:
```
LOG_LEVEL=debug  # debug, info, warn, error
```

---

## Backup & Recovery

### Automatic Backups

Convex automatically backs up your data. Contact support for recovery.

### Manual Export

```bash
# Export data (contact Convex for export capabilities)
npx convex data export
```

---

## Security Considerations

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use strong secrets** - Generate random strings for secrets
3. **Rotate API keys** - Regularly rotate Resend and Stripe keys
4. **Enable CORS** - Configure allowed origins in Convex dashboard
5. **Rate limiting** - Built into Convex, configurable per function

---

## Troubleshooting

### Common Issues

**Deployment fails**
```bash
# Check convex status
npx convex status

# Re-authenticate
npx convex login
```

**Environment variables not working**
```bash
# Verify variables are set
npx convex env list

# Redeploy after setting variables
npx convex deploy
```

**Auth not working**
- Check OAuth redirect URIs match exactly
- Verify Resend domain is verified
- Check Convex logs for error details

**Stripe webhooks failing**
- Verify webhook URL is accessible
- Check webhook secret is correct
- Ensure all required events are selected

---

## Mobile App Configuration

The mobile app needs the following in `mobile/.env`:

```bash
EXPO_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
```

---

## Support & Resources

- **Convex Docs**: https://docs.convex.dev
- **Convex Dashboard**: https://dashboard.convex.dev
- **Convex Auth**: https://auth.convex.dev
- **Stripe Docs**: https://stripe.com/docs
- **Resend Docs**: https://resend.com/docs

---

## Quick Reference

```bash
# Start development
npx convex dev

# Deploy to production
npx convex deploy

# View logs
npx convex logs

# Run Convex shell
npx convex shell

# Generate new function
npx convex codegen
```
