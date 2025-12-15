# Cloud Clips - Remaining Work (LEFT.md)

This document outlines all remaining work needed to complete and deploy the Cloud Clips application.

---

## Project Status Summary

| Area | Status |
|------|--------|
| Mobile App (Frontend) | 95% Complete |
| Backend API (Go) | 100% Complete |
| Database & Migrations | 100% Complete |
| Frontend-Backend Integration | 90% Complete |
| Testing | 100% Complete |
| Production Deployment | **NOT STARTED** |

---

## Phase 33: Production Deployment (NOT STARTED)

**Priority: HIGH**
**Duration: 1-2 weeks**

### 33.1 Backend Deployment

- [ ] **Dockerize the Go application**
  - Create Dockerfile for the Go backend
  - Create docker-compose.yml for local testing
  - Optimize image size with multi-stage builds

- [ ] **Set up CI/CD pipeline (GitHub Actions)**
  - Automated testing on PR
  - Build and push Docker images
  - Deploy to staging/production

- [ ] **Deploy to cloud provider (AWS/GCP/DigitalOcean/Railway)**
  - Provision compute resources (ECS, App Platform, etc.)
  - Configure environment variables
  - Set up auto-scaling rules

- [ ] **Set up PostgreSQL managed instance**
  - Provision managed PostgreSQL (RDS, Cloud SQL, etc.)
  - Run database migrations
  - Configure backups and point-in-time recovery
  - Set up connection pooling

- [ ] **Set up Redis for caching** (optional but recommended)
  - Session caching
  - Rate limiting data
  - Real-time features support

- [ ] **Configure SSL certificates**
  - Obtain SSL certificates (Let's Encrypt or ACM)
  - Configure HTTPS on load balancer

- [ ] **Set up domain and DNS**
  - Register domain (e.g., cloudclips.app)
  - Configure DNS records (A, CNAME)
  - Set up Cloudflare for CDN/DDoS protection

- [ ] **Set up monitoring (Prometheus/Grafana)**
  - Application metrics
  - Database metrics
  - Container/server metrics

- [ ] **Set up logging (Loki/ELK/CloudWatch)**
  - Centralized log aggregation
  - Log retention policies
  - Search and alerting

- [ ] **Set up alerting**
  - Error rate thresholds
  - Latency alerts
  - Resource utilization alerts

### 33.2 Mobile App Release

- [ ] **Replace all placeholder assets**
  - App icon (iOS & Android)
  - Splash screen
  - Adaptive icons (Android)
  - App Store/Play Store feature graphics

- [ ] **Update app version and build numbers**
  - Set version in app.json
  - Configure EAS build profiles

- [ ] **Generate production builds**
  - `eas build --platform ios --profile production`
  - `eas build --platform android --profile production`

- [ ] **Submit to Google Play Console**
  - Create app listing
  - Upload AAB file
  - Complete store listing content
  - Submit for review

- [ ] **Submit to Apple App Store**
  - Create app in App Store Connect
  - Upload IPA file
  - Complete store listing
  - Submit for review

- [ ] **Prepare store listings**
  - App title and subtitle
  - Short and long descriptions
  - Keywords/tags
  - Category selection
  - Privacy policy URL
  - Support URL

- [ ] **Create screenshots and preview videos**
  - iPhone screenshots (6.5", 5.5")
  - iPad screenshots (if applicable)
  - Android phone screenshots
  - Optional: App preview videos

- [ ] **Set up crash reporting (Sentry)**
  - Create Sentry project
  - Configure DSN in app
  - Set up source maps for React Native

- [ ] **Set up analytics (Mixpanel/Firebase Analytics)**
  - Event tracking
  - User properties
  - Conversion funnels

### 33.3 Third-Party Service Configuration

#### Stripe (Production)
- [ ] Complete Stripe business verification
- [ ] Switch from test keys to live keys
- [ ] Update webhook endpoints to production URL
- [ ] Test a real payment ($1.00)
- [ ] Configure payout schedule

#### Firebase (Production)
- [ ] Create production Firebase project
- [ ] Enable App Check for security
- [ ] Configure Firestore security rules
- [ ] Configure Storage security rules
- [ ] Upload APNs key for iOS push notifications
- [ ] Test push notifications on real devices

#### Google Cloud Platform
- [ ] Enable Maps SDK for iOS
- [ ] Enable Maps SDK for Android
- [ ] Enable Places API
- [ ] Enable Geocoding API
- [ ] Configure API key restrictions

---

## Code Cleanup & Technical Debt

### Mock Services to Remove/Disable for Production

The following mock services are used for development. For production, ensure `EXPO_PUBLIC_DEV_MODE=false`:

| Service | File | Status |
|---------|------|--------|
| Auth | `mockAuthService.ts` | Mock fallback in place |
| Barbers | `mockBarberService.ts` | Mock fallback in place |
| Bookings | `mockBookingService.ts` | Mock fallback in place |
| Products | `productService.ts` | Has inline mock data |
| Chat | `mockChatService.ts` | Mock fallback in place |
| Earnings | `mockEarningsService.ts` | **Uses mock in __DEV__** |
| Hairstyles | `hairstyleService.ts` | Mock data (AI feature) |

### Files to Review Before Production

- [ ] `mobile/src/features/earnings/hooks/useEarnings.ts` - Currently uses mock service in `__DEV__` mode
- [ ] Remove console.log statements or wrap in `__DEV__` checks
- [ ] Review all placeholder images (via.placeholder.com, pravatar.cc)
- [ ] Ensure no test/mock API keys are hardcoded

---

## Environment Configuration Checklist

### Mobile App (.env)

```env
# Set to false for production
EXPO_PUBLIC_DEV_MODE=false

# Production API URL
EXPO_PUBLIC_API_BASE_URL=https://api.cloudclips.com/api

# Stripe (Live keys)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Firebase (Production project)
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cloudclips-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cloudclips-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cloudclips-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Google OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Sentry (Error Tracking)
EXPO_PUBLIC_SENTRY_DSN=xxx
```

### Backend (.env)

```env
PORT=8080
ENVIRONMENT=production

# Database
DATABASE_URL=postgres://user:pass@host:5432/cloudclips?sslmode=require

# Redis (optional)
REDIS_URL=redis://user:pass@host:6379

# JWT
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Stripe (Live keys)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_CONNECT_CLIENT_ID=ca_xxx

# Firebase
FIREBASE_PROJECT_ID=cloudclips-prod
FIREBASE_CREDENTIALS_FILE=./firebase-admin-sdk.json

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=cloudclips-uploads

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=xxx
FROM_EMAIL=noreply@cloudclips.com

# Sentry
SENTRY_DSN=xxx
```

---

## Required Accounts & Subscriptions

### Must Have Before Launch

| Service | URL | Estimated Cost |
|---------|-----|----------------|
| Apple Developer | https://developer.apple.com | $99/year |
| Google Play Console | https://play.google.com/console | $25 one-time |
| Stripe | https://stripe.com | 2.9% + $0.30/tx |
| Firebase | https://firebase.google.com | Free-PAYG |
| Cloud Hosting | AWS/GCP/DO/Railway | $50-200/mo |
| Domain | Namecheap/Cloudflare | ~$12/year |
| Email (SendGrid/Resend) | https://sendgrid.com | Free-$20/mo |
| Sentry | https://sentry.io | Free-$26/mo |

### Estimated Monthly Cost

| Tier | Cost |
|------|------|
| Minimum (MVP) | ~$35-60/month |
| Production | ~$200-400/month |

---

## Pre-Launch Checklist

### Backend
- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Remove debug logging
- [ ] Test all API endpoints with production DB

### Mobile App
- [ ] Set `EXPO_PUBLIC_DEV_MODE=false`
- [ ] Update all environment variables
- [ ] Test deep links
- [ ] Test offline mode
- [ ] Verify analytics tracking
- [ ] Test on physical devices (iOS + Android)

### Security
- [ ] Audit API authentication
- [ ] Review Firebase security rules
- [ ] Check for exposed secrets
- [ ] Validate input sanitization
- [ ] Test CSRF/XSS protections

---

## Summary

**What's Complete:**
- All 14 phases (19-32) of development
- Go backend with all handlers (auth, barber, appointment, product, order, coupon, chat, notification, payment, loyalty, admin)
- PostgreSQL database with migrations
- Mobile app with all screens and features
- 489 total tests (187 backend + 127 frontend unit + 175 manual test cases)
- 10 E2E test suites with Maestro
- Payment integration (Stripe)
- Real-time features (WebSocket, Firebase)
- i18n (English, Spanish, French)
- Advanced features (AI hairstyles, AR try-on, loyalty program, referrals)

**What's Left:**
- **Phase 33: Production Deployment** - The final step to go live
  - Backend deployment to cloud
  - Mobile app submission to stores
  - Third-party service configuration (Stripe, Firebase, etc.)
  - Monitoring and alerting setup

**Estimated Time to Launch: 1-2 weeks** (assuming accounts are ready)
