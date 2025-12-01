/**
 * Payment feature types
 * Includes payment intents, methods, coupons, and transactions
 */

export interface IPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  clientSecret: string;
  status: PaymentStatus;
  metadata?: Record<string, string>;
}

export interface IPaymentMethod {
  id: string;
  type: PaymentMethodType;
  card?: {
    brand: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
  };
  isDefault: boolean;
}

export interface ICoupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number; // percentage or fixed amount
  minAmount?: number;
  maxDiscount?: number;
  expiresAt?: Date;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  applicableServices?: string[]; // service IDs
}

export interface IPaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethodId: string;
  appointmentId?: string;
  orderId?: string;
  couponId?: string;
  discountAmount?: number;
  finalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPriceBreakdown {
  subtotal: number;
  discount: number;
  tax: number;
  serviceFee: number;
  total: number;
  currency: string;
}

export interface ICreatePaymentIntentRequest {
  amount: number;
  currency?: string;
  appointmentId?: string;
  orderId?: string;
  couponCode?: string;
  metadata?: Record<string, string>;
}

export interface IProcessPaymentRequest {
  paymentIntentId: string;
  paymentMethodId: string;
}

export interface IValidateCouponRequest {
  code: string;
  amount: number;
  serviceIds?: string[];
}

export interface IValidateCouponResponse {
  valid: boolean;
  coupon?: ICoupon;
  discountAmount?: number;
  finalAmount?: number;
  error?: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethodType {
  CARD = 'card',
  WALLET = 'wallet',
  BANK_TRANSFER = 'bank_transfer',
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed',
}

export interface IPaymentError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
