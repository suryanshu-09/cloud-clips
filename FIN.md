# Cloud Clips - Final Implementation Plan (FIN)

This document outlines all remaining work needed to complete the Cloud Clips mobile application. It identifies gaps between the current implementation and production-ready state, organized into actionable phases.

---

## Current State Summary

### What's Done (Phases 1-18 Complete)

- Project scaffolding with Expo, TypeScript, NativeWind
- State management (Jotai, TanStack Query, MMKV)
- Base UI components (Button, Input, Card, Modal, etc.)
- Auth flow screens (login, register, forgot password, onboarding)
- Client home, search, booking flow
- Barber dashboard, schedule, appointments screens
- Chat, products, reviews features (with mock services)
- Offline support, error handling, loading states
- App signing configuration (EAS)

### What's NOT Done

1. **Empty stub screens** - Appointments list, Coupons screen
2. **Backend integration** - App runs entirely on mock services
3. **Real authentication** - Firebase Auth not connected to backend
4. **REST API layer** - Backend only exposes GraphQL, no REST endpoints
5. **Payment processing** - Stripe not integrated
6. **Real-time features** - No WebSocket for chat
7. **Profile sub-screens** - Payment methods, addresses, notifications settings
8. **Admin dashboard** - Not implemented
9. **Data persistence** - Backend uses in-memory storage only

---

## Phase 19: Complete Stub Screens

**Duration: 1 week**
**Priority: HIGH**

These screens exist but are empty stubs that need full implementation.

### 19.1 Client Appointments List Screen

**File:** `mobile/src/app/(client)/appointments/index.tsx`

Tasks:

- [x] Create appointment card component with status badges
- [x] Implement tab navigation (Upcoming / Past / Cancelled)
- [x] Add pull-to-refresh functionality
- [x] Implement empty states for each tab
- [x] Add appointment filtering and search
- [x] Connect to `useAppointments` hook
- [x] Add "Rebook" action for past appointments
- [x] Add "Cancel" action with confirmation modal
- [x] Add "Reschedule" action linking to schedule picker
- [x] Implement infinite scroll for past appointments

```typescript
// Expected structure
- Header with title
- TabView (Upcoming | Past | Cancelled)
- FlatList of AppointmentCard components
- Each card shows: barber name, service, date/time, status, actions
- FAB button to book new appointment
```

### 19.2 Coupons & Offers Screen

**File:** `mobile/src/app/(client)/coupons.tsx`

Tasks:

- [x] Create coupon card component
- [x] Display available coupons list
- [x] Show coupon details (discount %, min order, expiry)
- [x] Add coupon code input field
- [x] Implement coupon validation
- [x] Add "Copy Code" functionality
- [x] Show applied/saved coupons section
- [x] Filter coupons by category (services/products)
- [x] Connect to `useCoupons` hook
- [x] Add expiry countdown for time-limited offers

```typescript
// Expected structure
- Header with title
- Coupon code input with "Apply" button
- Section: "Your Saved Coupons"
- Section: "Available Offers"
- Each coupon card with copy/apply actions
```

---

## Phase 20: Profile Sub-Screens

**Duration: 1 week**
**Priority: MEDIUM**

The profile screen shows menu items that don't navigate anywhere yet.

### 20.1 Payment Methods Screen

**File:** `mobile/src/app/(client)/profile/payment-methods.tsx`

Tasks:

- [ ] List saved payment methods (cards)
- [ ] Add new card form (Stripe CardField)
- [ ] Set default payment method
- [ ] Delete saved cards with confirmation
- [ ] Show card brand icons (Visa, Mastercard, etc.)
- [ ] Integrate with Stripe Customer API
- [ ] Handle 3D Secure authentication

### 20.2 Addresses Screen

**File:** `mobile/src/app/(client)/profile/addresses.tsx`

Tasks:

- [ ] List saved addresses
- [ ] Add new address form
- [ ] Edit existing address
- [ ] Delete address with confirmation
- [ ] Set default address for in-home services
- [ ] Integrate with Google Places Autocomplete
- [ ] Show address on mini-map preview

### 20.3 Notification Settings Screen

**File:** `mobile/src/app/(client)/profile/notifications.tsx`

Tasks:

- [ ] Toggle push notifications
- [ ] Toggle email notifications
- [ ] Toggle SMS notifications
- [ ] Notification preferences by type:
  - Appointment reminders
  - Chat messages
  - Promotions & offers
  - Order updates
- [ ] Save preferences to user profile
- [ ] Connect to backend notification settings API

### 20.4 Settings Screen

**File:** `mobile/src/app/(client)/profile/settings.tsx`

Tasks:

- [ ] Language selection
- [ ] Theme (Light/Dark/System)
- [ ] Currency preference
- [ ] Units (Miles/Kilometers)
- [ ] Clear cache option
- [ ] Delete account (with confirmation flow)
- [ ] Privacy settings
- [ ] Export data option

### 20.5 Help & Support Screen

**File:** `mobile/src/app/(client)/profile/help.tsx`

Tasks:

- [ ] FAQ accordion sections
- [ ] Contact support form
- [ ] Live chat integration (optional)
- [ ] Links to privacy policy and terms
- [ ] Report a problem flow
- [ ] Rate the app prompt

### 20.6 Orders History Screen

**File:** `mobile/src/app/(client)/profile/orders.tsx`

Tasks:

- [ ] List past product orders
- [ ] Order details view
- [ ] Order status tracking
- [ ] Reorder functionality
- [ ] Request return/refund flow

---

## Phase 21: Backend REST API Layer

**Duration: 2 weeks**
**Priority: CRITICAL**

The mobile app expects REST endpoints but the backend only serves GraphQL. We need to add a REST API layer.

### 21.1 Authentication Endpoints

**File:** `backend/internal/handlers/auth.go`

```go
// Required endpoints
POST /api/auth/register     // Create new user
POST /api/auth/login        // Login with email/password
POST /api/auth/logout       // Invalidate token
POST /api/auth/refresh      // Refresh JWT token
POST /api/auth/forgot       // Request password reset
POST /api/auth/reset        // Reset password with token
POST /api/auth/verify       // Verify email
GET  /api/auth/me           // Get current user
```

Tasks:

- [x] Implement JWT token generation with proper secret
- [x] Add password hashing (bcrypt)
- [x] Implement refresh token rotation
- [x] Add rate limiting on auth endpoints
- [x] Integrate with Firebase Auth (optional) - stub added
- [x] Add OAuth providers (Google, Apple) - stubs added

### 21.2 User Endpoints

**File:** `backend/internal/handlers/user.go` (extend)

```go
// Required endpoints
GET    /api/users/:id       // Get user by ID
PUT    /api/users/:id       // Update user profile
DELETE /api/users/:id       // Delete user
PUT    /api/users/:id/avatar // Upload avatar
GET    /api/users/:id/notifications // Get notification settings
PUT    /api/users/:id/notifications // Update notification settings
```

### 21.3 Barber Endpoints

**File:** `backend/internal/handlers/barber.go` (extend)

```go
// Required endpoints
GET    /api/barbers              // List barbers with filters
GET    /api/barbers/nearby       // Location-based search
GET    /api/barbers/:id          // Get barber profile
GET    /api/barbers/:id/services // Get barber services
GET    /api/barbers/:id/reviews  // Get barber reviews
GET    /api/barbers/:id/availability // Get available time slots

// Barber-only endpoints
PUT    /api/barbers/:id          // Update barber profile
PUT    /api/barbers/:id/schedule // Update working hours
POST   /api/barbers/:id/gallery  // Upload gallery image
DELETE /api/barbers/:id/gallery/:imageId
```

### 21.4 Appointment Endpoints

**File:** `backend/internal/handlers/appointment.go` (extend)

```go
// Required endpoints
GET    /api/appointments              // List user's appointments
POST   /api/appointments              // Create appointment
GET    /api/appointments/:id          // Get appointment details
PUT    /api/appointments/:id          // Update appointment
DELETE /api/appointments/:id          // Cancel appointment
POST   /api/appointments/:id/confirm  // Barber confirms
POST   /api/appointments/:id/complete // Mark as completed
POST   /api/appointments/:id/review   // Submit review
```

### 21.5 Product Endpoints

**File:** `backend/internal/handlers/product.go` (NEW)

```go
// Required endpoints
GET    /api/products              // List products with filters
GET    /api/products/:id          // Get product details
GET    /api/products/categories   // Get product categories
POST   /api/products              // Barber adds product
PUT    /api/products/:id          // Update product
DELETE /api/products/:id          // Delete product
```

### 21.6 Order Endpoints

**File:** `backend/internal/handlers/order.go` (NEW)

```go
// Required endpoints
GET    /api/orders              // List user's orders
POST   /api/orders              // Create order
GET    /api/orders/:id          // Get order details
PUT    /api/orders/:id/status   // Update order status (admin)
POST   /api/orders/:id/cancel   // Cancel order
```

### 21.7 Coupon Endpoints

**File:** `backend/internal/handlers/coupon.go` (NEW)

```go
// Required endpoints
GET    /api/coupons              // List available coupons
GET    /api/coupons/:code        // Get coupon by code
POST   /api/coupons/validate     // Validate coupon for order
POST   /api/coupons              // Create coupon (barber/admin)
PUT    /api/coupons/:id          // Update coupon
DELETE /api/coupons/:id          // Delete coupon
```

### 21.8 Chat Endpoints

**File:** `backend/internal/handlers/chat.go` (NEW)

```go
// Required endpoints
GET    /api/chats                     // List user's chat threads
GET    /api/chats/:appointmentId      // Get chat messages
POST   /api/chats/:appointmentId      // Send message
PUT    /api/chats/:appointmentId/read // Mark as read
```

### 21.9 Notification Endpoints

**File:** `backend/internal/handlers/notification.go` (NEW)

```go
// Required endpoints
GET    /api/notifications           // List user's notifications
PUT    /api/notifications/:id/read  // Mark as read
PUT    /api/notifications/read-all  // Mark all as read
DELETE /api/notifications/:id       // Delete notification
POST   /api/notifications/token     // Register FCM token
```

### 21.10 Register Routes in main.go

All REST API routes have been registered in `backend/cmd/main.go` including:
- Authentication routes (public and protected)
- User routes (protected)
- Barber routes (public + barber-only)
- Appointment routes (protected)
- Product routes (public + barber-only)
- Order routes (protected)
- Coupon routes (public + barber-only)
- Chat routes (protected)
- Notification routes (protected + admin)
- Payment routes (protected + webhook)

### 21.11 Payment Endpoints

**File:** `backend/internal/handlers/payment.go`

```go
// Required endpoints
POST /api/payments/intent          // Create payment intent
GET  /api/payments/methods         // List saved payment methods
POST /api/payments/methods         // Save payment method
DELETE /api/payments/methods/:id   // Delete payment method
PUT  /api/payments/methods/:id/default // Set default payment method
POST /api/payments/refund          // Refund a payment
GET  /api/payments/history         // Get payment history
POST /api/webhooks/stripe          // Stripe webhook handler
```

Tasks:
- [x] Create PaymentHandler struct
- [x] Implement CreatePaymentIntent (with mock fallback for dev)
- [x] Implement SavePaymentMethod
- [x] Implement GetPaymentMethods
- [x] Implement DeletePaymentMethod
- [x] Implement SetDefaultPaymentMethod
- [x] Implement RefundPayment
- [x] Implement HandleStripeWebhook with event processing
- [x] Implement GetPaymentHistory
- [x] Register routes in main.go

---

### Phase 21 Status: COMPLETE ✓

All Phase 21 REST API endpoints have been implemented:
- ✅ Authentication endpoints (auth.go)
- ✅ User endpoints (user.go)
- ✅ Barber endpoints (barber.go)
- ✅ Appointment endpoints (appointment.go)
- ✅ Product endpoints (product.go)
- ✅ Order endpoints (order.go)
- ✅ Coupon endpoints (coupon.go)
- ✅ Chat endpoints (chat.go)
- ✅ Notification endpoints (notification.go)
- ✅ Payment endpoints (payment.go)
- ✅ All routes registered in main.go
- ✅ OAuth stubs added (Google, Apple)

---

## Phase 22: Database Persistence

**Duration: 1 week**
**Priority: CRITICAL**
**Status: COMPLETE ✓**

Replace in-memory storage with PostgreSQL.

### 22.1 Database Setup

Tasks:

- [x] Install PostgreSQL and create database
- [x] Add `github.com/lib/pq` driver
- [x] Add `github.com/golang-migrate/migrate` for migrations
- [x] Create connection pool configuration
- [x] Add database health check

### 22.2 Schema Migrations

**File:** `backend/migrations/`

Migrations created:
- [x] 000001_init_schema.up.sql - Complete schema with all tables
- [x] 000001_init_schema.down.sql - Rollback script

### 22.3 Repository Pattern Implementation

**File:** `backend/internal/storage/postgres.go`

Tasks:

- [x] Create PostgreSQL storage implementation
- [x] Implement connection pooling
- [x] Add prepared statements for common queries
- [x] Implement transaction support
- [x] Add query logging for debugging
- [x] Implement geo-spatial queries with PostGIS

### Phase 22 Summary

All PostgreSQL storage methods implemented:
- ✅ User CRUD operations (CreateUser, GetUser, UpdateUser, DeleteUser, GetUsers)
- ✅ BarberProfile CRUD operations with geo-spatial search (SearchBarbers)
- ✅ Appointment CRUD operations with filtering by client/barber
- ✅ Chat message operations (CreateChatMessage, GetChatMessages, GetChatThreads, MarkMessagesAsRead)
- ✅ Coupon operations (CreateCoupon, GetCoupon, GetCoupons, UpdateCoupon, DeleteCoupon, ValidateCoupon, ApplyCoupon)
- ✅ Notification operations (CreateNotification, GetNotifications, MarkNotificationAsRead, MarkAllNotificationsAsRead)
- ✅ Order operations (CreateOrder, GetOrder, GetOrders, UpdateOrderStatus)
- ✅ Product CRUD operations
- ✅ Review CRUD operations
- ✅ Interface updates to match implementation
- ✅ Memory storage updated to match new interfaces
- ✅ All tests passing

---

## Phase 23: Frontend-Backend Integration

**Duration: 2 weeks**
**Priority: CRITICAL**

Connect the mobile app to the real backend.

### 23.1 API Client Configuration

**File:** `mobile/src/services/api/client.ts`

Tasks:

- [ ] Update base URL configuration
- [ ] Add request interceptors for auth token
- [ ] Add response interceptors for error handling
- [ ] Implement token refresh logic
- [ ] Add request retry logic
- [ ] Switch from mock services to real API calls

### 23.2 Auth Integration

**File:** `mobile/src/features/auth/services/authService.ts`

Tasks:

- [ ] Implement real login with backend API
- [ ] Implement registration with backend
- [ ] Store JWT token securely (MMKV)
- [ ] Implement token refresh flow
- [ ] Remove mock auth service fallback
- [ ] Add biometric authentication (Face ID/Touch ID)

### 23.3 Barber Service Integration

**File:** `mobile/src/features/barbers/services/barberService.ts`

Tasks:

- [ ] Replace mock barber data with API calls
- [ ] Implement location-based search
- [ ] Add proper error handling
- [ ] Implement caching with TanStack Query

### 23.4 Booking Service Integration

**File:** `mobile/src/features/bookings/services/bookingService.ts`

Tasks:

- [ ] Implement real appointment creation
- [ ] Fetch user's appointments from API
- [ ] Implement appointment cancellation
- [ ] Implement rescheduling flow
- [ ] Real-time availability checking

### 23.5 Chat Integration

**File:** `mobile/src/features/chat/services/chatService.ts`

Tasks:

- [ ] Connect to WebSocket endpoint
- [ ] Implement real-time message receiving
- [ ] Send messages via API
- [ ] Handle connection state
- [ ] Implement message persistence
- [ ] Add typing indicators

### 23.6 Product & Order Integration

**Files:**

- `mobile/src/features/products/services/productService.ts`
- `mobile/src/features/products/hooks/useOrders.ts`

Tasks:

- [ ] Fetch products from API
- [ ] Implement cart persistence
- [ ] Create orders via API
- [ ] Track order status
- [ ] Implement reviews for products

### 23.7 Remove DEV_MODE Flag

Tasks:

- [ ] Remove `EXPO_PUBLIC_DEV_MODE` environment variable
- [ ] Remove mock service conditional loading
- [ ] Remove DevLoginHelper component
- [ ] Clean up mock data files

---

## Phase 24: Payment Integration (Stripe)

**Duration: 1 week**
**Priority: HIGH**

---

### STRIPE SETUP INSTRUCTIONS

#### Step 1: Create Stripe Account

1. Go to <https://dashboard.stripe.com/register>
2. Create an account with your business email
3. Complete business verification (required for live payments)

#### Step 2: Get API Keys

1. Go to <https://dashboard.stripe.com/apikeys>
2. Copy your keys:
   - **Publishable key**: `pk_test_...` (for mobile app)
   - **Secret key**: `sk_test_...` (for backend - NEVER expose this)
3. For production, switch to live keys after testing

#### Step 3: Configure Stripe Dashboard

1. **Products & Pricing** (optional for dynamic pricing):

   - Go to Products → Add Product
   - Create products for common services (Haircut, Beard Trim, etc.)

2. **Webhook Endpoints**:

   - Go to Developers → Webhooks → Add endpoint
   - URL: `https://api.cloudclips.com/api/webhooks/stripe`
   - Events to subscribe:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `customer.created`
     - `charge.refunded`
     - `payment_method.attached`
   - Copy the **Webhook signing secret**: `whsec_...`

3. **Connect for Barbers** (for payouts):
   - Go to Connect → Get started
   - Choose "Express" account type (easiest)
   - Configure payout schedule (daily/weekly)
   - Set platform fee percentage (your commission)

#### Step 4: Environment Variables

Add to `backend/.env`:

```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_CONNECT_CLIENT_ID=ca_your_connect_client_id
```

Add to `mobile/.env`:

```env
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

#### Step 5: Install Dependencies

**Backend (Go):**

```bash
cd backend
go get github.com/stripe/stripe-go/v76
```

**Mobile (React Native):**

```bash
cd mobile
bun add @stripe/stripe-react-native
```

#### Step 6: Configure Expo for Stripe

Update `mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@stripe/stripe-react-native",
        {
          "merchantIdentifier": "merchant.com.cloudclips",
          "enableGooglePay": true
        }
      ]
    ]
  }
}
```

---

### 24.1 Backend Stripe Integration

**File:** `backend/internal/services/stripe.go`

```go
package services

import (
 "github.com/stripe/stripe-go/v76"
 "github.com/stripe/stripe-go/v76/customer"
 "github.com/stripe/stripe-go/v76/paymentintent"
 "github.com/stripe/stripe-go/v76/paymentmethod"
)

type StripeService struct {
 secretKey string
}

func NewStripeService(secretKey string) *StripeService {
 stripe.Key = secretKey
 return &StripeService{secretKey: secretKey}
}

// CreateCustomer creates a Stripe customer for a user
func (s *StripeService) CreateCustomer(email, name string) (*stripe.Customer, error) {
 params := &stripe.CustomerParams{
  Email: stripe.String(email),
  Name:  stripe.String(name),
 }
 return customer.New(params)
}

// CreatePaymentIntent creates a payment intent for an appointment
func (s *StripeService) CreatePaymentIntent(amount int64, currency string, customerID string) (*stripe.PaymentIntent, error) {
 params := &stripe.PaymentIntentParams{
  Amount:   stripe.Int64(amount), // Amount in cents
  Currency: stripe.String(currency),
  Customer: stripe.String(customerID),
  AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
   Enabled: stripe.Bool(true),
  },
 }
 return paymentintent.New(params)
}

// SavePaymentMethod attaches a payment method to a customer
func (s *StripeService) SavePaymentMethod(paymentMethodID, customerID string) (*stripe.PaymentMethod, error) {
 params := &stripe.PaymentMethodAttachParams{
  Customer: stripe.String(customerID),
 }
 return paymentmethod.Attach(paymentMethodID, params)
}

// ListPaymentMethods returns saved payment methods for a customer
func (s *StripeService) ListPaymentMethods(customerID string) ([]*stripe.PaymentMethod, error) {
 params := &stripe.PaymentMethodListParams{
  Customer: stripe.String(customerID),
  Type:     stripe.String("card"),
 }

 var methods []*stripe.PaymentMethod
 i := paymentmethod.List(params)
 for i.Next() {
  methods = append(methods, i.PaymentMethod())
 }
 return methods, i.Err()
}
```

**File:** `backend/internal/handlers/payment.go`

```go
package handlers

import (
 "encoding/json"
 "io"
 "net/http"

 "github.com/stripe/stripe-go/v76/webhook"
)

// CreatePaymentIntent handles POST /api/payments/intent
func (h *Handler) CreatePaymentIntent(w http.ResponseWriter, r *http.Request) {
 var req struct {
  Amount   int64  `json:"amount"`
  Currency string `json:"currency"`
 }

 if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
  http.Error(w, "Invalid request", http.StatusBadRequest)
  return
 }

 // Get customer ID from authenticated user
 userID := r.Context().Value("userID").(string)
 user, _ := h.storage.GetUser(userID)

 intent, err := h.stripe.CreatePaymentIntent(req.Amount, req.Currency, user.StripeCustomerID)
 if err != nil {
  http.Error(w, err.Error(), http.StatusInternalServerError)
  return
 }

 json.NewEncoder(w).Encode(map[string]string{
  "clientSecret": intent.ClientSecret,
  "intentId":     intent.ID,
 })
}

// HandleStripeWebhook handles POST /api/webhooks/stripe
func (h *Handler) HandleStripeWebhook(w http.ResponseWriter, r *http.Request) {
 payload, err := io.ReadAll(r.Body)
 if err != nil {
  http.Error(w, "Error reading body", http.StatusBadRequest)
  return
 }

 sigHeader := r.Header.Get("Stripe-Signature")
 event, err := webhook.ConstructEvent(payload, sigHeader, h.webhookSecret)
 if err != nil {
  http.Error(w, "Invalid signature", http.StatusBadRequest)
  return
 }

 switch event.Type {
 case "payment_intent.succeeded":
  // Update appointment payment status
  var paymentIntent stripe.PaymentIntent
  json.Unmarshal(event.Data.Raw, &paymentIntent)
  h.storage.UpdateAppointmentPayment(paymentIntent.ID, "completed")

 case "payment_intent.payment_failed":
  // Handle failed payment
  var paymentIntent stripe.PaymentIntent
  json.Unmarshal(event.Data.Raw, &paymentIntent)
  h.storage.UpdateAppointmentPayment(paymentIntent.ID, "failed")
 }

 w.WriteHeader(http.StatusOK)
}
```

Tasks:

- [ ] Initialize Stripe client with API key
- [ ] Create Payment Intent endpoint
- [ ] Create Customer endpoint
- [ ] Save payment method endpoint
- [ ] Handle webhooks for payment events
- [ ] Implement refund logic
- [ ] Add payout to barbers (Connect accounts)

```go
// Required endpoints
POST /api/payments/intent        // Create payment intent
POST /api/payments/confirm       // Confirm payment
POST /api/payments/methods       // Save payment method
GET  /api/payments/methods       // List saved methods
POST /api/payments/refund/:id    // Refund payment
POST /api/webhooks/stripe        // Stripe webhook handler
```

---

### 24.2 Frontend Stripe Integration

**File:** `mobile/src/services/stripe/provider.tsx`

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!;

export function StripeProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.cloudclips"
    >
      {children}
    </StripeProvider>
  );
}
```

**File:** `mobile/src/features/payments/services/stripeService.ts`

```typescript
import { useStripe, useConfirmPayment } from "@stripe/stripe-react-native";
import { apiClient } from "@/services/api/client";

export function usePayment() {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { confirmPayment } = useConfirmPayment();

  const processPayment = async (amount: number, appointmentId: string) => {
    // 1. Create payment intent on backend
    const { data } = await apiClient.post("/payments/intent", {
      amount: amount * 100, // Convert to cents
      currency: "usd",
      appointmentId,
    });

    // 2. Initialize payment sheet
    const { error: initError } = await initPaymentSheet({
      paymentIntentClientSecret: data.clientSecret,
      merchantDisplayName: "Cloud Clips",
      defaultBillingDetails: {
        name: "Customer",
      },
    });

    if (initError) {
      throw new Error(initError.message);
    }

    // 3. Present payment sheet
    const { error: presentError } = await presentPaymentSheet();

    if (presentError) {
      throw new Error(presentError.message);
    }

    return { success: true, paymentIntentId: data.intentId };
  };

  const saveCard = async (paymentMethodId: string) => {
    const { data } = await apiClient.post("/payments/methods", {
      paymentMethodId,
    });
    return data;
  };

  const getSavedCards = async () => {
    const { data } = await apiClient.get("/payments/methods");
    return data;
  };

  return {
    processPayment,
    saveCard,
    getSavedCards,
  };
}
```

Tasks:

- [ ] Initialize Stripe with publishable key
- [ ] Implement `confirmPayment` flow
- [ ] Handle 3D Secure authentication
- [ ] Show payment sheet
- [ ] Save cards for future use
- [ ] Display payment confirmation

---

### 24.3 Checkout Flow

**File:** `mobile/src/app/(client)/booking/checkout.tsx`

```typescript
import { usePayment } from '@/features/payments/services/stripeService';

export default function CheckoutScreen() {
  const { processPayment } = usePayment();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      const result = await processPayment(totalAmount, appointmentId);
      if (result.success) {
        // Navigate to confirmation
        router.push('/booking/confirmation');
      }
    } catch (error) {
      Alert.alert('Payment Failed', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    // ... checkout UI
    <Button onPress={handlePayment} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : `Pay $${totalAmount}`}
    </Button>
  );
}
```

Tasks:

- [ ] Fetch payment intent from backend
- [ ] Display price breakdown
- [ ] Implement coupon application
- [ ] Show saved payment methods
- [ ] Add new card option
- [ ] Handle payment success/failure
- [ ] Navigate to confirmation screen

---

### 24.4 Testing Stripe Payments

Use these test card numbers in development:

| Card Number         | Scenario                      |
| ------------------- | ----------------------------- |
| 4242 4242 4242 4242 | Successful payment            |
| 4000 0000 0000 3220 | 3D Secure required            |
| 4000 0000 0000 9995 | Declined (insufficient funds) |
| 4000 0000 0000 0002 | Declined (generic)            |

- Use any future expiry date (e.g., 12/34)
- Use any 3-digit CVC (e.g., 123)
- Use any 5-digit ZIP code (e.g., 12345)

---

## Phase 25: Real-Time Features & Firebase

**Duration: 1 week**
**Priority: MEDIUM**

---

### FIREBASE SETUP INSTRUCTIONS

#### Step 1: Create Firebase Project

1. Go to <https://console.firebase.google.com/>
2. Click "Add project"
3. Name it `cloud-clips` (or your preferred name)
4. Disable Google Analytics (optional, can enable later)
5. Click "Create project"

#### Step 2: Add Apps to Firebase

**For Android:**

1. Click the Android icon in Project Overview
2. Android package name: `com.cloudclips.app`
3. App nickname: `Cloud Clips Android`
4. Debug signing certificate: (optional for now)
5. Download `google-services.json`
6. Place it in `mobile/` directory

**For iOS:**

1. Click the iOS icon in Project Overview
2. iOS bundle ID: `com.cloudclips.app`
3. App nickname: `Cloud Clips iOS`
4. Download `GoogleService-Info.plist`
5. Place it in `mobile/ios/` directory (after expo prebuild)

#### Step 3: Enable Authentication

1. Go to Build → Authentication → Get started
2. Sign-in method → Enable the following:
   - **Email/Password**: Enable (also enable Email link if desired)
   - **Google**: Enable → Configure OAuth consent screen
   - **Apple**: Enable → Requires Apple Developer account
   - **Phone**: Enable (for OTP verification)

**Google OAuth Setup:**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Configure OAuth consent screen:
   - User Type: External
   - App name: Cloud Clips
   - Support email: your email
   - Add scopes: email, profile
3. Create OAuth 2.0 Client ID:
   - For Web (used by Expo)
   - For Android (with SHA-1 fingerprint)
   - For iOS (with bundle ID)

**Apple Sign-In Setup:**

1. Apple Developer Portal → Identifiers
2. Create App ID with Sign In with Apple capability
3. Create Service ID for web
4. Create Key for Apple Sign In
5. Add configuration to Firebase

#### Step 4: Enable Cloud Messaging (FCM)

1. Go to Project Settings → Cloud Messaging
2. Note the **Server Key** (for backend)
3. For iOS: Upload APNs authentication key
   - Apple Developer → Keys → Create new key
   - Enable Apple Push Notifications service (APNs)
   - Download the .p8 file
   - Upload to Firebase Cloud Messaging

#### Step 5: Enable Firestore (for real-time chat)

1. Go to Build → Firestore Database → Create database
2. Start in test mode (configure rules later)
3. Choose region closest to your users

**Security Rules (add after testing):**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Chat messages - only participants can read/write
    match /chats/{appointmentId}/messages/{messageId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.senderId ||
         request.auth.uid == resource.data.receiverId);
    }

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

#### Step 6: Enable Storage (for images)

1. Go to Build → Storage → Get started
2. Start in test mode
3. Choose same region as Firestore

**Security Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile avatars
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Barber gallery
    match /gallery/{barberId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == barberId;
    }

    // Product images (barbers only)
    match /products/{productId}/{fileName} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

#### Step 7: Get Service Account for Backend

1. Go to Project Settings → Service accounts
2. Click "Generate new private key"
3. Download JSON file
4. Rename to `firebase-admin-sdk.json`
5. Place in `backend/` directory (add to .gitignore!)

#### Step 8: Environment Variables

Add to `mobile/.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cloud-clips.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cloud-clips
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cloud-clips.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Add to `backend/.env`:

```env
FIREBASE_PROJECT_ID=cloud-clips
FIREBASE_CREDENTIALS_FILE=./firebase-admin-sdk.json
FCM_SERVER_KEY=your_server_key
```

#### Step 9: Install Dependencies

**Mobile (already installed, verify):**

```bash
cd mobile
bun add firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/messaging
```

**Backend (Go):**

```bash
cd backend
go get firebase.google.com/go/v4
go get firebase.google.com/go/v4/auth
go get firebase.google.com/go/v4/messaging
```

#### Step 10: Configure Expo for Firebase

Update `mobile/app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

---

### 25.1 Firebase Authentication Integration

**File:** `mobile/src/services/firebase/auth.ts`

```typescript
import auth from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";

// Initialize Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export const firebaseAuth = {
  // Email/Password Sign Up
  async signUpWithEmail(email: string, password: string, name: string) {
    const userCredential = await auth().createUserWithEmailAndPassword(
      email,
      password,
    );
    await userCredential.user.updateProfile({ displayName: name });
    return userCredential.user;
  },

  // Email/Password Sign In
  async signInWithEmail(email: string, password: string) {
    const userCredential = await auth().signInWithEmailAndPassword(
      email,
      password,
    );
    return userCredential.user;
  },

  // Google Sign In
  async signInWithGoogle() {
    await GoogleSignin.hasPlayServices();
    const { idToken } = await GoogleSignin.signIn();
    const googleCredential = auth.GoogleAuthProvider.credential(idToken);
    const userCredential = await auth().signInWithCredential(googleCredential);
    return userCredential.user;
  },

  // Apple Sign In
  async signInWithApple() {
    const appleCredential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { identityToken } = appleCredential;
    const provider = new auth.OAuthProvider("apple.com");
    const credential = provider.credential({
      idToken: identityToken!,
      rawNonce: appleCredential.nonce,
    });

    const userCredential = await auth().signInWithCredential(credential);
    return userCredential.user;
  },

  // Password Reset
  async sendPasswordResetEmail(email: string) {
    await auth().sendPasswordResetEmail(email);
  },

  // Sign Out
  async signOut() {
    await auth().signOut();
    await GoogleSignin.signOut();
  },

  // Get ID Token for backend API calls
  async getIdToken() {
    const user = auth().currentUser;
    if (!user) return null;
    return user.getIdToken();
  },

  // Auth state listener
  onAuthStateChanged(callback: (user: any) => void) {
    return auth().onAuthStateChanged(callback);
  },
};
```

**File:** `mobile/src/features/auth/hooks/useAuth.ts` (update)

```typescript
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { firebaseAuth } from "@/services/firebase/auth";
import { authAtom, userAtom } from "@/store/atoms";
import { apiClient } from "@/services/api/client";

export function useAuth() {
  const [auth, setAuth] = useAtom(authAtom);
  const [user, setUser] = useAtom(userAtom);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(
      async (firebaseUser) => {
        if (firebaseUser) {
          // Get ID token and sync with backend
          const token = await firebaseUser.getIdToken();

          // Store token for API calls
          apiClient.defaults.headers.common["Authorization"] =
            `Bearer ${token}`;

          // Fetch or create user in backend
          try {
            const { data } = await apiClient.get("/auth/me");
            setUser(data);
            setAuth({ isAuthenticated: true, token });
          } catch (error) {
            // User doesn't exist in backend, create them
            const { data } = await apiClient.post("/auth/firebase-sync", {
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              avatar: firebaseUser.photoURL,
            });
            setUser(data);
            setAuth({ isAuthenticated: true, token });
          }
        } else {
          setAuth({ isAuthenticated: false, token: null });
          setUser(null);
        }
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const user = await firebaseAuth.signInWithEmail(email, password);
    return user;
  };

  const loginWithGoogle = async () => {
    const user = await firebaseAuth.signInWithGoogle();
    return user;
  };

  const loginWithApple = async () => {
    const user = await firebaseAuth.signInWithApple();
    return user;
  };

  const register = async (email: string, password: string, name: string) => {
    const user = await firebaseAuth.signUpWithEmail(email, password, name);
    return user;
  };

  const logout = async () => {
    await firebaseAuth.signOut();
  };

  return {
    user,
    isLoading,
    isAuthenticated: auth.isAuthenticated,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    logout,
  };
}
```

---

### 25.2 Push Notifications (FCM)

**File:** `mobile/src/services/firebase/messaging.ts`

```typescript
import messaging from "@react-native-firebase/messaging";
import { PermissionsAndroid, Platform } from "react-native";
import { apiClient } from "@/services/api/client";

export const fcmService = {
  async requestPermission() {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    return enabled;
  },

  async getToken() {
    const token = await messaging().getToken();
    return token;
  },

  async registerTokenWithBackend() {
    const token = await this.getToken();
    await apiClient.post("/notifications/token", { token });
  },

  // Handle foreground messages
  onMessage(callback: (message: any) => void) {
    return messaging().onMessage(callback);
  },

  // Handle background messages
  setBackgroundMessageHandler(handler: (message: any) => Promise<void>) {
    messaging().setBackgroundMessageHandler(handler);
  },

  // Handle notification tap
  onNotificationOpenedApp(callback: (message: any) => void) {
    return messaging().onNotificationOpenedApp(callback);
  },

  // Check if app was opened from notification
  async getInitialNotification() {
    return messaging().getInitialNotification();
  },
};
```

**File:** `backend/internal/services/firebase.go`

```go
package services

import (
 "context"

 firebase "firebase.google.com/go/v4"
 "firebase.google.com/go/v4/auth"
 "firebase.google.com/go/v4/messaging"
 "google.golang.org/api/option"
)

type FirebaseService struct {
 app       *firebase.App
 auth      *auth.Client
 messaging *messaging.Client
}

func NewFirebaseService(credentialsFile string) (*FirebaseService, error) {
 opt := option.WithCredentialsFile(credentialsFile)
 app, err := firebase.NewApp(context.Background(), nil, opt)
 if err != nil {
  return nil, err
 }

 authClient, err := app.Auth(context.Background())
 if err != nil {
  return nil, err
 }

 msgClient, err := app.Messaging(context.Background())
 if err != nil {
  return nil, err
 }

 return &FirebaseService{
  app:       app,
  auth:      authClient,
  messaging: msgClient,
 }, nil
}

// VerifyIDToken verifies a Firebase ID token from the mobile app
func (f *FirebaseService) VerifyIDToken(idToken string) (*auth.Token, error) {
 return f.auth.VerifyIDToken(context.Background(), idToken)
}

// SendNotification sends a push notification to a device
func (f *FirebaseService) SendNotification(token, title, body string, data map[string]string) error {
 message := &messaging.Message{
  Token: token,
  Notification: &messaging.Notification{
   Title: title,
   Body:  body,
  },
  Data: data,
 }

 _, err := f.messaging.Send(context.Background(), message)
 return err
}

// SendMulticastNotification sends to multiple devices
func (f *FirebaseService) SendMulticastNotification(tokens []string, title, body string, data map[string]string) error {
 message := &messaging.MulticastMessage{
  Tokens: tokens,
  Notification: &messaging.Notification{
   Title: title,
   Body:  body,
  },
  Data: data,
 }

 _, err := f.messaging.SendMulticast(context.Background(), message)
 return err
}
```

---

### 25.3 Real-Time Chat with Firestore

**File:** `mobile/src/services/firebase/chat.ts`

```typescript
import firestore from "@react-native-firebase/firestore";

export interface ChatMessage {
  id: string;
  appointmentId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  readAt?: Date;
}

export const chatService = {
  // Subscribe to messages for an appointment
  subscribeToMessages(
    appointmentId: string,
    callback: (messages: ChatMessage[]) => void,
  ) {
    return firestore()
      .collection("chats")
      .doc(appointmentId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          readAt: doc.data().readAt?.toDate(),
        })) as ChatMessage[];
        callback(messages);
      });
  },

  // Send a message
  async sendMessage(
    appointmentId: string,
    senderId: string,
    receiverId: string,
    content: string,
  ) {
    await firestore()
      .collection("chats")
      .doc(appointmentId)
      .collection("messages")
      .add({
        senderId,
        receiverId,
        content,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
  },

  // Mark messages as read
  async markAsRead(appointmentId: string, userId: string) {
    const batch = firestore().batch();
    const unreadMessages = await firestore()
      .collection("chats")
      .doc(appointmentId)
      .collection("messages")
      .where("receiverId", "==", userId)
      .where("readAt", "==", null)
      .get();

    unreadMessages.docs.forEach((doc) => {
      batch.update(doc.ref, { readAt: firestore.FieldValue.serverTimestamp() });
    });

    await batch.commit();
  },

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<number> {
    const snapshot = await firestore()
      .collectionGroup("messages")
      .where("receiverId", "==", userId)
      .where("readAt", "==", null)
      .count()
      .get();

    return snapshot.data().count;
  },
};
```

---

### 25.4 WebSocket Server (Alternative to Firestore)

If you prefer WebSocket over Firestore for chat:

**File:** `backend/internal/websocket/hub.go`

```go
package websocket

import (
 "encoding/json"
 "log"
 "net/http"
 "sync"

 "github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
 CheckOrigin: func(r *http.Request) bool {
  return true // Configure properly in production
 },
}

type Client struct {
 UserID string
 Conn   *websocket.Conn
 Send   chan []byte
}

type Hub struct {
 clients    map[string]*Client
 broadcast  chan []byte
 register   chan *Client
 unregister chan *Client
 mutex      sync.RWMutex
}

func NewHub() *Hub {
 return &Hub{
  clients:    make(map[string]*Client),
  broadcast:  make(chan []byte),
  register:   make(chan *Client),
  unregister: make(chan *Client),
 }
}

func (h *Hub) Run() {
 for {
  select {
  case client := <-h.register:
   h.mutex.Lock()
   h.clients[client.UserID] = client
   h.mutex.Unlock()

  case client := <-h.unregister:
   h.mutex.Lock()
   if _, ok := h.clients[client.UserID]; ok {
    delete(h.clients, client.UserID)
    close(client.Send)
   }
   h.mutex.Unlock()

  case message := <-h.broadcast:
   h.mutex.RLock()
   for _, client := range h.clients {
    select {
    case client.Send <- message:
    default:
     close(client.Send)
     delete(h.clients, client.UserID)
    }
   }
   h.mutex.RUnlock()
  }
 }
}

// SendToUser sends a message to a specific user
func (h *Hub) SendToUser(userID string, message []byte) {
 h.mutex.RLock()
 defer h.mutex.RUnlock()

 if client, ok := h.clients[userID]; ok {
  client.Send <- message
 }
}

// HandleWebSocket handles new WebSocket connections
func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
 // Authenticate user from token
 userID := r.URL.Query().Get("userId") // Replace with proper auth

 conn, err := upgrader.Upgrade(w, r, nil)
 if err != nil {
  log.Printf("WebSocket upgrade error: %v", err)
  return
 }

 client := &Client{
  UserID: userID,
  Conn:   conn,
  Send:   make(chan []byte, 256),
 }

 h.register <- client

 go client.writePump()
 go client.readPump(h)
}
```

---

### 25.5 Notification Types & Handlers

**File:** `mobile/src/services/notifications/handlers.ts`

```typescript
import { fcmService } from "@/services/firebase/messaging";
import { router } from "expo-router";

type NotificationType =
  | "appointment_reminder"
  | "appointment_confirmed"
  | "appointment_cancelled"
  | "new_message"
  | "payment_received"
  | "promo";

interface NotificationData {
  type: NotificationType;
  appointmentId?: string;
  barberId?: string;
  orderId?: string;
}

export function setupNotificationHandlers() {
  // Handle foreground notifications
  fcmService.onMessage((message) => {
    const data = message.data as NotificationData;

    // Show in-app notification
    showInAppNotification({
      title: message.notification?.title,
      body: message.notification?.body,
      onPress: () => handleNotificationPress(data),
    });
  });

  // Handle notification tap when app is in background
  fcmService.onNotificationOpenedApp((message) => {
    const data = message.data as NotificationData;
    handleNotificationPress(data);
  });

  // Check if app was opened from notification
  fcmService.getInitialNotification().then((message) => {
    if (message) {
      const data = message.data as NotificationData;
      handleNotificationPress(data);
    }
  });
}

function handleNotificationPress(data: NotificationData) {
  switch (data.type) {
    case "appointment_reminder":
    case "appointment_confirmed":
    case "appointment_cancelled":
      router.push(`/appointments/${data.appointmentId}`);
      break;
    case "new_message":
      router.push(`/chat/${data.appointmentId}`);
      break;
    case "payment_received":
      router.push(`/orders/${data.orderId}`);
      break;
    case "promo":
      router.push("/coupons");
      break;
  }
}
```

Tasks:

- [ ] Implement WebSocket hub for connections
- [ ] User authentication for WebSocket
- [ ] Chat message broadcasting
- [ ] Appointment status updates
- [ ] Notification delivery
- [ ] Connection health checks
- [ ] Reconnection handling

---

## Phase 26: Admin Dashboard

**Duration: 2 weeks**
**Priority: LOW (Phase 2 release)**

### 26.1 Admin API Endpoints

```go
// Admin-only endpoints
GET    /api/admin/dashboard/stats   // Dashboard statistics
GET    /api/admin/users             // List all users
PUT    /api/admin/users/:id/role    // Change user role
PUT    /api/admin/users/:id/ban     // Ban/unban user
GET    /api/admin/barbers/pending   // Pending verifications
PUT    /api/admin/barbers/:id/verify // Verify barber
GET    /api/admin/appointments      // All appointments
GET    /api/admin/orders            // All orders
GET    /api/admin/revenue           // Revenue reports
POST   /api/admin/notifications/broadcast // Send to all users
```

### 26.2 Web Admin Panel (Optional)

A separate web application for administrators:

- User management
- Barber verification
- Payment oversight
- Analytics dashboard
- Content moderation
- Coupon management
- Support tickets

---

## Phase 27: Testing & QA

**Duration: 2 weeks**
**Priority: HIGH**

### 27.1 Backend Testing

Tasks:

- [ ] Unit tests for all handlers
- [ ] Integration tests for API endpoints
- [ ] Database migration tests
- [ ] Payment flow tests (Stripe test mode)
- [ ] WebSocket connection tests
- [ ] Load testing with k6 or artillery

### 27.2 Frontend Testing

Tasks:

- [ ] Update existing tests for real API
- [ ] Add integration tests for auth flow
- [ ] Add integration tests for booking flow
- [ ] Add integration tests for payment flow
- [ ] E2E tests with Maestro (update flows)
- [ ] Accessibility testing

### 27.3 Manual Testing Checklist

- [ ] Complete signup flow (email, Google, Apple)
- [ ] Complete login/logout flow
- [ ] Password reset flow
- [ ] Browse and search barbers
- [ ] View barber profile
- [ ] Complete booking flow
- [ ] Payment processing
- [ ] Cancel/reschedule appointment
- [ ] Chat with barber
- [ ] Browse products
- [ ] Add to cart and checkout
- [ ] View order history
- [ ] Apply coupons
- [ ] Update profile
- [ ] Notification settings
- [ ] Offline mode behavior
- [ ] Deep link handling
- [ ] Push notifications

---

## Phase 28: Production Deployment

**Duration: 1 week**
**Priority: HIGH**

### 28.1 Backend Deployment

Tasks:

- [ ] Dockerize the Go application
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Deploy to cloud provider (AWS/GCP/DO)
- [ ] Set up PostgreSQL managed instance
- [ ] Set up Redis for caching
- [ ] Configure SSL certificates
- [ ] Set up domain and DNS
- [ ] Configure auto-scaling
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Set up logging (Loki/ELK)
- [ ] Set up alerting

### 28.2 Mobile App Release

Tasks:

- [ ] Replace all placeholder assets
- [ ] Update app version and build numbers
- [ ] Generate production builds
- [ ] Submit to Google Play Console
- [ ] Submit to Apple App Store
- [ ] Prepare store listings
- [ ] Create screenshots and preview videos
- [ ] Write app descriptions
- [ ] Set up crash reporting (Sentry)
- [ ] Set up analytics (Mixpanel/Firebase)

### 28.3 Environment Configuration

**Mobile App (`mobile/.env`):**

```env
# API
EXPO_PUBLIC_API_BASE_URL=https://api.cloudclips.com

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=xxx
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=cloudclips-prod.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=cloudclips-prod
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=cloudclips-prod.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Google (for OAuth)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=xxx.apps.googleusercontent.com

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=xxx

# Sentry (Error Tracking)
EXPO_PUBLIC_SENTRY_DSN=xxx
```

**Backend (`backend/.env`):**

```env
# Server
PORT=8080
ENVIRONMENT=production

# Database
DATABASE_URL=postgres://user:pass@host:5432/cloudclips?sslmode=require

# Redis
REDIS_URL=redis://user:pass@host:6379

# JWT
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# Stripe
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

# Email (for notifications)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=xxx
FROM_EMAIL=noreply@cloudclips.com

# Sentry
SENTRY_DSN=xxx
```

---

## Implementation Timeline Summary

| Phase | Description                  | Duration | Priority |
| ----- | ---------------------------- | -------- | -------- |
| 19    | Complete Stub Screens        | 1 week   | HIGH     |
| 20    | Profile Sub-Screens          | 1 week   | MEDIUM   |
| 21    | Backend REST API Layer       | 2 weeks  | CRITICAL |
| 22    | Database Persistence         | 1 week   | CRITICAL |
| 23    | Frontend-Backend Integration | 2 weeks  | CRITICAL |
| 24    | Payment Integration          | 1 week   | HIGH     |
| 25    | Real-Time Features           | 1 week   | MEDIUM   |
| 26    | Admin Dashboard              | 2 weeks  | LOW      |
| 27    | Testing & QA                 | 2 weeks  | HIGH     |
| 28    | Production Deployment        | 1 week   | HIGH     |

**Total Estimated Time: 14 weeks (3.5 months)**

---

## Quick Wins (Can Start Immediately)

1. **Complete stub screens** (Phase 19) - No backend dependency
2. **Profile sub-screens** (Phase 20) - UI only, mock data
3. **Database setup** (Phase 22.1-22.2) - Independent of API work

## Critical Path

The critical path for production is:

1. Phase 21 (REST API) → Phase 22 (Database) → Phase 23 (Integration)
2. Phase 24 (Payments) can run parallel to Phase 23
3. Phase 27 (Testing) must wait for Phase 23 completion

---

## Files to Create/Modify Summary

### New Files (Mobile)

```
mobile/src/app/(client)/profile/payment-methods.tsx
mobile/src/app/(client)/profile/addresses.tsx
mobile/src/app/(client)/profile/notifications.tsx
mobile/src/app/(client)/profile/settings.tsx
mobile/src/app/(client)/profile/help.tsx
mobile/src/app/(client)/profile/orders.tsx
```

### Modified Files (Mobile)

```
mobile/src/app/(client)/appointments/index.tsx  (expand from stub)
mobile/src/app/(client)/coupons.tsx             (expand from stub)
mobile/src/services/api/client.ts               (real API config)
mobile/src/features/auth/services/authService.ts
mobile/src/features/barbers/services/barberService.ts
mobile/src/features/bookings/services/bookingService.ts
mobile/src/features/chat/services/chatService.ts
mobile/src/features/payments/services/stripeService.ts
```

### New Files (Backend)

```
backend/internal/handlers/auth.go
backend/internal/handlers/product.go
backend/internal/handlers/order.go
backend/internal/handlers/coupon.go
backend/internal/handlers/chat.go
backend/internal/handlers/notification.go
backend/internal/services/stripe.go
backend/internal/services/notifications.go
backend/internal/storage/postgres.go
backend/internal/websocket/hub.go
backend/migrations/*.sql
```

### Modified Files (Backend)

```
backend/cmd/main.go                 (add routes)
backend/internal/middleware/middleware.go (JWT validation)
backend/internal/handlers/user.go   (extend)
backend/internal/handlers/barber.go (extend)
backend/internal/handlers/appointment.go (extend)
```

---

## Success Criteria

The project is complete when:

1. All screens are fully functional (no stubs/TODOs)
2. App connects to real backend (no mock services in production)
3. Users can register, login, and manage profiles
4. Users can search, book, and pay for appointments
5. Barbers can manage schedules, appointments, and earnings
6. Real-time chat works between users and barbers
7. Push notifications are received
8. App is published on App Store and Play Store
9. Backend is deployed and scaled appropriately
10. Monitoring and alerting are in place

---

## Appendix A: Firebase Quick Reference

### Console Links

- Firebase Console: <https://console.firebase.google.com/project/cloud-clips>
- Authentication: <https://console.firebase.google.com/project/cloud-clips/authentication>
- Firestore: <https://console.firebase.google.com/project/cloud-clips/firestore>
- Storage: <https://console.firebase.google.com/project/cloud-clips/storage>
- Cloud Messaging: <https://console.firebase.google.com/project/cloud-clips/messaging>

### Required Files

| File                       | Location      | Purpose                 |
| -------------------------- | ------------- | ----------------------- |
| `google-services.json`     | `mobile/`     | Android Firebase config |
| `GoogleService-Info.plist` | `mobile/ios/` | iOS Firebase config     |
| `firebase-admin-sdk.json`  | `backend/`    | Backend admin access    |

### Firebase Services Used

| Service         | Purpose                           | Phase |
| --------------- | --------------------------------- | ----- |
| Authentication  | User login (Email, Google, Apple) | 23    |
| Cloud Messaging | Push notifications                | 25    |
| Firestore       | Real-time chat                    | 25    |
| Storage         | Image uploads                     | 23    |

### Common Firebase Commands

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in project
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage

# View project settings
firebase projects:list
```

---

## Appendix B: Stripe Quick Reference

### Dashboard Links

- Stripe Dashboard: <https://dashboard.stripe.com>
- API Keys: <https://dashboard.stripe.com/apikeys>
- Webhooks: <https://dashboard.stripe.com/webhooks>
- Connect: <https://dashboard.stripe.com/connect/accounts>
- Test Mode: <https://dashboard.stripe.com/test>

### Required Keys

| Key                          | Location       | Environment |
| ---------------------------- | -------------- | ----------- |
| Publishable Key (`pk_test_`) | `mobile/.env`  | Development |
| Publishable Key (`pk_live_`) | `mobile/.env`  | Production  |
| Secret Key (`sk_test_`)      | `backend/.env` | Development |
| Secret Key (`sk_live_`)      | `backend/.env` | Production  |
| Webhook Secret (`whsec_`)    | `backend/.env` | Both        |

### Webhook Events to Subscribe

```
payment_intent.succeeded
payment_intent.payment_failed
customer.created
customer.updated
charge.refunded
payment_method.attached
payment_method.detached
account.updated (for Connect)
```

### Test Cards

| Card Number         | Result             |
| ------------------- | ------------------ |
| 4242 4242 4242 4242 | Success            |
| 4000 0000 0000 3220 | 3D Secure required |
| 4000 0000 0000 9995 | Insufficient funds |
| 4000 0000 0000 0002 | Generic decline    |

### Common Stripe CLI Commands

```bash
# Install Stripe CLI
# macOS: brew install stripe/stripe-cli/stripe
# Others: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8080/api/webhooks/stripe

# Trigger test webhook
stripe trigger payment_intent.succeeded

# View recent events
stripe events list --limit 10
```

---

## Appendix C: Deployment Checklist

### Before Going Live

#### Stripe

- [ ] Complete Stripe business verification
- [ ] Switch from test keys to live keys
- [ ] Update webhook endpoints to production URL
- [ ] Test a real payment ($1.00)
- [ ] Configure payout schedule

#### Firebase

- [ ] Enable App Check for security
- [ ] Configure proper Firestore rules
- [ ] Configure proper Storage rules
- [ ] Upload APNs key for iOS push
- [ ] Test push notifications on real devices

#### Backend

- [ ] Enable HTTPS only
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Remove debug logging

#### Mobile App

- [ ] Remove all DEV_MODE code
- [ ] Update all environment variables
- [ ] Test deep links
- [ ] Test offline mode
- [ ] Verify analytics tracking

---

## Appendix D: Useful Commands

### Development

```bash
# Start mobile app
cd mobile && bun dev

# Start backend
cd backend && go run cmd/main.go

# Run mobile tests
cd mobile && bun test

# Run backend tests
cd backend && go test ./...

# Lint mobile code
cd mobile && bun lint

# Format code
cd mobile && bun format
```

### Database

```bash
# Create migration
migrate create -ext sql -dir migrations -seq create_users

# Run migrations
migrate -database $DATABASE_URL -path migrations up

# Rollback migration
migrate -database $DATABASE_URL -path migrations down 1

# Check migration status
migrate -database $DATABASE_URL -path migrations version
```

### Deployment

```bash
# Build mobile app (EAS)
eas build --platform all --profile production

# Submit to stores
eas submit --platform all

# Build backend Docker image
docker build -t cloudclips-api .

# Deploy to Kubernetes
kubectl apply -f k8s/
```
