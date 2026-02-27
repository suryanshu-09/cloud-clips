# Cloud Clips - Development Roadmap

A phased approach to building the complete Cloud Clips application with Convex + OpenStreetMaps.

---

## Phase 0: Foundation & Planning (Week 1)

### 0.1 Project Cleanup
- [x] Remove unnecessary MD files
- [x] Create comprehensive README
- [x] Create this TODO roadmap
- [x] Clean up mobile app directory structure
- [x] Remove Go backend (if not needed)

### 0.2 Design Direction
- [x] Choose app aesthetic direction (brutalist/minimal/maximalist/editorial)
- [x] Define color palette & typography
- [x] Create mood board
- [x] Design key screens wireframes and descriptions

### 0.3 Technical Setup
- [x] Verify Expo SDK 51+ compatibility
- [x] Update dependencies to latest stable versions
- [x] Set up Convex account and project
- [x] Configure development environments
- [x] Set up CI/CD basics (GitHub Actions)

---

## Phase 1: Convex Backend Foundation (Week 2)

### 1.1 Convex Project Setup
- [x] Initialize Convex project
- [x] Configure Convex Auth (Magic Links + Social)
- [x] Set up database schema
- [x] Configure file storage
- [x] Set up environment variables

### 1.2 Core Schema Implementation
```
- [x] users table
- [x] barberProfiles table  
- [x] appointments table
- [x] reviews table
- [x] messages table
```

### 1.3 Auth System
- [x] User registration/login
- [x] Role-based access (client/barber/admin)
- [x] Social auth (Google, Apple)
- [x] Session management
- [x] Password reset flow

### 1.4 Basic Queries & Mutations
- [x] getCurrentUser
- [x] updateUserProfile
- [x] getBarberProfile
- [x] updateBarberProfile (barber only)

---

## Phase 2: Discovery & Map Integration (Week 3)

### 2.1 OpenStreetMap Setup
- [x] Install react-native-maps
- [x] Configure OSM tile provider
- [x] Add map styling customization
- [x] Test on iOS and Android (Android compiles; some runtime errors due to backend)

### 2.2 Location Services
- [x] Request location permissions
- [x] Get user current location
- [x] Geocoding with Nominatim
- [x] Address autocomplete
- [x] Reverse geocoding

### 2.3 Barber Discovery Queries
- [x] getNearbyBarbers (with geo filtering)
- [x] Implement distance calculation
- [x] Add pagination (cursor-based)
- [x] Search barbers by name
- [x] Filter by price, rating, specialties

### 2.4 Discovery UI
- [x] Map view with barber markers
- [x] Custom marker component (rating display)
- [x] Search radius selector
- [x] List view with cards
- [x] Filter bottom sheet
- [x] Pull-to-refresh

### 2.5 Barber Profile Screen
- [x] Profile header with gallery
- [x] Services list with pricing
- [x] Reviews section
- [x] Location with map preview
- [x] Book Now CTA

---

## Phase 3: Booking System (Week 4)

### 3.1 Availability System
- [x] Working hours schema
- [x] Generate time slots algorithm
- [x] Check availability query
- [x] Block booked slots
- [x] Handle timezone

### 3.2 Booking Mutations
- [x] bookAppointment
- [x] cancelAppointment
- [x] updateAppointmentStatus (barber)
- [x] Complete appointment flow

### 3.3 Booking UI Flow
- [x] Service selection screen
- [x] Date/time picker
- [x] Location selector (in-salon vs in-home)
- [x] Address input with autocomplete
- [x] Special requests form
- [x] Booking summary

### 3.4 Appointment Management
- [x] My Appointments list
- [x] Appointment details screen
- [x] Cancel/Reschedule UI
- [x] Barber appointment dashboard
- [x] Calendar view for barbers

---

## Phase 4: Payments with Stripe (Week 5)

### 4.1 Stripe Setup
- [x] Create Stripe account
- [x] Configure Stripe Connect
- [x] Set up webhook endpoint (Convex action)
- [x] Test mode configuration

### 4.2 Payment Integration
- [x] Install Stripe React Native SDK
- [x] Payment sheet implementation
- [x] Save payment methods
- [x] Payment intent creation
- [x] Handle 3D Secure

### 4.3 Convex Payment Actions
- [x] createPaymentIntent
- [x] handleStripeWebhook
- [x] capturePayment
- [x] refundPayment
- [x] Transfer funds to barbers

### 4.4 Checkout Flow
- [x] Price breakdown component
- [x] Promo code input
- [x] Payment method selector
- [x] Confirmation screen
- [x] Receipt generation

### 4.5 Barber Onboarding
- [x] Stripe Connect onboarding
- [x] Bank account collection
- [x] Payout schedule
- [x] Earnings dashboard

---

## Phase 5: Real-time Chat (Week 6)

### 5.1 Chat Schema
- [x] messages table
- [x] Conversation metadata

### 5.2 Chat Queries
- [x] getChatMessages (with pagination)
- [x] getConversations list
- [x] Unread count

### 5.3 Chat Mutations
- [x] sendMessage
- [x] markAsRead

### 5.4 Chat UI
- [x] Chat list screen
- [x] Message bubble component
- [x] Message input with attachments
- [x] Typing indicators
- [x] Push-to-talk voice (optional)

### 5.5 Push Notifications
- [x] Expo push token registration
- [x] Notification handlers
- [x] Chat message notifications
- [x] Appointment reminder notifications
- [x] Deep linking to chat

---

## Phase 6: Reviews & Ratings (Week 7)

### 6.1 Review System
- [x] Submit review mutation
- [x] Calculate average ratings
- [x] Photo uploads for reviews
- [x] Review moderation (report)

### 6.2 Review UI
- [x] Star rating component
- [x] Review form
- [x] Review list on profile
- [x] Review summary stats

---

## Phase 7: Product Marketplace (Week 8)

### 7.1 Product Schema
- [x] products table
- [x] categories
- [x] Product reviews

### 7.2 Product Queries
- [x] getProducts
- [x] getProductById
- [x] getProductsByCategory
- [x] Search products

### 7.3 Product UI
- [x] Product catalog grid
- [x] Product detail screen
- [x] Category filter
- [x] Product recommendations

### 7.4 Shopping Cart
- [x] Cart state management (Jotai)
- [x] Add/remove items
- [x] Quantity selector
- [x] Cart screen
- [x] Cart persistence (MMKV)

### 7.5 Orders
- [x] Create order mutation
- [x] Order history
- [x] Order status tracking
- [x] Shipping address management

---

## Phase 8: Coupons & Promotions (Week 9)

### 8.1 Coupon System
- [x] Create coupon (admin/barber)
- [x] Validate coupon
- [x] Apply discount
- [x] Track usage

### 8.2 Coupon UI
- [x] Coupon browser
- [x] Apply at checkout
- [x] My coupons screen
- [x] Barber offer management

---

## Phase 9: Barber Dashboard (Week 10)

### 9.1 Dashboard Overview
- [ ] Today’s appointments widget
- [ ] Weekly earnings chart
- [ ] Quick stats cards
- [ ] Availability toggle

### 9.2 Schedule Management
- [ ] Weekly calendar view
- [ ] Working hours editor
- [ ] Time-off blocking
- [ ] Recurring availability

### 9.3 Earnings
- [ ] Earnings history
- [ ] Payout management
- [ ] Tax documents
- [ ] Analytics charts

### 9.4 Profile Management
- [ ] Business info editor
- [ ] Service pricing
- [ ] Portfolio gallery upload
- [ ] Location management

---

## Phase 10: Admin Dashboard (Web) (Week 11)

### 10.1 Admin Setup
- [ ] Create Next.js admin app
- [ ] Connect to Convex
- [ ] Role-based admin access

### 10.2 User Management
- [ ] User list with search
- [ ] Barber verification
- [ ] User actions (ban, delete)

### 10.3 Analytics
- [ ] Booking statistics
- [ ] Revenue charts
- [ ] User growth
- [ ] Popular services

### 10.4 Content Management
- [ ] Featured barbers
- [ ] System announcements
- [ ] Product catalog admin
- [ ] Support tickets

---

## Phase 11: Polish & Optimization (Week 12)

### 11.1 UI/UX Polish
- [ ] Loading states everywhere
- [ ] Empty states
- [ ] Error boundaries
- [ ] Skeleton screens
- [ ] Micro-interactions
- [ ] Haptic feedback

### 11.2 Performance
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Memoization audit
- [ ] Bundle size analysis
- [ ] Query optimization

### 11.3 Offline Support
- [ ] Persistent cache (MMKV)
- [ ] Optimistic updates
- [ ] Queue mutations offline
- [ ] Sync on reconnect

### 11.4 Accessibility
- [x] Screen reader labels
- [x] Color contrast audit
- [x] Font scaling support
- [x] Reduced motion support

---

## Phase 12: Testing & QA (Week 13)

### 12.1 Unit Tests
- [ ] Test hooks
- [ ] Test utilities
- [ ] Test Convex functions

### 12.2 Integration Tests
- [ ] Booking flow tests
- [ ] Payment flow tests
- [ ] Chat flow tests

### 12.3 E2E Tests
- [ ] Maestro test suite
- [ ] Critical user journeys
- [ ] Cross-device testing

### 12.4 Manual Testing
- [ ] iOS testing (multiple devices)
- [ ] Android testing (multiple devices)
- [ ] Beta testing with real users

---

## Phase 13: Pre-Launch (Week 14)

### 13.1 Store Preparation
- [ ] App Store screenshots
- [ ] Play Store screenshots
- [ ] App description & keywords
- [ ] Privacy policy
- [ ] Terms of service

### 13.2 Production Setup
- [ ] Production Convex deployment
- [ ] Stripe live mode
- [ ] Sentry error tracking
- [ ] Analytics setup (Mixpanel/Amplitude)

### 13.3 Documentation
- [ ] User guide
- [ ] Barber onboarding guide
- [ ] API documentation
- [ ] Deployment runbook

---

## Phase 14: Launch & Iterate (Ongoing)

### 14.1 Soft Launch
- [ ] Beta release (TestFlight/Internal Testing)
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Monitor metrics

### 14.2 Public Launch
- [ ] App Store submission
- [ ] Play Store submission
- [ ] Marketing materials
- [ ] Social media launch

### 14.3 Post-Launch
- [ ] Monitor crash reports
- [ ] User feedback triage
- [ ] Feature prioritization
- [ ] Iterate based on data

---

## Quick Reference: Current Phase

**Current Phase**: Phase 8 - Coupons & Promotions

**Completed**: Phase 0, Phase 1, Phase 2, Phase 3, Phase 4, Phase 5 (Real-time Chat), Phase 6 (Reviews & Ratings), Phase 7 (Product Marketplace)

**Next Task**: Implement coupons & promotions

**Current Blockers**: None

---

## Legend

- `[ ]` - Not started
- `[/]` - In progress
- `[x]` - Complete
- `[-]` - Blocked
- `[~]` - Optional/Nice to have

---

## Notes

- Each phase assumes 1 week of focused work
- Adjust timeline based on team size
- Some phases can run in parallel (e.g., Admin Dashboard during Polish)
- Prioritize mobile app over web admin initially
- Focus on core booking flow before marketplace
