import { useState } from 'react';
import { ScrollView, Text, View, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { BookingSummary } from '@/components/booking';
import { Button, Card } from '@/components/ui';
import { useBooking } from '@/features/bookings';
import { bookingFormAtom } from './form';
import { bookingScheduleAtom } from './schedule';

export default function CheckoutScreen() {
  const router = useRouter();
  const [bookingForm] = useAtom(bookingFormAtom);
  const [bookingSchedule] = useAtom(bookingScheduleAtom);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);

  const { createAppointment, isCreating } = useBooking({
    onSuccess: (appointment) => {
      // Clear form data
      Alert.alert('Booking Confirmed!', 'Your appointment has been successfully booked.', [
        {
          text: 'View Appointment',
          onPress: () => router.replace(`/appointments/${appointment._id}`),
        },
      ]);
    },
    onError: (error) => {
      Alert.alert(
        'Booking Failed',
        error.message || 'Failed to create appointment. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const handleApplyCoupon = async () => {
    // TODO: Implement coupon validation when payment feature is ready
    // For now, just simulate
    if (couponCode.toUpperCase() === 'SAVE10') {
      setAppliedCoupon(couponCode);
      setDiscount(10);
      Alert.alert('Success', 'Coupon applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'The coupon code is invalid or expired.');
    }
  };

  const handleConfirmBooking = () => {
    if (!bookingSchedule.selectedTime || !bookingForm.barberId || !bookingForm.hairType) {
      Alert.alert('Error', 'Missing booking information. Please go back and complete the form.');
      return;
    }

    createAppointment.mutate({
      barberId: bookingForm.barberId,
      serviceType: bookingForm.serviceType || 'haircut',
      hairType: bookingForm.hairType,
      scheduledFor: bookingSchedule.selectedTime,
      location: {
        type: bookingForm.locationType || 'in_salon',
        address: bookingForm.address,
      },
      specialRequests: bookingForm.specialRequests,
      appliedCouponId: appliedCoupon,
    });
  };

  // Mock data - in real app, this would come from barber profile
  const mockBarberName = 'John Doe';
  const mockServiceName = bookingForm.serviceType || 'Haircut';
  const mockServicePrice = 50;
  const mockServiceDuration = 60;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Checkout</Text>
        <Text className="text-gray-600">Review and confirm your booking</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Booking Summary */}
          {bookingForm.hairType && bookingSchedule.selectedTime && (
            <BookingSummary
              barberName={mockBarberName}
              serviceName={mockServiceName}
              servicePrice={mockServicePrice}
              serviceDuration={mockServiceDuration}
              hairType={bookingForm.hairType}
              scheduledFor={bookingSchedule.selectedTime}
              location={{
                type: bookingForm.locationType || 'in_salon',
                address: bookingForm.address,
              }}
              specialRequests={bookingForm.specialRequests}
              discount={discount}
              couponCode={appliedCoupon}
            />
          )}

          {/* Coupon Code */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Have a Coupon?</Text>
            <View className="flex-row gap-2">
              <TextInput
                className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                placeholder="Enter coupon code"
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
              />
              <Button
                variant="outline"
                onPress={handleApplyCoupon}
                disabled={!couponCode || !!appliedCoupon}
              >
                Apply
              </Button>
            </View>
            {appliedCoupon && (
              <Text className="text-green-600 text-sm mt-2">
                ✓ Coupon "{appliedCoupon}" applied
              </Text>
            )}
          </Card>

          {/* Payment Method */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Payment Method</Text>
            <Text className="text-gray-600">
              Payment will be processed securely after the barber confirms your appointment.
            </Text>
          </Card>

          {/* Terms & Conditions */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Text className="text-sm text-gray-700">
              By confirming this booking, you agree to our Terms of Service and Cancellation Policy.
              You can cancel free of charge up to 24 hours before the appointment.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleConfirmBooking} disabled={isCreating} size="lg">
          {isCreating ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="white" />
              <Text className="text-white font-semibold">Processing...</Text>
            </View>
          ) : (
            'Confirm Booking'
          )}
        </Button>
      </View>
    </View>
  );
}
