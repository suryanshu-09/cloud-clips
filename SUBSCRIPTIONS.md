# Complete Deployment Guide: Accounts & Subscriptions Required

## Overview

Cloud Clips is a barber appointment booking app with a **React Native/Expo mobile frontend** and a **Go backend** using PostgreSQL. Below is every account and subscription you'll need to fully deploy this application.

---

## 1. MOBILE DEVELOPMENT & DISTRIBUTION

### Expo Account (Required)
| Item | Details |
|------|---------|
| **URL** | https://expo.dev |
| **Cost** | Free tier available / $99/mo Production |
| **Purpose** | Build service (EAS Build), OTA updates, app signing |
| **What you need** | EAS Project ID, Expo account credentials |

### Apple Developer Program (Required for iOS)
| Item | Details |
|------|---------|
| **URL** | https://developer.apple.com/programs/ |
| **Cost** | **$99/year** |
| **Purpose** | iOS app distribution, App Store, push notifications (APNS), Apple Sign-In |
| **What you need** | Apple ID, Team ID, App Store Connect access, certificates, provisioning profiles |

### Google Play Console (Required for Android)
| Item | Details |
|------|---------|
| **URL** | https://play.google.com/console |
| **Cost** | **$25 one-time fee** |
| **Purpose** | Android app distribution, Play Store listing |
| **What you need** | Google account, Service Account JSON key for automated uploads |

---

## 2. AUTHENTICATION & FIREBASE

### Firebase (Required)
| Item | Details |
|------|---------|
| **URL** | https://console.firebase.google.com |
| **Cost** | Free tier (Spark) / Pay-as-you-go (Blaze) |
| **Purpose** | Authentication, Push Notifications (FCM), Analytics, Storage (optional) |
| **Services Used** | Auth, Cloud Messaging, Analytics, Realtime Database |
| **What you need** | `google-services.json` (Android), `GoogleService-Info.plist` (iOS), Firebase credentials file for backend |

### Google Cloud Platform (Required)
| Item | Details |
|------|---------|
| **URL** | https://console.cloud.google.com |
| **Cost** | Pay-as-you-go (Maps ~$2-7 per 1000 requests) |
| **Purpose** | Google Maps API, Google Sign-In OAuth, Places API |
| **APIs to Enable** | Maps SDK for iOS, Maps SDK for Android, Places API, Geocoding API |
| **What you need** | API Key (restricted), OAuth 2.0 Web Client ID |

---

## 3. PAYMENTS

### Stripe (Recommended)
| Item | Details |
|------|---------|
| **URL** | https://dashboard.stripe.com |
| **Cost** | **2.9% + $0.30 per transaction** |
| **Purpose** | Payment processing, Apple Pay, Google Pay |
| **What you need** | Publishable Key (frontend), Secret Key (backend), Webhook Secret |

### Alternative: Polar.sh
| Item | Details |
|------|---------|
| **URL** | https://polar.sh |
| **Cost** | **4% + $0.40 per transaction** (no monthly fees) |
| **Purpose** | Payment processing, subscriptions, merchant of record |
| **Pros** | Handles taxes/VAT globally, simpler setup, built-in checkout, no Stripe account needed |
| **Cons** | Higher transaction fees, newer platform, less mobile SDK maturity |
| **What you need** | Polar account, API keys, Webhook Secret |
| **Note** | Polar acts as Merchant of Record, handling all tax compliance for you |

### Apple Pay Merchant Account (Required for iOS payments)
| Item | Details |
|------|---------|
| **URL** | https://developer.apple.com/apple-pay/ |
| **Cost** | Included with Apple Developer Program |
| **Purpose** | Apple Pay integration |
| **What you need** | Merchant ID (`merchant.com.cloudclips`), certificates |

---

## 4. BACKEND HOSTING & DATABASE

### Option A: Cloud Hosting (Go Backend)

#### AWS (Recommended for Go backend)
| Item | Details |
|------|---------|
| **URL** | https://aws.amazon.com |
| **Cost** | ~$50-225/month (see breakdown below) |
| **Services** | EKS/ECS (containers), RDS (PostgreSQL), S3 (storage), CloudFront (CDN) |

**AWS Cost Breakdown:**
- EC2/ECS: ~$30-75/mo
- RDS PostgreSQL: ~$30-50/mo
- S3 + CloudFront: ~$10-20/mo
- Load Balancer: ~$20/mo
- Total: **~$100-165/month** (small scale)

#### Alternative: DigitalOcean
| Item | Details |
|------|---------|
| **URL** | https://www.digitalocean.com |
| **Cost** | ~$50-100/month |
| **Services** | App Platform, Managed PostgreSQL, Spaces (S3-compatible) |

#### Alternative: Railway
| Item | Details |
|------|---------|
| **URL** | https://railway.app |
| **Cost** | $5/mo + usage |
| **Services** | Go app hosting, PostgreSQL, Redis |

#### Alternative: Render
| Item | Details |
|------|---------|
| **URL** | https://render.com |
| **Cost** | $7-25/mo per service |
| **Services** | Web services, PostgreSQL, Redis |

### Option B: Supabase (Alternative to Go backend)
| Item | Details |
|------|---------|
| **URL** | https://supabase.com |
| **Cost** | Free tier / **$25/mo** Pro |
| **Purpose** | All-in-one: Database, Auth, Storage, Realtime, Edge Functions |

---

## 5. FILE STORAGE

### AWS S3 (Recommended)
| Item | Details |
|------|---------|
| **URL** | https://aws.amazon.com/s3 |
| **Cost** | ~$0.023/GB/month + transfer |
| **Purpose** | User uploads, barber portfolio images, product images |

### Alternative: Cloudflare R2
| Item | Details |
|------|---------|
| **URL** | https://www.cloudflare.com/products/r2 |
| **Cost** | $0.015/GB/month, **no egress fees** |
| **Purpose** | S3-compatible storage (cheaper) |

---

## 6. EMAIL SERVICE

### SMTP Provider (Required)
Choose one:

#### SendGrid
| Item | Details |
|------|---------|
| **URL** | https://sendgrid.com |
| **Cost** | Free (100/day) / $19.95/mo |
| **Purpose** | Transactional emails (verification, password reset) |

#### Mailgun
| Item | Details |
|------|---------|
| **URL** | https://www.mailgun.com |
| **Cost** | $35/mo (50k emails) |

#### Amazon SES
| Item | Details |
|------|---------|
| **URL** | https://aws.amazon.com/ses |
| **Cost** | $0.10 per 1000 emails |

#### Resend
| Item | Details |
|------|---------|
| **URL** | https://resend.com |
| **Cost** | Free (100/day) / $20/mo |

---

## 7. ERROR TRACKING & MONITORING

### Sentry (Recommended)
| Item | Details |
|------|---------|
| **URL** | https://sentry.io |
| **Cost** | Free tier / $26/mo Team |
| **Purpose** | Error tracking, crash reporting |
| **What you need** | Sentry DSN |

### Alternative: LogRocket
| Item | Details |
|------|---------|
| **URL** | https://logrocket.com |
| **Cost** | Free tier / $99/mo |

---

## 8. DOMAIN & DNS

### Domain Registrar
| Item | Details |
|------|---------|
| **URLs** | https://namecheap.com, https://cloudflare.com, https://domains.google |
| **Cost** | ~$10-15/year |
| **Purpose** | `cloudclips.app` domain |

### DNS & CDN
| Item | Details |
|------|---------|
| **URL** | https://cloudflare.com |
| **Cost** | Free tier available |
| **Purpose** | DNS management, CDN, DDoS protection |

---

## 9. GOOGLE ACCOUNT (Core Requirement)

### Gmail/Google Account
| Item | Details |
|------|---------|
| **URL** | https://accounts.google.com |
| **Cost** | Free |
| **Purpose** | Required for: Firebase, Google Cloud, Play Console, Google Sign-In |

---

## COMPLETE CHECKLIST

### Essential Accounts (Must Have)
| # | Service | URL | Cost |
|---|---------|-----|------|
| 1 | Google Account | https://accounts.google.com | Free |
| 2 | Expo | https://expo.dev | Free-$99/mo |
| 3 | Apple Developer | https://developer.apple.com/programs | $99/year |
| 4 | Google Play Console | https://play.google.com/console | $25 once |
| 5 | Firebase | https://console.firebase.google.com | Free-PAYG |
| 6 | Google Cloud Platform | https://console.cloud.google.com | PAYG |
| 7 | Domain Registrar | https://namecheap.com | ~$12/year |

### Payment Processing (Choose One)
| Option | URL | Cost | Notes |
|--------|-----|------|-------|
| Stripe | https://dashboard.stripe.com | 2.9% + $0.30 | Industry standard, best mobile SDK support |
| Polar.sh | https://polar.sh | 4% + $0.40 | Merchant of Record, handles global taxes |

### Backend Hosting (Choose One)
| Option | URL | Cost |
|--------|-----|------|
| AWS | https://aws.amazon.com | ~$100-200/mo |
| DigitalOcean | https://digitalocean.com | ~$50-100/mo |
| Railway | https://railway.app | ~$20-50/mo |
| Render | https://render.com | ~$30-80/mo |
| Supabase (alternative) | https://supabase.com | $25/mo |

### Supporting Services
| # | Service | URL | Cost |
|---|---------|-----|------|
| 1 | SendGrid/Resend (Email) | https://sendgrid.com | Free-$20/mo |
| 2 | Sentry (Errors) | https://sentry.io | Free-$26/mo |
| 3 | AWS S3 or Cloudflare R2 | https://aws.amazon.com/s3 | ~$5-20/mo |
| 4 | Cloudflare (DNS/CDN) | https://cloudflare.com | Free |

---

## ESTIMATED MONTHLY COSTS

### Minimum Viable Deployment
| Item | Cost |
|------|------|
| Apple Developer | $8.25/mo ($99/yr) |
| Expo (Free tier) | $0 |
| Firebase (Spark) | $0 |
| Railway/Render | $25-50/mo |
| Stripe | Transaction fees only |
| SendGrid (Free) | $0 |
| Sentry (Free) | $0 |
| Domain | $1/mo (~$12/yr) |
| **TOTAL** | **~$35-60/month** |

### Production Deployment
| Item | Cost |
|------|------|
| Apple Developer | $8.25/mo |
| Expo (Production) | $99/mo |
| Firebase (Blaze) | ~$20-50/mo |
| Google Cloud (Maps) | ~$20-50/mo |
| AWS/Cloud Hosting | ~$100-200/mo |
| Stripe | 2.9% + $0.30/tx |
| SendGrid Pro | $20/mo |
| Sentry Team | $26/mo |
| Cloudflare Pro | $20/mo |
| Domain | $1/mo |
| **TOTAL** | **~$315-475/month** + Stripe fees |

---

## SETUP ORDER (Recommended)

1. **Google Account** - Base for everything
2. **Firebase** - Auth, notifications
3. **Google Cloud Platform** - Enable APIs, get keys
4. **Expo** - Create project, get EAS ID
5. **Stripe** - Payment processing
6. **Domain** - Register domain
7. **Cloud Hosting** - Deploy backend
8. **Apple Developer** - iOS setup
9. **Google Play Console** - Android setup
10. **Email Service** - Transactional emails
11. **Sentry** - Error tracking
12. **Cloudflare** - DNS, CDN

---

## ENVIRONMENT VARIABLES REFERENCE

### Mobile App (.env)
```bash
EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_API_BASE_URL=https://api.cloudclips.app/api
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...
EXPO_PUBLIC_FIREBASE_DATABASE_URL=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_SENTRY_DSN=...
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

### Backend (.env)
```bash
PORT=8080
ENVIRONMENT=production
DATABASE_URL=postgres://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FIREBASE_PROJECT_ID=...
FIREBASE_CREDENTIALS_FILE=./firebase-credentials.json
FCM_SERVER_KEY=...
FIREBASE_STORAGE_BUCKET=...
MEDIA_STORAGE_TYPE=s3
MEDIA_BASE_URL=https://cdn.cloudclips.app
AWS_S3_BUCKET=cloudclips-media
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=...
FROM_EMAIL=noreply@cloudclips.app
FROM_NAME=Cloud Clips
APP_URL=https://cloudclips.app
```
