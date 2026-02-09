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
- [ ] Initialize Convex project
- [ ] Configure Convex Auth (Magic Links + Social)
- [ ] Set up database schema
- [ ] Configure file storage
- [ ] Set up environment variables

### 1.2 Core Schema Implementation
```
- [ ] users table
- [ ] barberProfiles table  
- [ ] appointments table
- [ ] reviews table
- [ ] messages table
```

### 1.3 Auth System
- [ ] User registration/login
- [ ] Role-based access (client/barber/admin)
- [ ] Social auth (Google, Apple)
- [ ] Session management
- [ ] Password reset flow

### 1.4 Basic Queries & Mutations
- [ ] getCurrentUser
- [ ] updateUserProfile
- [ ] getBarberProfile
- [ ] updateBarberProfile (barber only)

---

## Phase 2: Discovery & Map Integration (Week 3)

### 2.1 OpenStreetMap Setup
- [ ] Install react-native-maps
- [ ] Configure OSM tile provider
- [ ] Add map styling customization
- [ ] Test on iOS and Android

### 2.2 Location Services
- [ ] Request location permissions
- [ ] Get user current location
- [ ] Geocoding with Nominatim
- [ ] Address autocomplete
- [ ] Reverse geocoding

### 2.3 Barber Discovery Queries
- [ ] getNearbyBarbers (with geo filtering)
- [ ] Implement distance calculation
- [ ] Add pagination (cursor-based)
- [ ] Search barbers by name
- [ ] Filter by price, rating, specialties

### 2.4 Discovery UI
- [ ] Map view with barber markers
- [ ] Custom marker component (rating display)
- [ ] Search radius selector
- [ ] List view with cards
- [ ] Filter bottom sheet
- [ ] Pull-to-refresh

### 2.5 Barber Profile Screen
- [ ] Profile header with gallery
- [ ] Services list with pricing
- [ ] Reviews section
- [ ] Location with map preview
- [ ] Book Now CTA

---

## Phase 3: Booking System (Week 4)

### 3.1 Availability System
- [ ] Working hours schema
- [ ] Generate time slots algorithm
- [ ] Check availability query
- [ ] Block booked slots
- [ ] Handle timezone

### 3.2 Booking Mutations
- [ ] bookAppointment
- [ ] cancelAppointment
- [ ] updateAppointmentStatus (barber)
- [ ] Complete appointment flow

### 3.3 Booking UI Flow
- [ ] Service selection screen
- [ ] Date/time picker
- [ ] Location selector (in-salon vs in-home)
- [ ] Address input with autocomplete
- [ ] Special requests form
- [ ] Booking summary

### 3.4 Appointment Management
- [ ] My Appointments list
- [ ] Appointment details screen
- [ ] Cancel/Reschedule UI
- [ ] Barber appointment dashboard
- [ ] Calendar view for barbers

---

## Phase 4: Payments with Stripe (Week 5)

### 4.1 Stripe Setup
- [ ] Create Stripe account
- [ ] Configure Stripe Connect
- [ ] Set up webhook endpoint (Convex action)
- [ ] Test mode configuration

### 4.2 Payment Integration
- [ ] Install Stripe React Native SDK
- [ ] Payment sheet implementation
- [ ] Save payment methods
- [ ] Payment intent creation
- [ ] Handle 3D Secure

### 4.3 Convex Payment Actions
- [ ] createPaymentIntent
- [ ] handleStripeWebhook
- [ ] capturePayment
- [ ] refundPayment
- [ ] Transfer funds to barbers

### 4.4 Checkout Flow
- [ ] Price breakdown component
- [ ] Promo code input
- [ ] Payment method selector
- [ ] Confirmation screen
- [ ] Receipt generation

### 4.5 Barber Onboarding
- [ ] Stripe Connect onboarding
- [ ] Bank account collection
- [ ] Payout schedule
- [ ] Earnings dashboard

---

## Phase 5: Real-time Chat (Week 6)

### 5.1 Chat Schema
- [ ] messages table
- [ ] Conversation metadata

### 5.2 Chat Queries
- [ ] getChatMessages (with pagination)
- [ ] getConversations list
- [ ] Unread count

### 5.3 Chat Mutations
- [ ] sendMessage
- [ ] markAsRead

### 5.4 Chat UI
- [ ] Chat list screen
- [ ] Message bubble component
- [ ] Message input with attachments
- [ ] Typing indicators
- [ ] Push-to-talk voice (optional)

### 5.5 Push Notifications
- [ ] Expo push token registration
- [ ] Notification handlers
- [ ] Chat message notifications
- [ ] Appointment reminder notifications
- [ ] Deep linking to chat

---

## Phase 6: Reviews & Ratings (Week 7)

### 6.1 Review System
- [ ] Submit review mutation
- [ ] Calculate average ratings
- [ ] Photo uploads for reviews
- [ ] Review moderation (report)

### 6.2 Review UI
- [ ] Star rating component
- [ ] Review form
- [ ] Review list on profile
- [ ] Review summary stats

---

## Phase 7: Product Marketplace (Week 8)

### 7.1 Product Schema
- [ ] products table
- [ ] categories
- [ ] Product reviews

### 7.2 Product Queries
- [ ] getProducts
- [ ] getProductById
- [ ] getProductsByCategory
- [ ] Search products

### 7.3 Product UI
- [ ] Product catalog grid
- [ ] Product detail screen
- [ ] Category filter
- [ ] Product recommendations

### 7.4 Shopping Cart
- [ ] Cart state management (Jotai)
- [ ] Add/remove items
- [ ] Quantity selector
- [ ] Cart screen
- [ ] Cart persistence (MMKV)

### 7.5 Orders
- [ ] Create order mutation
- [ ] Order history
- [ ] Order status tracking
- [ ] Shipping address management

---

## Phase 8: Coupons & Promotions (Week 9)

### 8.1 Coupon System
- [ ] Create coupon (admin/barber)
- [ ] Validate coupon
- [ ] Apply discount
- [ ] Track usage

### 8.2 Coupon UI
- [ ] Coupon browser
- [ ] Apply at checkout
- [ ] My coupons screen
- [ ] Barber offer management

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
- [ ] Screen reader labels
- [ ] Color contrast audit
- [ ] Font scaling support
- [ ] Reduced motion support

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

**Current Phase**: Phase 1 - Convex Backend Foundation

**Next Task**: Initialize Convex project

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
