/**
 * Payment Service
 * Handles all payment-related API calls
 */

import apiClient from '@/services/api/client';
import type {
  ICreatePaymentIntentRequest,
  IPaymentIntent,
  IPaymentMethod,
  IPaymentTransaction,
  IProcessPaymentRequest,
  IValidateCouponRequest,
  IValidateCouponResponse,
} from '../types';

class PaymentService {
  /**
   * Create a payment intent for processing payment
   */
  async createPaymentIntent(data: ICreatePaymentIntentRequest): Promise<IPaymentIntent> {
    const response = await apiClient.post<IPaymentIntent>('/payments/intents', data);
    return response.data;
  }

  /**
   * Process a payment using the payment intent and method
   */
  async processPayment(data: IProcessPaymentRequest): Promise<IPaymentTransaction> {
    const response = await apiClient.post<IPaymentTransaction>('/payments/process', data);
    return response.data;
  }

  /**
   * Validate a coupon code
   */
  async validateCoupon(data: IValidateCouponRequest): Promise<IValidateCouponResponse> {
    const response = await apiClient.post<IValidateCouponResponse>(
      '/payments/coupons/validate',
      data
    );
    return response.data;
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods(): Promise<IPaymentMethod[]> {
    const response = await apiClient.get<IPaymentMethod[]>('/payments/methods');
    return response.data;
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(paymentMethodId: string): Promise<IPaymentMethod> {
    const response = await apiClient.post<IPaymentMethod>('/payments/methods', { paymentMethodId });
    return response.data;
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.delete(`/payments/methods/${paymentMethodId}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await apiClient.put(`/payments/methods/${paymentMethodId}/default`);
  }

  /**
   * Get payment transaction history
   */
  async getTransactionHistory(): Promise<IPaymentTransaction[]> {
    const response = await apiClient.get<IPaymentTransaction[]>('/payments/transactions');
    return response.data;
  }

  /**
   * Get a specific transaction
   */
  async getTransaction(transactionId: string): Promise<IPaymentTransaction> {
    const response = await apiClient.get<IPaymentTransaction>(
      `/payments/transactions/${transactionId}`
    );
    return response.data;
  }

  /**
   * Request a refund for a transaction
   */
  async requestRefund(transactionId: string, reason?: string): Promise<IPaymentTransaction> {
    const response = await apiClient.post<IPaymentTransaction>(
      `/payments/transactions/${transactionId}/refund`,
      { reason }
    );
    return response.data;
  }
}

export const paymentService = new PaymentService();
