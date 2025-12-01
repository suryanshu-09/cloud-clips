# Phase 9 Quick Reference - Payment Processing

## Quick Import Guide

```typescript
// Hooks
import { 
  usePayment, 
  usePaymentMethods, 
  useCoupon 
} from '@/features/payments'

// Components
import { 
  PriceBreakdown, 
  CouponInput, 
  PaymentConfirmation 
} from '@/components/product'

// Types
import type { 
  IPaymentIntent, 
  IPaymentTransaction, 
  ICoupon,
  IPriceBreakdown 
} from '@/features/payments'
```

## Common Use Cases

### 1. Payment Processing
```typescript
const CheckoutScreen = () => {
  const { 
    createPaymentIntent, 
    processPayment, 
    isProcessing,
    transaction 
  } = usePayment()

  const handleCheckout = async () => {
    // Step 1: Create payment intent
    const intent = await createPaymentIntent({
      amount: 75.00,
      currency: 'USD',
      appointmentId: 'apt_123',
      couponCode: 'SAVE20'
    })

    // Step 2: Process payment
    await processPayment({
      paymentIntentId: intent.id,
      paymentMethodId: 'pm_card_visa'
    })

    // Step 3: Show confirmation (transaction will be populated)
  }

  return (
    <View>
      {transaction ? (
        <PaymentConfirmation 
          transaction={transaction}
          onContinue={() => router.push('/appointments')}
        />
      ) : (
        <Button onPress={handleCheckout} loading={isProcessing}>
          Pay Now
        </Button>
      )}
    </View>
  )
}
```

### 2. Coupon Validation
```typescript
const CheckoutScreen = () => {
  const { 
    validateCoupon, 
    appliedCoupon, 
    discountAmount,
    calculateFinalAmount 
  } = useCoupon()

  const subtotal = 100.00
  const finalAmount = calculateFinalAmount(subtotal)

  return (
    <View>
      <CouponInput
        amount={subtotal}
        serviceIds={['service_1', 'service_2']}
        onCouponApplied={(coupon, discount) => {
          console.log(`Applied ${coupon.code}: -$${discount}`)
        }}
      />
      <Text>Final Amount: ${finalAmount.toFixed(2)}</Text>
    </View>
  )
}
```

### 3. Price Breakdown Display
```typescript
const CheckoutScreen = () => {
  const { appliedCoupon, discountAmount } = useCoupon()
  
  const breakdown: IPriceBreakdown = {
    subtotal: 100.00,
    discount: discountAmount,
    tax: 8.00,
    serviceFee: 2.00,
    total: 100.00 - discountAmount + 8.00 + 2.00,
    currency: 'USD'
  }

  return (
    <PriceBreakdown 
      breakdown={breakdown}
      couponCode={appliedCoupon?.code}
      showTitle={true}
    />
  )
}
```

### 4. Payment Methods Management
```typescript
const PaymentMethodsScreen = () => {
  const {
    paymentMethods,
    isLoading,
    addPaymentMethod,
    removePaymentMethod,
    setDefaultPaymentMethod
  } = usePaymentMethods()

  const handleAddCard = async (paymentMethodId: string) => {
    await addPaymentMethod(paymentMethodId)
  }

  const handleRemoveCard = async (id: string) => {
    await removePaymentMethod(id)
  }

  return (
    <View>
      {paymentMethods.map((method) => (
        <Card key={method.id}>
          <Text>{method.card?.brand} •••• {method.card?.last4}</Text>
          {method.isDefault && <Badge>Default</Badge>}
          <Button onPress={() => handleRemoveCard(method.id)}>
            Remove
          </Button>
        </Card>
      ))}
    </View>
  )
}
```

### 5. Transaction History
```typescript
const TransactionsScreen = () => {
  const { transactions, isLoading } = useTransactionHistory()

  return (
    <FlatList
      data={transactions}
      renderItem={({ item }) => (
        <Card>
          <Text>Amount: ${item.finalAmount}</Text>
          <Text>Status: {item.status}</Text>
          <Text>Date: {new Date(item.createdAt).toLocaleDateString()}</Text>
          {item.appointmentId && (
            <Text>Appointment: {item.appointmentId}</Text>
          )}
        </Card>
      )}
    />
  )
}
```

### 6. Refund Request
```typescript
const TransactionDetailsScreen = ({ transactionId }: { transactionId: string }) => {
  const { transaction, requestRefund, isRequestingRefund } = useTransaction(transactionId)

  const handleRefund = async () => {
    await requestRefund({ 
      reason: 'Customer requested cancellation' 
    })
  }

  return (
    <View>
      {transaction && (
        <>
          <PaymentConfirmation transaction={transaction} />
          <Button 
            onPress={handleRefund}
            loading={isRequestingRefund}
          >
            Request Refund
          </Button>
        </>
      )}
    </View>
  )
}
```

## Mock Service Test Coupons

When `EXPO_PUBLIC_DEV_MODE=true`, use these test coupons:

| Code | Type | Value | Min Amount | Notes |
|------|------|-------|------------|-------|
| SAVE20 | Percentage | 20% | - | General discount |
| FIRST10 | Fixed | $10 | $30 | First-time user discount |

## Price Calculation Helper

```typescript
const calculateTotalWithCoupon = (
  subtotal: number,
  coupon: ICoupon | null
): { discount: number; total: number } => {
  if (!coupon) {
    return { discount: 0, total: subtotal }
  }

  let discount = 0
  
  if (coupon.discountType === 'percentage') {
    discount = (subtotal * coupon.discountValue) / 100
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount
    }
  } else {
    discount = coupon.discountValue
  }

  return {
    discount,
    total: Math.max(0, subtotal - discount)
  }
}
```

## Stripe Integration (Production)

### Initialize Stripe
```typescript
// In app root (_layout.tsx)
import { initializeStripe } from '@/features/payments'

useEffect(() => {
  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLIC_KEY
  if (stripeKey && !isDevMode) {
    initializeStripe(stripeKey)
  }
}, [])
```

### Card Input (using Stripe SDK)
```typescript
import { CardField } from '@stripe/stripe-react-native'

<CardField
  postalCodeEnabled={true}
  placeholders={{
    number: '4242 4242 4242 4242',
  }}
  cardStyle={{
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
  }}
  style={{
    width: '100%',
    height: 50,
    marginVertical: 30,
  }}
  onCardChange={(cardDetails) => {
    console.log('Card details:', cardDetails)
  }}
/>
```

## API Endpoints Required

```
POST   /payments/intents              Create payment intent
POST   /payments/process               Process payment
POST   /payments/coupons/validate      Validate coupon
GET    /payments/methods               Get payment methods
POST   /payments/methods               Add payment method
DELETE /payments/methods/:id           Remove payment method
PUT    /payments/methods/:id/default   Set default method
GET    /payments/transactions          Get transaction history
GET    /payments/transactions/:id      Get transaction details
POST   /payments/transactions/:id/refund  Request refund
```

## Type Definitions

### Payment Status Enum
```typescript
enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}
```

### Discount Type Enum
```typescript
enum DiscountType {
  PERCENTAGE = 'percentage',  // e.g., 20% off
  FIXED = 'fixed',            // e.g., $10 off
}
```

## Error Handling

```typescript
const { processPayment } = usePayment()

try {
  await processPayment({
    paymentIntentId: 'pi_123',
    paymentMethodId: 'pm_card'
  })
} catch (error) {
  // Error is automatically handled with Alert
  // But you can add custom handling too
  console.error('Payment failed:', error)
}
```

## Testing Checklist

- [ ] Payment intent creation
- [ ] Payment processing (success/failure)
- [ ] Coupon validation (valid/invalid)
- [ ] Percentage discount calculation
- [ ] Fixed discount calculation
- [ ] Maximum discount cap
- [ ] Minimum amount requirement
- [ ] Payment method management
- [ ] Transaction history display
- [ ] Refund request flow
- [ ] Mock service in dev mode
- [ ] Real API in production mode

## Files Changed/Created

```
✅ mobile/src/features/payments/
   ├── hooks/
   │   ├── usePayment.ts
   │   └── useCoupon.ts
   ├── services/
   │   ├── paymentService.ts
   │   ├── mockPaymentService.ts
   │   └── stripeService.ts
   ├── index.ts
   └── types.ts

✅ mobile/src/components/product/
   ├── PriceBreakdown.tsx
   ├── CouponInput.tsx
   ├── PaymentConfirmation.tsx
   └── index.ts

✅ mobile/package.json (added @stripe/stripe-react-native)
```

---

**Quick Tips:**
- Always use mock service in dev mode for faster testing
- Test both percentage and fixed discounts
- Handle payment failures gracefully
- Show clear error messages to users
- Validate coupons before creating payment intent
- Store transaction IDs for tracking
