# Supabase Migration Plan for Cloud Clips

## Overview
Migrate Cloud Clips from current dual-path approach (Go + Supabase consideration) to full Supabase BaaS implementation.

## Phase 1: Supabase Project Setup & Foundation
**Duration:** 1 week
**Goal:** Create and configure Supabase project with core infrastructure

### Tasks
- [ ] Create Supabase project on supabase.com
  - [ ] Choose appropriate region (closest to target users)
  - [ ] Enable all required databases extensions
  - [ ] Configure project settings and API keys
- [ ] Configure authentication providers
  - [ ] Enable email/password auth
  - [ ] Enable Google OAuth
  - [ ] Enable Apple OAuth (for iOS)
  - [ ] Configure email templates for verification/passwords
- [ ] Setup storage buckets
  - [ ] Create `avatars` bucket (public read, authenticated write)
  - [ ] Create `barber-gallery` bucket (public read, barber write)
  - [ ] Create `products` bucket (public read, admin write)
  - [ ] Configure storage policies for each bucket
- [ ] Configure environment variables
  - [ ] Update `.env` with Supabase URL and anon key
  - [ ] Add service role key to backend environment (not client)
  - [ ] Create separate environments for dev/staging/prod

### Deliverables
- Supabase project URL and configuration document
- All storage buckets created with policies
- Auth providers configured and tested
- Environment variables documented

---

## Phase 2: Database Schema & Migrations
**Duration:** 1.5 weeks
**Goal:** Implement complete database schema with migrations and RLS policies

### Tasks
- [ ] Convert MongoDB schema to PostgreSQL
  - [ ] Convert `User` collection to `users` table
  - [ ] Convert `BarberProfile` to `barber_profiles` table
  - [ ] Convert `Appointment` to `appointments` table
  - [ ] Convert `Review` to `reviews` table
  - [ ] Convert `Product` to `products` table
  - [ ] Convert `Order` to `orders` table
  - [ ] Convert `Coupon` to `coupons` table
  - [ ] Convert `ChatMessage` to `chat_messages` table
  - [ ] Convert `Notification` to `notifications` table
- [ ] Create database migrations
  - [ ] Write `001_create_tables.up.sql` migration
  - [ ] Write `001_create_tables.down.sql` rollback
  - [ ] Add foreign key constraints
  - [ ] Create indexes for performance
  - [ ] Enable PostGIS extension for location queries
- [ ] Implement Row Level Security (RLS)
  - [ ] Enable RLS on all tables
  - [ ] Create policies for `users` table (self-read/write)
  - [ ] Create policies for `barber_profiles` table
  - [ ] Create policies for `appointments` table (client/barber access)
  - [ ] Create policies for `chat_messages` table
  - [ ] Create policies for `reviews` table
  - [ ] Create policies for `products` and `orders` tables
  - [ ] Create admin-specific policies for all tables
- [ ] Create database functions
  - [ ] Create function `get_nearby_barbers(latitude, longitude, radius)`
  - [ ] Create function `calculate_appointment_cost(appointment_id)`
  - [ ] Create trigger for updated_at timestamps
  - [ ] Create function for barber availability checking
- [ ] Setup PostGIS
  - [ ] Add geometry columns to users and barber_profiles
  - [ ] Create spatial indexes
  - [ ] Test geospatial queries

### Deliverables
- Complete migration files in `supabase/migrations/`
- RLS policies implemented and tested
- Database functions documented
- Schema validation script

---

## Phase 3: Supabase Client SDK Integration
**Duration:** 1 week
**Goal:** Integrate Supabase SDKs into React Native app

### Tasks
- [ ] Install Supabase dependencies
  - [ ] `npm install @supabase/supabase-js`
  - [ ] Install Expo-specific Supabase modules
  - [ ] Update package.json dependencies
- [ ] Create Supabase client configuration
  - [ ] Create `src/services/supabase/client.ts`
  - [ ] Create separate client for Edge Functions
  - [ ] Initialize Supabase with environment variables
- [ ] Setup TypeScript types
  - [ ] Generate types from database schema using Supabase CLI
  - [ ] Create `src/types/supabase.ts` with database types
  - [ ] Create interface types matching schema
- [ ] Create Supabase service layer
  - [ ] Create `src/services/supabase/auth.ts` for auth operations
  - [ ] Create `src/services/supabase/users.ts` for user CRUD
  - [ ] Create `src/services/supabase/barbers.ts` for barber operations
  - [ ] Create `src/services/supabase/appointments.ts` for bookings
  - [ ] Create `src/services/supabase/products.ts` for marketplace
  - [ ] Create `src/services/supabase/chat.ts` for messaging
- [ ] Setup real-time subscriptions
  - [ ] Create `src/services/supabase/realtime.ts`
  - [ ] Implement appointment status updates subscription
  - [ ] Implement chat message subscription
  - [ ] Implement notification subscription

### Deliverables
- Supabase client initialized and configured
- Type-safe service layer for all operations
- Real-time subscription handlers implemented
- Type definitions matching database schema

---

## Phase 4: Authentication Migration
**Duration:** 1 week
**Goal:** Migrate from current auth to Supabase Auth

### Tasks
- [ ] Update auth context and hooks
  - [ ] Refactor `src/hooks/useAuth.ts` to use Supabase Auth
  - [ ] Implement session management with Supabase session
  - [ ] Update auth state atoms in Jotai store
- [ ] Update auth screens
  - [ ] Modify login screen to use Supabase auth
  - [ ] Modify signup screen with Supabase signup
  - [ ] Add social auth buttons (Google, Apple)
  - [ ] Implement email verification flow
- [ ] Update protected routes
  - [ ] Modify route guards to check Supabase auth state
  - [ ] Update navigation based on user role
- [ ] Remove legacy auth code
  - [ ] Remove existing auth handler references
  - [ ] Clean up old auth tokens from AsyncStorage
- [ ] Test authentication flows
  - [ ] Test email signup and login
  - [ ] Test social auth (Google, Apple)
  - [ ] Test password reset
  - [ ] Test session persistence

### Deliverables
- Authentication fully migrated to Supabase
- Social auth working
- Session management implemented
- Auth flows tested and documented

---

## Phase 5: API Migration - Users & Barber Profiles
**Duration:** 1 week
**Goal:** Migrate user and barber profile operations to Supabase

### Tasks
- [ ] Migrate user profile operations
  - [ ] Replace `GET /api/users/me` with Supabase query
  - [ ] Replace `PUT /api/users/me` with Supabase update
  - [ ] Update avatar upload to Supabase Storage
  - [ ] Update location tracking with PostGIS
- [ ] Migrate barber profile operations
  - [ ] Replace barber profile CRUD with Supabase
  - [ ] Implement barber gallery uploads to Storage
  - [ ] Update barber verification status handling
  - [ ] Migrate service and pricing CRUD operations
- [ ] Migrate geospatial search
  - [ ] Replace custom location API with PostGIS query
  - [ ] Implement nearby barbers search using PostGIS
  - [ ] Add filtering by distance, rating, price
- [ ] Update client screens
  - [ ] Update barber discovery screen with Supabase queries
  - [ ] Update barber profile screen
  - [ ] Update barber profile edit screen
- [ ] Update barber app screens
  - [ ] Update barber dashboard
  - [ ] Update profile management
  - [ ] Update availability scheduling

### Deliverables
- User profiles fully migrated to Supabase
- Barber profiles migrated with PostGIS search
- Profile management screens updated
- Gallery uploads working with Storage

---

## Phase 6: API Migration - Booking System
**Duration:** 1.5 weeks
**Goal:** Migrate appointment booking system to Supabase

### Tasks
- [ ] Migrate appointment CRUD
  - [ ] Replace booking API with direct Supabase inserts
  - [ ] Update appointment status changes
  - [ ] Implement appointment history queries
- [ ] Migrate availability system
  - [ ] Create availability tables in Supabase
  - [ ] Implement barber availability checking
  - [ ] Update appointment booking validation
- [ ] Migrate payment integration
  - [ ] Create Edge Function for Stripe payment processing
  - [ ] Update payment flow to use Edge Functions
  - [ ] Store payment metadata in appointments table
  - [ ] Implement webhook handling in Edge Functions
- [ ] Update booking screens
  - [ ] Update booking form with Supabase mutations
  - [ ] Update appointment confirmation flow
  - [ ] Update appointment history screen
  - [ ] Update appointment cancellation flow
- [ ] Implement real-time updates
  - [ ] Subscribe to appointment status changes
  - [ ] Show real-time updates in UI
  - [ ] Add push notification triggers

### Deliverables
- Booking system fully migrated to Supabase
- Edge Functions for payments created
- Real-time appointment updates working
- Payment flow integrated with Edge Functions

---

## Phase 7: API Migration - Chat & Reviews
**Duration:** 1 week
**Goal:** Migrate chat and review system to Supabase

### Tasks
- [ ] Migrate chat system
  - [ ] Replace WebSocket chat with Supabase Realtime
  - [ ] Implement message storage in Supabase
  - [ ] Add chat message pagination
  - [ ] Implement read receipts
  - [ ] Add typing indicators
- [ ] Migrate review system
  - [ ] Replace review API with Supabase queries
  - [ ] Implement review submission
  - [ ] Update barber ratings on review submission
  - [ ] Add review with photo uploads
- [ ] Update chat screens
  - [ ] Update chat list screen
  - [ ] Update chat conversation screen
  - [ ] Add real-time message updates
- [ ] Update review screens
  - [ ] Update review submission screen
  - [ ] Update review display on barber profiles
  - [ ] Update review history screen
- [ ] Setup notifications
  - [ ] Implement Supabase notifications
  - [ ] Connect to FCM for push notifications
  - [ ] Add notification preferences

### Deliverables
- Chat system migrated to Supabase Realtime
- Review system fully migrated
- Real-time messaging working
- Notification system integrated

---

## Phase 8: API Migration - Marketplace & Coupons
**Duration:** 1 week
**Goal:** Migrate product marketplace and coupon system to Supabase

### Tasks
- [ ] Migrate product catalog
  - [ ] Replace product API with Supabase queries
  - [ ] Implement product search and filtering
  - [ ] Update product image uploads to Storage
- [ ] Migrate order system
  - [ ] Replace order API with Supabase
  - [ ] Implement shopping cart in local state
  - [ ] Create order processing flow
  - [ ] Track order status changes
- [ ] Migrate coupon system
  - [ ] Replace coupon API with Supabase queries
  - [ ] Implement coupon validation logic
  - [ ] Create coupon usage tracking
- [ ] Update marketplace screens
  - [ ] Update product catalog screen
  - [ ] Update product detail screen
  - [ ] Update shopping cart screen
  - [ ] Update checkout flow
- [ ] Update admin screens
  - [ ] Create product management for admins
  - [ ] Create order management dashboard
  - [ ] Create coupon management interface

### Deliverables
- Product marketplace migrated to Supabase
- Order system fully functional
- Coupon system implemented
- Admin management screens created

---

## Phase 9: Backend Cleanup & Data Migration
**Duration:** 1 week
**Goal:** Remove legacy Go backend and migrate any existing data

### Tasks
- [ ] Export existing data
  - [ ] Export users from MongoDB (if any)
  - [ ] Export barber profiles from MongoDB
  - [ ] Export appointments from MongoDB
  - [ ] Export products and orders from MongoDB
- [ ] Transform and import data
  - [ ] Transform MongoDB documents to PostgreSQL format
  - [ ] Import users to Supabase
  - [ ] Import barber profiles
  - [ ] Import appointments and related data
  - [ ] Import products and orders
- [ ] Remove Go backend code
  - [ ] Archive `backend/` directory to `backend-archive/`
  - [ ] Remove backend API service references
  - [ ] Clean up environment variables for backend
- [ ] Remove backend infrastructure
  - [ ] Decommission backend servers (if running)
  - [ ] Cancel backend hosting services
  - [ ] Archive backend documentation
- [ ] Update documentation
  - [ ] Update AGENTS.md with Supabase commands
  - [ ] Update PROJECT_PLAN.md to reflect Supabase-only path
  - [ ] Create SUPABASE_ARCHITECTURE.md

### Deliverables
- All existing data migrated to Supabase
- Go backend code archived
- Backend infrastructure decommissioned
- Documentation updated

---

## Phase 10: Testing & Optimization
**Duration:** 1.5 weeks
**Goal:** Thoroughly test all migrated features and optimize performance

### Tasks
- [ ] Testing - Authentication
  - [ ] Unit tests for auth hooks
  - [ ] Integration tests for login/signup flows
  - [ ] Test social auth end-to-end
  - [ ] Test session persistence
- [ ] Testing - Booking System
  - [ ] Test appointment creation
  - [ ] Test appointment cancellation
  - [ ] Test payment flow
  - [ ] Test real-time status updates
- [ ] Testing - Chat & Reviews
  - [ ] Test chat message sending/receiving
  - [ ] Test chat real-time updates
  - [ ] Test review submission
  - [ ] Test photo uploads
- [ ] Testing - Marketplace
  - [ ] Test product browsing
  - [ ] Test shopping cart
  - [ ] Test order placement
  - [ ] Test coupon application
- [ ] Performance optimization
  - [ ] Analyze query performance with Supabase dashboard
  - [ ] Add missing indexes
  - [ ] Optimize RLS policies
  - [ ] Implement query result caching
- [ ] Load testing
  - [ ] Test concurrent bookings
  - [ ] Test real-time message load
  - [ ] Test geospatial query performance
  - [ ] Scale database if needed

### Deliverables
- All tests passing
- Performance benchmarks documented
- Database optimized
- Load test results

---

## Phase 11: Deployment & Production Setup
**Duration:** 1 week
**Goal:** Deploy Supabase to production and configure monitoring

### Tasks
- [ ] Production Supabase setup
  - [ ] Create production Supabase project
  - [ ] Enable enterprise features if needed
  - [ ] Configure production storage buckets
  - [ ] Setup production auth providers
- [ ] Environment configuration
  - [ ] Create production environment variables
  - [ ] Configure production API keys
  - [ ] Setup proper key rotation strategy
- [ ] Monitoring setup
  - [ ] Configure Supabase dashboard alerts
  - [ ] Setup error tracking with Sentry
  - [ ] Configure analytics with Mixpanel
  - [ ] Setup log export to external service
- [ ] Backup strategy
  - [ ] Enable automated backups
  - [ ] Test backup restoration
  - [ ] Document backup retention policy
- [ ] Security hardening
  - [ ] Review all RLS policies
  - [ ] Enable network restrictions
  - [ ] Configure IP allowlists
  - [ ] Setup audit logging
- [ ] Deployment
  - [ ] Deploy mobile app to stores with Supabase backend
  - [ ] Run smoke tests in production
  - [ ] Monitor initial performance

### Deliverables
- Production Supabase project configured
- Monitoring and alerts active
- Backup strategy tested
- Security policies reviewed
- Mobile app deployed to production

---

## Phase 12: Documentation & Handoff
**Duration:** 0.5 weeks
**Goal:** Document the Supabase implementation and provide team handoff

### Tasks
- [ ] Technical documentation
  - [ ] Create SUPABASE_SETUP_GUIDE.md
  - [ ] Document Edge Functions
  - [ ] Document database schema with diagrams
  - [ ] Document RLS policies
- [ ] API documentation
  - [ ] Document Supabase queries for each feature
  - [ ] Document real-time subscriptions
  - [ ] Document Edge Function endpoints
- [ ] Operations documentation
  - [ ] Create troubleshooting guide
  - [ ] Document common tasks (backups, migrations)
  - [ ] Create incident response procedures
- [ ] Team training
  - [ ] Conduct team walkthrough of new architecture
  - [ ] Provide training on Supabase dashboard
  - [ ] Document development workflow
- [ ] Project cleanup
  - [ ] Remove deprecated documentation
  - [ ] Archive old implementation plans
  - [ ] Update README with final stack

### Deliverables
- Complete technical documentation
- Operations manual
- Team training completed
- Project documentation up to date

---

## Success Criteria

### Technical
- All features migrated to Supabase with zero data loss
- 100% of tests passing
- 95th percentile API response time < 200ms
- 99.9% uptime for Supabase services

### Business
- Zero downtime during migration
- Cost reduction of at least 50% vs previous backend
- Faster development time for new features
- Improved real-time performance

### Development Experience
- Simplified deployment pipeline
- Reduced infrastructure maintenance
- Easier local development setup
- Better type safety with generated types

---

## Risk Mitigation

### Migration Risks
- **Data loss**: Mitigated with full backups and test migrations
- **Downtime**: Use blue-green deployment strategy
- **Feature gaps**: Document and prioritize missing features
- **Performance issues**: Load test before production cutover

### Rollback Plan
- Keep Go backend archived for 30 days
- Document rollback procedures
- Maintain ability to switch back if critical issues arise
- Monitor production closely for first 48 hours

---

## Resource Requirements

### Team
- 1 Full-stack developer (8-10 weeks)
- 1 Mobile developer (6-8 weeks)
- 1 DevOps engineer (part-time, 2-3 weeks)
- 1 QA engineer (2-3 weeks)

### Tools & Services
- Supabase Team or Pro plan
- Sentry for error tracking
- Mixpanel for analytics
- GitHub Actions for CI/CD
- TestFlight/App Store Connect for deployment

---

## Timeline Summary

| Phase | Duration | Start Week | End Week |
|-------|----------|------------|----------|
| 1. Project Setup | 1 week | W1 | W1 |
| 2. Database Schema | 1.5 weeks | W2 | W3.5 |
| 3. SDK Integration | 1 week | W3.5 | W4.5 |
| 4. Auth Migration | 1 week | W4.5 | W5.5 |
| 5. Users & Barbers | 1 week | W5.5 | W6.5 |
| 6. Booking System | 1.5 weeks | W6.5 | W8 |
| 7. Chat & Reviews | 1 week | W8 | W9 |
| 8. Marketplace | 1 week | W9 | W10 |
| 9. Cleanup & Migration | 1 week | W10 | W11 |
| 10. Testing & Optimization | 1.5 weeks | W11 | W12.5 |
| 11. Deployment | 1 week | W12.5 | W13.5 |
| 12. Documentation | 0.5 weeks | W13.5 | W14 |

**Total Timeline: 14 weeks (3.5 months)**
