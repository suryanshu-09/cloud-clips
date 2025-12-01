/**
 * Mock Payment Service
 * For development and testing without real API
 */

import type {
  ICreatePaymentIntentRequest,
  IPaymentIntent,
  IPaymentMethod,
  IPaymentTransaction,
  IProcessPaymentRequest,
  IValidateCouponRequest,
  IValidateCouponResponse,
} from '../types';
import { PaymentStatus, PaymentMethodType, DiscountType } from '../types';

// Mock data
const mockPaymentMethods: IPaymentMethod[] = [
  {
    id: 'pm_1',
    type: PaymentMethodType.CARD,
    card: {
      brand: 'visa',
      last4: '4242',
      expiryMonth: 12,
      expiryYear: 2025,
    },
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: PaymentMethodType.CARD,
    card: {
      brand: 'mastercard',
      last4: '8888',
      expiryMonth: 6,
      expiryYear: 2026,
    },
    isDefault: false,
  },
];

const mockTransactions: IPaymentTransaction[] = [
  {
    id: 'txn_1',
    amount: 50.0,
    currency: 'USD',
    status: PaymentStatus.SUCCEEDED,
    paymentMethodId: 'pm_1',
    appointmentId: 'apt_1',
    finalAmount: 50.0,
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-01-15'),
  },
  {
    id: 'txn_2',
    amount: 75.0,
    currency: 'USD',
    status: PaymentStatus.SUCCEEDED,
    paymentMethodId: 'pm_1',
    appointmentId: 'apt_2',
    couponId: 'coupon_1',
    discountAmount: 15.0,
    finalAmount: 60.0,
    createdAt: new Date('2025-01-20'),
    updatedAt: new Date('2025-01-20'),
  },
];

const mockCoupons: Record<string, IValidateCouponResponse> = {
  SAVE20: {
    valid: true,
    coupon: {
      id: 'coupon_1',
      code: 'SAVE20',
      discountType: DiscountType.PERCENTAGE,
      discountValue: 20,
      usageLimit: 100,
      usageCount: 45,
      isActive: true,
    },
    discountAmount: 0, // calculated based on amount
    finalAmount: 0, // calculated based on amount
  },
  FIRST10: {
    valid: true,
    coupon: {
      id: 'coupon_2',
      code: 'FIRST10',
      discountType: DiscountType.FIXED,
      discountValue: 10,
      minAmount: 30,
      usageLimit: 50,
      usageCount: 12,
      isActive: true,
    },
    discountAmount: 10,
    finalAmount: 0, // calculated based on amount
  },
};

class MockPaymentService {
  private delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  async createPaymentIntent(data: ICreatePaymentIntentRequest): Promise<IPaymentIntent> {
    await this.delay(800);

    const intent: IPaymentIntent = {
      id: `pi_${Date.now()}`,
      amount: data.amount,
      currency: data.currency || 'USD',
      clientSecret: `secret_${Date.now()}`,
      status: PaymentStatus.PENDING,
      metadata: data.metadata,
    };

    return intent;
  }

  async processPayment(data: IProcessPaymentRequest): Promise<IPaymentTransaction> {
    await this.delay(1500);

    // Simulate random payment success/failure (90% success rate)
    const isSuccess = Math.random() > 0.1;

    if (!isSuccess) {
      throw new Error('Payment failed. Please try again.');
    }

    const transaction: IPaymentTransaction = {
      id: `txn_${Date.now()}`,
      amount: 50.0,
      currency: 'USD',
      status: PaymentStatus.SUCCEEDED,
      paymentMethodId: data.paymentMethodId,
      finalAmount: 50.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockTransactions.unshift(transaction);
    return transaction;
  }

  async validateCoupon(data: IValidateCouponRequest): Promise<IValidateCouponResponse> {
    await this.delay(600);

    const couponData = mockCoupons[data.code.toUpperCase()];

    if (!couponData) {
      return {
        valid: false,
        error: 'Invalid coupon code',
      };
    }

    const { coupon } = couponData;

    if (!coupon) {
      return {
        valid: false,
        error: 'Invalid coupon code',
      };
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return {
        valid: false,
        error: 'This coupon is no longer active',
      };
    }

    // Check if coupon has expired
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return {
        valid: false,
        error: 'This coupon has expired',
      };
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        error: 'This coupon has reached its usage limit',
      };
    }

    // Check minimum amount
    if (coupon.minAmount && data.amount < coupon.minAmount) {
      return {
        valid: false,
        error: `Minimum order amount of $${coupon.minAmount} required`,
      };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (data.amount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = Math.max(0, data.amount - discountAmount);

    return {
      valid: true,
      coupon,
      discountAmount,
      finalAmount,
    };
  }

  async getPaymentMethods(): Promise<IPaymentMethod[]> {
    await this.delay(500);
    return [...mockPaymentMethods];
  }

  async addPaymentMethod(paymentMethodId: string): Promise<IPaymentMethod> {
    await this.delay(800);

    const newMethod: IPaymentMethod = {
      id: paymentMethodId,
      type: PaymentMethodType.CARD,
      card: {
        brand: 'visa',
        last4: String(Math.floor(1000 + Math.random() * 9000)),
        expiryMonth: 12,
        expiryYear: 2026,
      },
      isDefault: mockPaymentMethods.length === 0,
    };

    mockPaymentMethods.push(newMethod);
    return newMethod;
  }

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    await this.delay(500);

    const index = mockPaymentMethods.findIndex((pm) => pm.id === paymentMethodId);
    if (index !== -1) {
      mockPaymentMethods.splice(index, 1);
    }
  }

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    await this.delay(500);

    mockPaymentMethods.forEach((pm) => {
      pm.isDefault = pm.id === paymentMethodId;
    });
  }

  async getTransactionHistory(): Promise<IPaymentTransaction[]> {
    await this.delay(600);
    return [...mockTransactions];
  }

  async getTransaction(transactionId: string): Promise<IPaymentTransaction> {
    await this.delay(400);

    const transaction = mockTransactions.find((t) => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return transaction;
  }

  async requestRefund(transactionId: string, reason?: string): Promise<IPaymentTransaction> {
    await this.delay(1000);

    const transaction = mockTransactions.find((t) => t.id === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    return {
      ...transaction,
      status: PaymentStatus.REFUNDED,
      updatedAt: new Date(),
    };
  }
}

export const mockPaymentService = new MockPaymentService();
