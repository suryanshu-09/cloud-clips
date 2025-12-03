/**
 * Stripe Service Integration
 * Handles Stripe payment processing with Payment Sheet and card management
 */

import {
  initStripe,
  useStripe,
  useConfirmPayment,
  CardField,
  CardFieldInput,
  isPlatformPaySupported,
  PlatformPayButton,
  PlatformPay,
} from '@stripe/stripe-react-native';
import apiClient from '@/services/api/client';
import type { IPaymentIntent, IPaymentError, IPaymentMethod } from '../types';

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

/**
 * Initialize Stripe SDK
 * Should be called once at app startup
 */
export const initializeStripe = async (): Promise<boolean> => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    console.warn('[Stripe] No publishable key configured. Stripe functionality disabled.');
    return false;
  }

  try {
    await initStripe({
      publishableKey: STRIPE_PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.cloudclips',
      urlScheme: 'cloudclips',
    });
    console.log('[Stripe] Initialized successfully');
    return true;
  } catch (error) {
    console.error('[Stripe] Failed to initialize:', error);
    return false;
  }
};

/**
 * Check if Stripe is properly configured
 */
export const isStripeConfigured = (): boolean => {
  return !!STRIPE_PUBLISHABLE_KEY;
};

/**
 * Payment processing result interface
 */
export interface IPaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: IPaymentError;
}

/**
 * Payment Sheet configuration
 */
export interface IPaymentSheetParams {
  clientSecret: string;
  merchantDisplayName?: string;
  customerId?: string;
  customerEphemeralKeySecret?: string;
  defaultBillingDetails?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      city?: string;
      country?: string;
      line1?: string;
      line2?: string;
      postalCode?: string;
      state?: string;
    };
  };
}

/**
 * useStripePayment hook
 * Provides payment sheet functionality for checkout flows
 */
export function useStripePayment() {
  const { initPaymentSheet, presentPaymentSheet, confirmPayment } = useStripe();

  /**
   * Process a payment using Payment Sheet
   * This is the recommended way to collect payment info
   */
  const processPaymentWithSheet = async (
    amount: number,
    currency: string = 'usd',
    appointmentId?: string,
    orderId?: string
  ): Promise<IPaymentResult> => {
    try {
      // 1. Create payment intent on backend
      const { data } = await apiClient.post('/payments/intent', {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        appointmentId,
        orderId,
      });

      const clientSecret = data.clientSecret;
      const intentId = data.intentId;

      // 2. Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Cloud Clips',
        style: 'automatic',
        googlePay: {
          merchantCountryCode: 'US',
          testEnv: __DEV__,
        },
        applePay: {
          merchantCountryCode: 'US',
        },
        returnURL: 'cloudclips://payment-complete',
      });

      if (initError) {
        console.error('[Stripe] Init payment sheet error:', initError);
        return {
          success: false,
          error: {
            code: initError.code,
            message: initError.message,
          },
        };
      }

      // 3. Present payment sheet
      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        console.error('[Stripe] Present payment sheet error:', presentError);
        return {
          success: false,
          error: {
            code: presentError.code,
            message: presentError.message,
          },
        };
      }

      // 4. Payment successful
      return {
        success: true,
        paymentIntentId: intentId,
      };
    } catch (error) {
      const err = error as Error;
      console.error('[Stripe] Payment processing error:', err);
      return {
        success: false,
        error: {
          code: 'payment_failed',
          message: err.message || 'Payment processing failed',
        },
      };
    }
  };

  /**
   * Confirm a payment with a specific payment method
   * Use this when customer selects from saved cards
   */
  const confirmPaymentWithMethod = async (
    clientSecret: string,
    paymentMethodId: string
  ): Promise<IPaymentResult> => {
    try {
      const { error, paymentIntent } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          paymentMethodId,
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: true,
        paymentIntentId: paymentIntent?.id,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'confirm_failed',
          message: err.message || 'Payment confirmation failed',
        },
      };
    }
  };

  return {
    processPaymentWithSheet,
    confirmPaymentWithMethod,
    isConfigured: isStripeConfigured(),
  };
}

/**
 * useSavedCards hook
 * Manages saved payment methods for a user
 */
export function useSavedCards() {
  /**
   * Fetch saved payment methods from backend
   */
  const fetchSavedCards = async (): Promise<IPaymentMethod[]> => {
    try {
      const { data } = await apiClient.get('/payments/methods');
      return data.paymentMethods || [];
    } catch (error) {
      console.error('[Stripe] Failed to fetch saved cards:', error);
      return [];
    }
  };

  /**
   * Save a new payment method
   */
  const saveCard = async (
    paymentMethodId: string,
    setAsDefault: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.post('/payments/methods', {
        paymentMethodId,
        setAsDefault,
      });
      return { success: true };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Failed to save card',
      };
    }
  };

  /**
   * Remove a saved payment method
   */
  const removeCard = async (
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.delete(`/payments/methods/${paymentMethodId}`);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Failed to remove card',
      };
    }
  };

  /**
   * Set a payment method as default
   */
  const setDefaultCard = async (
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await apiClient.put(`/payments/methods/${paymentMethodId}/default`);
      return { success: true };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: err.message || 'Failed to set default card',
      };
    }
  };

  return {
    fetchSavedCards,
    saveCard,
    removeCard,
    setDefaultCard,
  };
}

/**
 * usePlatformPay hook
 * Handles Apple Pay and Google Pay
 */
export function usePlatformPay() {
  const { presentPlatformPay, confirmPlatformPay } = useStripe();

  /**
   * Check if platform pay (Apple Pay / Google Pay) is available
   */
  const checkPlatformPaySupport = async (): Promise<boolean> => {
    try {
      const isSupported = await isPlatformPaySupported();
      return isSupported;
    } catch {
      return false;
    }
  };

  /**
   * Process payment using Apple Pay or Google Pay
   */
  const processWithPlatformPay = async (
    amount: number,
    currency: string = 'usd',
    appointmentId?: string,
    orderId?: string
  ): Promise<IPaymentResult> => {
    try {
      // 1. Create payment intent
      const { data } = await apiClient.post('/payments/intent', {
        amount: Math.round(amount * 100),
        currency,
        appointmentId,
        orderId,
      });

      // 2. Confirm with platform pay
      const { error, paymentIntent } = await confirmPlatformPay(data.clientSecret, {
        applePay: {
          cartItems: [
            {
              label: 'Cloud Clips',
              amount: amount.toFixed(2),
              paymentType: PlatformPay.PaymentType.Immediate,
            },
          ],
          merchantCountryCode: 'US',
          currencyCode: currency.toUpperCase(),
        },
        googlePay: {
          testEnv: __DEV__,
          merchantCountryCode: 'US',
          currencyCode: currency.toUpperCase(),
          merchantName: 'Cloud Clips',
        },
      });

      if (error) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
        };
      }

      return {
        success: true,
        paymentIntentId: paymentIntent?.id,
      };
    } catch (error) {
      const err = error as Error;
      return {
        success: false,
        error: {
          code: 'platform_pay_failed',
          message: err.message || 'Platform pay failed',
        },
      };
    }
  };

  return {
    checkPlatformPaySupport,
    processWithPlatformPay,
  };
}

/**
 * Request a refund for a payment
 */
export const requestRefund = async (
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> => {
  try {
    const { data } = await apiClient.post('/payments/refund', {
      paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason,
    });
    return {
      success: true,
      refundId: data.refundId,
    };
  } catch (error) {
    const err = error as Error;
    return {
      success: false,
      error: err.message || 'Refund request failed',
    };
  }
};

// Re-export Stripe components for use in UI
export { useStripe, useConfirmPayment, CardField, CardFieldInput, PlatformPayButton };
