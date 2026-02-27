/**
 * BookingSummary Component
 * Displays booking details for confirmation
 * Aligned with IAppointment / ICreateAppointmentDTO types
 */

import { View, Text, ScrollView } from 'react-native';
import { format } from 'date-fns';
import type { LocationType } from '@/features/bookings/types';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

interface IBookingSummaryProps {
  barberName: string;
  barberAvatar?: string;
  serviceName: string;
  price: number;
  duration: number; // in minutes
  scheduledFor: number; // timestamp
  locationType: LocationType;
  address?: string;
  specialRequests?: string;
  discount?: number;
  couponCode?: string;
}

export function BookingSummary({
  barberName,
  barberAvatar,
  serviceName,
  price,
  duration,
  scheduledFor,
  locationType,
  address,
  specialRequests,
  discount = 0,
  couponCode,
}: IBookingSummaryProps) {
  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const locationLabel: Record<LocationType, string> = {
    in_home: 'In-Home',
    in_salon: 'In-Salon',
  };

  const scheduledDate = new Date(scheduledFor);
  const formattedDate = format(scheduledDate, 'EEEE, MMMM d, yyyy');
  const formattedTime = format(scheduledDate, 'h:mm a');

  const subtotal = price;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="gap-4 pb-6">
        <Text className="text-2xl font-bold text-gray-900">Booking Summary</Text>

        {/* Barber Info */}
        <Card>
          <View className="flex-row items-center gap-3">
            <Avatar source={barberAvatar} size="lg" fallback={barberName.charAt(0)} />
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-500">Barber</Text>
              <Text className="text-lg font-semibold text-gray-900">{barberName}</Text>
            </View>
          </View>
        </Card>

        {/* Service Details */}
        <Card>
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-gray-500">Service</Text>
              <Text className="text-lg font-semibold text-gray-900">{serviceName}</Text>
            </View>

            <View className="flex-row gap-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-500">Duration</Text>
                <Text className="text-base text-gray-900">{duration} minutes</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-500">Price</Text>
                <Text className="text-base text-gray-900">{formatCurrency(price)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Date & Time */}
        <Card>
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-gray-500">Date</Text>
              <Text className="text-base text-gray-900">{formattedDate}</Text>
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-500">Time</Text>
              <Text className="text-base text-gray-900">{formattedTime}</Text>
            </View>
          </View>
        </Card>

        {/* Location */}
        <Card>
          <View className="gap-3">
            <View>
              <Text className="text-sm font-medium text-gray-500">Location</Text>
              <Text className="text-base text-gray-900">{locationLabel[locationType]}</Text>
            </View>
            {locationType === 'in_home' && address && (
              <View>
                <Text className="text-sm font-medium text-gray-500">Address</Text>
                <Text className="text-base text-gray-900">{address}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Special Requests */}
        {specialRequests && (
          <Card>
            <View>
              <Text className="text-sm font-medium text-gray-500 mb-1">Special Requests</Text>
              <Text className="text-base text-gray-900">{specialRequests}</Text>
            </View>
          </Card>
        )}

        {/* Price Breakdown */}
        <Card>
          <View className="gap-3">
            <Text className="text-lg font-semibold text-gray-900 mb-2">Price Details</Text>

            <View className="flex-row justify-between">
              <Text className="text-base text-gray-600">Service</Text>
              <Text className="text-base text-gray-900">{formatCurrency(subtotal)}</Text>
            </View>

            {discount > 0 && (
              <View className="flex-row justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base text-green-600">Discount</Text>
                  {couponCode && <Text className="text-xs text-gray-500">({couponCode})</Text>}
                </View>
                <Text className="text-base text-green-600">-{formatCurrency(discountAmount)}</Text>
              </View>
            )}

            <View className="border-t border-gray-200 pt-3 mt-2">
              <View className="flex-row justify-between">
                <Text className="text-lg font-bold text-gray-900">Total</Text>
                <Text className="text-lg font-bold text-gray-900">{formatCurrency(total)}</Text>
              </View>
            </View>
          </View>
        </Card>

        <View className="bg-blue-50 p-4 rounded-lg">
          <Text className="text-sm text-blue-600 text-center">
            Please review all details before confirming your booking
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
