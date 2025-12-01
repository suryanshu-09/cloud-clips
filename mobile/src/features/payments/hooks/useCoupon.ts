/**
 * useCoupon Hook
 * Handles coupon validation and discount calculation
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { paymentService } from '../services/paymentService';
import { mockPaymentService } from '../services/mockPaymentService';
import type { IValidateCouponRequest, IValidateCouponResponse, ICoupon } from '../types';

// Check if dev mode is enabled
const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
const service = isDevMode ? mockPaymentService : paymentService;

export const useCoupon = () => {
  const [appliedCoupon, setAppliedCoupon] = useState<ICoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Validate coupon mutation
  const validateCouponMutation = useMutation({
    mutationFn: (data: IValidateCouponRequest) => service.validateCoupon(data),
    onSuccess: (response: IValidateCouponResponse) => {
      if (response.valid && response.coupon) {
        setAppliedCoupon(response.coupon);
        setDiscountAmount(response.discountAmount || 0);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        if (response.error) {
          Alert.alert('Invalid Coupon', response.error);
        }
      }
    },
    onError: (error: Error) => {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      Alert.alert('Error', error.message || 'Failed to validate coupon');
    },
  });

  // Validate coupon code
  const validateCoupon = async (code: string, amount: number, serviceIds?: string[]) => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter a coupon code');
      return;
    }

    validateCouponMutation.mutate({
      code: code.trim(),
      amount,
      serviceIds,
    });
  };

  // Remove applied coupon
  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  };

  // Calculate final amount with discount
  const calculateFinalAmount = (subtotal: number): number => {
    if (!appliedCoupon) {
      return subtotal;
    }

    let discount = 0;

    if (appliedCoupon.discountType === 'percentage') {
      discount = (subtotal * appliedCoupon.discountValue) / 100;
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      discount = appliedCoupon.discountValue;
    }

    return Math.max(0, subtotal - discount);
  };

  // Check if a coupon is currently applied
  const hasCouponApplied = !!appliedCoupon;

  return {
    validateCoupon,
    isValidating: validateCouponMutation.isPending,
    appliedCoupon,
    discountAmount,
    removeCoupon,
    calculateFinalAmount,
    hasCouponApplied,
  };
};
