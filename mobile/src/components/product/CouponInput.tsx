/**
 * CouponInput Component
 * Input field for entering and validating coupon codes
 */

import { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { useCoupon } from '@/features/payments';
import type { ICoupon } from '@/features/payments/types';
import type { Id } from '@/convex/_generated/dataModel';

interface ICouponInputProps {
  amount: number;
  serviceIds?: string[];
  barberId?: Id<'users'>;
  onCouponApplied?: (coupon: ICoupon, discountAmount: number) => void;
  onCouponRemoved?: () => void;
  className?: string;
}

export function CouponInput({
  amount,
  serviceIds,
  barberId,
  onCouponApplied,
  onCouponRemoved,
  className = '',
}: ICouponInputProps) {
  const [couponCode, setCouponCode] = useState('');
  const {
    validateCoupon,
    isValidating,
    appliedCoupon,
    discountAmount,
    removeCoupon,
    hasCouponApplied,
  } = useCoupon();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      return;
    }

    await validateCoupon(couponCode, amount, serviceIds, 'service', barberId);
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    onCouponRemoved?.();
  };

  // Notify parent when coupon is applied
  if (appliedCoupon && onCouponApplied && discountAmount > 0) {
    onCouponApplied(appliedCoupon, discountAmount);
  }

  return (
    <View className={`gap-3 ${className}`}>
      {/* Coupon Input */}
      {!hasCouponApplied ? (
        <View className="gap-2">
          <Text className="text-sm font-medium text-gray-700">Have a coupon code?</Text>
          <View className="flex-row gap-2">
            <View className="flex-1 border border-gray-300 rounded-lg bg-white">
              <TextInput
                className="px-4 py-3 text-base text-gray-900"
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                editable={!isValidating}
                returnKeyType="done"
                onSubmitEditing={handleApplyCoupon}
              />
            </View>
            <Pressable
              onPress={handleApplyCoupon}
              disabled={!couponCode.trim() || isValidating}
              className={`px-6 py-3 rounded-lg justify-center items-center ${
                !couponCode.trim() || isValidating ? 'bg-gray-300' : 'bg-blue-600'
              }`}
            >
              {isValidating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-white font-semibold">Apply</Text>
              )}
            </Pressable>
          </View>
        </View>
      ) : appliedCoupon ? (
        // Applied Coupon Display
        <View className="bg-green-50 border border-green-200 rounded-lg p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-1">
                <Text className="text-base font-semibold text-green-700">{appliedCoupon.code}</Text>
                <View className="bg-green-100 px-2 py-0.5 rounded">
                  <Text className="text-xs font-medium text-green-700">Applied</Text>
                </View>
              </View>
              <Text className="text-sm text-green-600">
                {appliedCoupon.discountType === 'percentage'
                  ? `${appliedCoupon.discountValue}% off`
                  : `$${appliedCoupon.discountValue.toFixed(2)} off`}
              </Text>
              <Text className="text-xs text-green-600 mt-1">
                You save ${discountAmount.toFixed(2)}
              </Text>
            </View>
            <Pressable
              onPress={handleRemoveCoupon}
              className="bg-white border border-green-300 px-3 py-2 rounded-lg"
            >
              <Text className="text-green-700 font-medium">Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}
