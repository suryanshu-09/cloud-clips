# Polar.sh Migration Plan

## Overview

This document outlines the plan to migrate Cloud Clips from **Stripe** to **Polar.sh** as the payment processing solution.

### Why Polar.sh?

| Feature | Stripe | Polar.sh |
|---------|--------|----------|
| Transaction Fees | 2.9% + 30¢ | 4% + 40¢ (includes Stripe fees) |
| Merchant of Record | No (you handle taxes) | Yes (handles VAT, GST, sales tax) |
| Tax Compliance | Manual | Automatic worldwide |
| Monthly Fees | None | None |
| Setup Complexity | High | Low |
| Connect (Payouts) | Yes (complex setup) | Manual payouts required |

### Key Consideration: Stripe Connect Replacement

**Important**: Polar.sh does NOT have a direct equivalent to Stripe Connect for marketplace payouts. Cloud Clips uses Stripe Connect to automatically pay barbers. With Polar.sh, we have two options:

1. **Hybrid Approach** (Recommended): Use Polar.sh for customer payments, implement manual payout system to barbers
2. **Platform as Intermediary**: Collect all payments via Polar, manually transfer to barbers via bank transfer/PayPal

---

## Current Stripe Integration Summary

### Backend (Go)
- **File**: `backend/internal/services/stripe.go` (715 lines)
- **File**: `backend/internal/handlers/payment.go` (892 lines)
- **File**: `backend/internal/handlers/barber.go` (Stripe Connect endpoints)

### Mobile App (React Native)
- **File**: `mobile/src/services/stripe/provider.tsx`
- **File**: `mobile/src/features/payments/services/stripeService.ts` (423 lines)
- **File**: `mobile/src/features/payments/services/paymentService.ts`
- **File**: `mobile/src/features/earnings/services/earningsService.ts`
- **File**: `mobile/src/app/(client)/booking/checkout.tsx`
- **File**: `mobile/src/app/(client)/profile/payment-methods.tsx`

### Current Stripe Features Used
1. **Customer Management** - Create/update Stripe customers
2. **Payment Intents** - Process payments
3. **Payment Methods** - Save/manage cards
4. **Refunds** - Issue full/partial refunds
5. **Stripe Connect** - Barber payouts (Express accounts)
6. **Webhooks** - Payment status updates

---

## Migration Phases

### Phase 1: Setup & Planning (1-2 days)

#### 1.1 Create Polar.sh Account
- [ ] Sign up at https://polar.sh/signup
- [ ] Create organization for Cloud Clips
- [ ] Generate Organization Access Token (OAT)
- [ ] Set up Sandbox environment for testing

#### 1.2 Environment Configuration
```bash
# Backend (.env)
POLAR_ACCESS_TOKEN=polar_oat_xxx
POLAR_ORGANIZATION_ID=xxx
POLAR_WEBHOOK_SECRET=xxx
POLAR_SANDBOX=true  # Set to false for production

# Mobile (.env)
EXPO_PUBLIC_POLAR_CHECKOUT_URL=https://polar.sh/checkout/xxx
```

#### 1.3 Define Products in Polar Dashboard
- [ ] Create products for each service type (haircut, beard trim, etc.)
- [ ] Set up pricing tiers
- [ ] Configure custom fields for appointment metadata

---

### Phase 2: Backend Migration (3-5 days)

#### 2.1 Create Polar Service (`backend/internal/services/polar.go`)

```go
package services

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

type PolarService struct {
    accessToken    string
    organizationID string
    baseURL        string
    webhookSecret  string
}

func NewPolarService() *PolarService {
    baseURL := "https://api.polar.sh/v1"
    if os.Getenv("POLAR_SANDBOX") == "true" {
        baseURL = "https://sandbox-api.polar.sh/v1"
    }
    
    return &PolarService{
        accessToken:    os.Getenv("POLAR_ACCESS_TOKEN"),
        organizationID: os.Getenv("POLAR_ORGANIZATION_ID"),
        baseURL:        baseURL,
        webhookSecret:  os.Getenv("POLAR_WEBHOOK_SECRET"),
    }
}

// Customer Management
func (s *PolarService) CreateCustomer(email, name string, metadata map[string]string) (*PolarCustomer, error)
func (s *PolarService) GetCustomer(customerID string) (*PolarCustomer, error)
func (s *PolarService) UpdateCustomer(customerID string, updates map[string]interface{}) error

// Checkout Sessions
func (s *PolarService) CreateCheckoutSession(req *CreateCheckoutRequest) (*CheckoutSession, error)
func (s *PolarService) GetCheckoutSession(sessionID string) (*CheckoutSession, error)

// Orders
func (s *PolarService) GetOrder(orderID string) (*Order, error)
func (s *PolarService) ListOrders(customerID string) ([]Order, error)

// Refunds
func (s *PolarService) CreateRefund(orderID string, amount int64, reason string) (*Refund, error)

// Webhooks
func (s *PolarService) ValidateWebhook(payload []byte, signature string) (bool, error)
```

#### 2.2 Create Polar Handler (`backend/internal/handlers/polar_payment.go`)

**New API Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/checkout` | Create checkout session |
| GET | `/api/payments/checkout/:id` | Get checkout status |
| GET | `/api/payments/orders` | List customer orders |
| GET | `/api/payments/orders/:id` | Get order details |
| POST | `/api/payments/refund` | Request refund |
| POST | `/api/webhooks/polar` | Handle Polar webhooks |

#### 2.3 Webhook Handler Implementation

```go
func (h *PaymentHandler) HandlePolarWebhook(c *gin.Context) {
    // Validate signature using Standard Webhooks spec
    
    // Handle events:
    // - checkout.created
    // - checkout.updated
    // - order.created
    // - order.paid
    // - order.refunded
    // - customer.created
    // - customer.updated
    // - refund.created
    // - refund.updated
}
```

#### 2.4 Database Schema Updates

```sql
-- Add Polar customer ID to users
ALTER TABLE users ADD COLUMN polar_customer_id VARCHAR(255);

-- Create orders table for Polar orders
CREATE TABLE polar_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    polar_order_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id),
    appointment_id UUID REFERENCES appointments(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create barber payouts table (manual payout tracking)
CREATE TABLE barber_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barber_id UUID REFERENCES barbers(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    payout_method VARCHAR(50), -- bank_transfer, paypal, venmo
    payout_reference VARCHAR(255),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

---

### Phase 3: Mobile App Migration (3-5 days)

#### 3.1 Remove Stripe Dependencies

```bash
# Remove Stripe package
cd mobile
bun remove @stripe/stripe-react-native
```

#### 3.2 Install Polar Checkout

```bash
bun add @polar-sh/checkout
```

#### 3.3 Create Polar Service (`mobile/src/services/polar/`)

**File Structure:**
```
mobile/src/services/polar/
├── index.ts
├── polarService.ts
├── types.ts
└── hooks/
    └── usePolarCheckout.ts
```

#### 3.4 Polar Service Implementation

```typescript
// mobile/src/services/polar/polarService.ts
import { PolarEmbedCheckout } from '@polar-sh/checkout/embed';

export const polarService = {
  async createCheckoutSession(appointmentId: string, amount: number) {
    const response = await api.post('/payments/checkout', {
      appointmentId,
      amount,
    });
    return response.data;
  },

  async openCheckout(checkoutUrl: string) {
    // For React Native, open in WebView or external browser
    return Linking.openURL(checkoutUrl);
  },

  async getOrderStatus(orderId: string) {
    const response = await api.get(`/payments/orders/${orderId}`);
    return response.data;
  },
};
```

#### 3.5 Update Checkout Screen

Replace Stripe Payment Sheet with Polar checkout flow:

```typescript
// mobile/src/app/(client)/booking/checkout.tsx
import { polarService } from '@/services/polar';

const CheckoutScreen = () => {
  const handlePayment = async () => {
    try {
      // Create checkout session via backend
      const { checkoutUrl, sessionId } = await polarService.createCheckoutSession(
        appointmentId,
        totalAmount
      );
      
      // Open Polar checkout (WebView or browser)
      await polarService.openCheckout(checkoutUrl);
      
      // Poll for completion or use deep link callback
      // ...
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };
  
  return (
    // Updated UI without Stripe components
  );
};
```

#### 3.6 Handle Checkout Callbacks

Configure deep linking for checkout success/cancel:

```typescript
// app.json
{
  "expo": {
    "scheme": "cloudclips",
    // ...
  }
}

// Handle deep link: cloudclips://checkout/success?order_id=xxx
```

---

### Phase 4: Barber Payout System (2-3 days)

Since Polar.sh doesn't have Stripe Connect equivalent, implement manual payout tracking:

#### 4.1 Payout Dashboard (Admin)

Create admin interface to:
- View pending barber payouts
- Calculate earnings per barber
- Mark payouts as processed
- Track payout history

#### 4.2 Barber Earnings View

Update barber app to show:
- Pending earnings
- Payout history
- Expected payout dates

#### 4.3 Payout Process

```
1. Customer pays via Polar.sh → Cloud Clips receives funds
2. System tracks barber's share (minus platform fee)
3. Admin reviews weekly/bi-weekly payouts
4. Admin initiates manual transfer (bank/PayPal)
5. System marks payout as completed
```

#### 4.4 Update Earnings Service

```typescript
// mobile/src/features/earnings/services/earningsService.ts
export const earningsService = {
  async getEarnings(barberId: string) {
    return api.get(`/barbers/${barberId}/earnings`);
  },
  
  async getPayoutHistory(barberId: string) {
    return api.get(`/barbers/${barberId}/payouts`);
  },
  
  // Note: No more Stripe Connect dashboard link
  // Barbers see payout info in-app
};
```

---

### Phase 5: Testing (2-3 days)

#### 5.1 Sandbox Testing Checklist

- [ ] Create checkout session
- [ ] Complete test payment
- [ ] Verify webhook delivery
- [ ] Test refund flow
- [ ] Verify customer creation
- [ ] Test order status updates
- [ ] Verify deep link callbacks

#### 5.2 Integration Testing

- [ ] Full booking → payment flow
- [ ] Payment failure handling
- [ ] Refund processing
- [ ] Barber earnings calculation
- [ ] Admin payout workflow

#### 5.3 Mobile Testing

- [ ] iOS checkout flow
- [ ] Android checkout flow
- [ ] Deep link handling
- [ ] Error states

---

### Phase 6: Migration & Go-Live (1-2 days)

#### 6.1 Data Migration

```sql
-- Migrate existing Stripe customers to Polar
-- Run once after Polar customers are created
UPDATE users 
SET polar_customer_id = (
    SELECT polar_id FROM polar_customer_migration 
    WHERE stripe_customer_id = users.stripe_customer_id
)
WHERE stripe_customer_id IS NOT NULL;
```

#### 6.2 Feature Flags

```go
// Gradual rollout
if featureFlags.UsePolar(userID) {
    return polarService.CreateCheckout(...)
} else {
    return stripeService.CreatePaymentIntent(...)
}
```

#### 6.3 Go-Live Checklist

- [ ] Switch Polar to production environment
- [ ] Update environment variables
- [ ] Configure production webhooks
- [ ] Enable wallet payments (request from Polar)
- [ ] Remove feature flags
- [ ] Monitor first transactions

---

## Files to Modify

### Backend

| File | Action |
|------|--------|
| `backend/internal/services/stripe.go` | Keep (for reference), eventually remove |
| `backend/internal/services/polar.go` | **CREATE** |
| `backend/internal/handlers/payment.go` | Modify to use Polar |
| `backend/internal/handlers/barber.go` | Remove Connect endpoints, add payout tracking |
| `backend/internal/models/user.go` | Add `PolarCustomerID` field |
| `backend/cmd/main.go` | Update route registration |
| `backend/migrations/` | Add new migration files |

### Mobile

| File | Action |
|------|--------|
| `mobile/src/services/stripe/` | Remove directory |
| `mobile/src/services/polar/` | **CREATE** directory |
| `mobile/src/features/payments/services/stripeService.ts` | Remove |
| `mobile/src/features/payments/services/polarService.ts` | **CREATE** |
| `mobile/src/features/payments/hooks/usePayment.ts` | Update to use Polar |
| `mobile/src/features/earnings/services/earningsService.ts` | Update (remove Connect) |
| `mobile/src/app/(client)/booking/checkout.tsx` | Major refactor |
| `mobile/src/app/(client)/profile/payment-methods.tsx` | Simplify (Polar handles saved methods) |
| `mobile/package.json` | Update dependencies |

---

## API Mapping: Stripe → Polar

| Stripe Concept | Polar Equivalent |
|----------------|------------------|
| Customer | Customer |
| PaymentIntent | Checkout Session → Order |
| PaymentMethod | Managed by Polar |
| Charge | Order |
| Refund | Refund |
| Connect Account | N/A (manual payouts) |
| Transfer | N/A (manual payouts) |
| Webhook Events | Webhook Events |

### Webhook Event Mapping

| Stripe Event | Polar Event |
|--------------|-------------|
| `payment_intent.succeeded` | `order.paid` |
| `payment_intent.payment_failed` | `checkout.updated` (status: failed) |
| `charge.refunded` | `order.refunded`, `refund.updated` |
| `customer.created` | `customer.created` |
| `customer.updated` | `customer.updated` |

---

## Risks & Mitigations

### Risk 1: No Stripe Connect
**Impact**: Cannot auto-pay barbers
**Mitigation**: Implement manual payout system with admin dashboard

### Risk 2: Payment Method Storage
**Impact**: Users may need to re-enter cards
**Mitigation**: Polar manages payment methods; first-time users go through checkout once, returning users have saved methods in Polar

### Risk 3: Mobile Checkout UX
**Impact**: Embedded checkout may differ from native Stripe Sheet
**Mitigation**: Use WebView for seamless in-app experience, or open in browser with deep link return

### Risk 4: Go SDK Not Ready
**Impact**: No official Go SDK from Polar
**Mitigation**: Use REST API directly (as shown above), or use community SDK

---

## Timeline Summary

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Setup | 1-2 days | None |
| Phase 2: Backend | 3-5 days | Phase 1 |
| Phase 3: Mobile | 3-5 days | Phase 2 |
| Phase 4: Payouts | 2-3 days | Phase 2 |
| Phase 5: Testing | 2-3 days | Phase 3, 4 |
| Phase 6: Go-Live | 1-2 days | Phase 5 |

**Total Estimated Time**: 12-20 days

---

## Resources

- [Polar Documentation](https://polar.sh/docs)
- [Polar API Reference](https://polar.sh/docs/api-reference/introduction)
- [Polar Webhooks](https://polar.sh/docs/integrate/webhooks/endpoints)
- [Polar Sandbox](https://polar.sh/docs/integrate/sandbox)
- [Embedded Checkout](https://polar.sh/docs/features/checkout/embed)
- [Standard Webhooks Spec](https://www.standardwebhooks.com/)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| TBD | Use Polar.sh | Simplified tax compliance, MoR benefits |
| TBD | Manual barber payouts | Polar lacks Connect equivalent |
| TBD | WebView checkout | Best UX for React Native |
