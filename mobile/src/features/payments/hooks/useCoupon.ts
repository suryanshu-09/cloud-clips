/**
 * useCoupon Hook
 * Handles coupon validation and discount calculation using Convex
 */

import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Alert } from 'react-native';
import type { Id } from '@/convex/_generated/dataModel';

interface ValidatedCoupon {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount';
  discountValue: number;
  applicableTo: 'services' | 'products' | 'both';
}

export const useCoupon = () => {
  const [appliedCoupon, setAppliedCoupon] = useState<ValidatedCoupon | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);

  const validateCouponMutation = useMutation(api.coupons.mutations.applyDiscount);

  const validateCoupon = useCallback(
    async (
      code: string,
      amount: number,
      serviceIds?: string[],
      type: 'service' | 'product' = 'service',
      barberId?: Id<'users'>
    ) => {
      if (!code.trim()) {
        Alert.alert('Error', 'Please enter a coupon code');
        return;
      }

      setIsValidating(true);

      try {
        const result = await validateCouponMutation({
          couponCode: code.trim(),
          amount,
          type,
          barberId,
        });

        if (result.valid) {
          setAppliedCoupon({
            code: result.couponCode || code.toUpperCase(),
            description: result.description,
            discountType: 'percentage',
            discountValue: result.discount ? (result.discount / amount) * 100 : 0,
            applicableTo: 'both',
          });
          setDiscountAmount(result.discount || 0);
        } else {
          setAppliedCoupon(null);
          setDiscountAmount(0);
          Alert.alert('Invalid Coupon', 'The coupon code is not valid or has expired.');
        }
      } catch (error: any) {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        Alert.alert('Error', error?.message || 'Failed to validate coupon');
      } finally {
        setIsValidating(false);
      }
    },
    [validateCouponMutation]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
  }, []);

  const calculateFinalAmount = useCallback(
    (subtotal: number): number => {
      if (!appliedCoupon) {
        return subtotal;
      }

      let discount = 0;

      if (appliedCoupon.discountType === 'percentage') {
        discount = (subtotal * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }

      return Math.max(0, subtotal - discount);
    },
    [appliedCoupon]
  );

  const hasCouponApplied = !!appliedCoupon;

  return {
    validateCoupon,
    isValidating,
    appliedCoupon,
    discountAmount,
    removeCoupon,
    calculateFinalAmount,
    hasCouponApplied,
  };
};
