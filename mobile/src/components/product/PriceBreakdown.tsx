/**
 * PriceBreakdown Component
 * Displays itemized price breakdown with discounts and taxes
 */

import { View, Text } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { IPriceBreakdown } from '@/features/payments/types';

interface IPriceBreakdownProps {
  breakdown: IPriceBreakdown;
  couponCode?: string;
  showTitle?: boolean;
  className?: string;
}

export function PriceBreakdown({
  breakdown,
  couponCode,
  showTitle = true,
  className = '',
}: IPriceBreakdownProps) {
  const formatCurrency = (amount: number): string => {
    return `${breakdown.currency === 'USD' ? '$' : breakdown.currency}${amount.toFixed(2)}`;
  };

  return (
    <Card className={className}>
      <View className="gap-3">
        {showTitle && (
          <Text className="text-lg font-semibold text-gray-900 mb-2">Price Details</Text>
        )}

        {/* Subtotal */}
        <View className="flex-row justify-between">
          <Text className="text-base text-gray-600">Subtotal</Text>
          <Text className="text-base text-gray-900">{formatCurrency(breakdown.subtotal)}</Text>
        </View>

        {/* Discount */}
        {breakdown.discount > 0 && (
          <View className="flex-row justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-base text-green-600">Discount</Text>
              {couponCode && (
                <Text className="text-xs text-gray-500 bg-green-50 px-2 py-0.5 rounded">
                  {couponCode}
                </Text>
              )}
            </View>
            <Text className="text-base text-green-600">-{formatCurrency(breakdown.discount)}</Text>
          </View>
        )}

        {/* Tax */}
        {breakdown.tax > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-base text-gray-600">Tax</Text>
            <Text className="text-base text-gray-900">{formatCurrency(breakdown.tax)}</Text>
          </View>
        )}

        {/* Service Fee */}
        {breakdown.serviceFee > 0 && (
          <View className="flex-row justify-between">
            <Text className="text-base text-gray-600">Service Fee</Text>
            <Text className="text-base text-gray-900">{formatCurrency(breakdown.serviceFee)}</Text>
          </View>
        )}

        {/* Total */}
        <View className="border-t border-gray-200 pt-3 mt-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-gray-900">Total</Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatCurrency(breakdown.total)}
            </Text>
          </View>
        </View>

        {/* Savings indicator */}
        {breakdown.discount > 0 && (
          <View className="bg-green-50 p-3 rounded-lg">
            <Text className="text-sm text-green-700 text-center font-medium">
              You're saving {formatCurrency(breakdown.discount)}!
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}
