/**
 * PaymentConfirmation Component
 * Shows success message after payment completion
 */

import { View, Text, Pressable } from 'react-native';
import { Card } from '@/components/ui/Card';
import type { IPaymentTransaction } from '@/features/payments/types';

interface IPaymentConfirmationProps {
  transaction: IPaymentTransaction;
  onContinue?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

export function PaymentConfirmation({
  transaction,
  onContinue,
  onViewDetails,
  className = '',
}: IPaymentConfirmationProps) {
  const formatCurrency = (amount: number): string => {
    return `${transaction.currency === 'USD' ? '$' : transaction.currency}${amount.toFixed(2)}`;
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View className={`gap-4 ${className}`}>
      {/* Success Icon */}
      <View className="items-center py-6">
        <View className="w-20 h-20 bg-green-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">✓</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</Text>
        <Text className="text-base text-gray-600 text-center">
          Your payment has been processed successfully
        </Text>
      </View>

      {/* Transaction Details */}
      <Card>
        <View className="gap-3">
          <Text className="text-lg font-semibold text-gray-900 mb-2">Transaction Details</Text>

          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Transaction ID</Text>
            <Text className="text-sm font-mono text-gray-900">{transaction.id}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-sm text-gray-600">Date & Time</Text>
            <Text className="text-sm text-gray-900">{formatDate(transaction.createdAt)}</Text>
          </View>

          {transaction.appointmentId && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Appointment ID</Text>
              <Text className="text-sm font-mono text-gray-900">{transaction.appointmentId}</Text>
            </View>
          )}

          {transaction.orderId && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-gray-600">Order ID</Text>
              <Text className="text-sm font-mono text-gray-900">{transaction.orderId}</Text>
            </View>
          )}

          {transaction.discountAmount && transaction.discountAmount > 0 && (
            <View className="flex-row justify-between">
              <Text className="text-sm text-green-600">Discount Applied</Text>
              <Text className="text-sm font-medium text-green-600">
                -{formatCurrency(transaction.discountAmount)}
              </Text>
            </View>
          )}

          <View className="border-t border-gray-200 pt-3 mt-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-base font-semibold text-gray-900">Amount Paid</Text>
              <Text className="text-xl font-bold text-gray-900">
                {formatCurrency(transaction.finalAmount)}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Payment Status */}
      <Card className="bg-green-50 border-green-200">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
            <Text className="text-lg">💳</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-medium text-green-700">Payment Status</Text>
            <Text className="text-base font-semibold text-green-800 capitalize">
              {transaction.status}
            </Text>
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View className="gap-3 mt-4">
        {onContinue && (
          <Pressable
            onPress={onContinue}
            className="bg-blue-600 py-4 rounded-lg items-center active:bg-blue-700"
          >
            <Text className="text-white font-semibold text-base">Continue</Text>
          </Pressable>
        )}

        {onViewDetails && (
          <Pressable
            onPress={onViewDetails}
            className="border border-gray-300 py-4 rounded-lg items-center active:bg-gray-50"
          >
            <Text className="text-gray-700 font-semibold text-base">View Details</Text>
          </Pressable>
        )}
      </View>

      {/* Info Message */}
      <View className="bg-blue-50 p-4 rounded-lg">
        <Text className="text-sm text-blue-700 text-center">
          A confirmation email has been sent to your registered email address
        </Text>
      </View>
    </View>
  );
}
