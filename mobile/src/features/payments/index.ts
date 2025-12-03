/**
 * Payment feature exports
 */

// Hooks
export {
  usePayment,
  usePaymentMethods,
  useTransactionHistory,
  useTransaction,
} from './hooks/usePayment';
export { useCoupon } from './hooks/useCoupon';
export {
  useCoupons,
  useAvailableCoupons,
  useSavedCoupons,
  useSaveCoupon,
  COUPON_QUERY_KEYS,
  type ICouponWithMeta,
} from './hooks/useCoupons';

// Services
export { paymentService } from './services/paymentService';
export { mockPaymentService } from './services/mockPaymentService';
export {
  initializeStripe,
  isStripeConfigured,
  useStripePayment,
  useSavedCards,
  usePlatformPay,
  requestRefund,
  useStripe,
  useConfirmPayment,
  CardField,
  PlatformPayButton,
} from './services/stripeService';

// Types
export * from './types';
