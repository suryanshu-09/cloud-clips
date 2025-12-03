import { useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { BookingSummary } from '@/components/booking';
import { Button, Card } from '@/components/ui';
import { useBooking } from '@/features/bookings';
import {
  useStripePayment,
  useSavedCards,
  usePlatformPay,
  isStripeConfigured,
} from '@/features/payments/services/stripeService';
import type { IPaymentMethod } from '@/features/payments/types';
import { bookingFormAtom } from './form';
import { bookingScheduleAtom } from './schedule';

// Card brand icons (you can replace with actual icons)
const CARD_BRAND_DISPLAY: Record<string, string> = {
  visa: 'Visa',
  mastercard: 'Mastercard',
  amex: 'American Express',
  discover: 'Discover',
  diners: 'Diners Club',
  jcb: 'JCB',
  unionpay: 'UnionPay',
  unknown: 'Card',
};

export default function CheckoutScreen() {
  const router = useRouter();
  const [bookingForm] = useAtom(bookingFormAtom);
  const [bookingSchedule] = useAtom(bookingScheduleAtom);

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [savedCards, setSavedCards] = useState<IPaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(true);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);

  // Hooks
  const { processPaymentWithSheet, confirmPaymentWithMethod, isConfigured } = useStripePayment();
  const { fetchSavedCards } = useSavedCards();
  const { checkPlatformPaySupport, processWithPlatformPay } = usePlatformPay();

  const { createAppointment, isCreating } = useBooking({
    onSuccess: (appointment) => {
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

  // Mock data - in real app, this would come from barber profile
  const mockBarberName = 'John Doe';
  const mockServiceName = bookingForm.serviceType || 'Haircut';
  const mockServicePrice = 50;
  const mockServiceDuration = 60;

  // Calculate total
  const subtotal = mockServicePrice;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;

  // Load saved cards and check platform pay availability
  useEffect(() => {
    const loadPaymentOptions = async () => {
      if (!isConfigured) {
        setIsLoadingCards(false);
        return;
      }

      try {
        // Fetch saved cards
        const cards = await fetchSavedCards();
        setSavedCards(cards);

        // Set default card as selected
        const defaultCard = cards.find((c) => c.isDefault);
        if (defaultCard) {
          setSelectedCardId(defaultCard.id);
        }

        // Check platform pay support
        const platformPaySupported = await checkPlatformPaySupport();
        setIsPlatformPayAvailable(platformPaySupported);
      } catch (error) {
        console.error('Failed to load payment options:', error);
      } finally {
        setIsLoadingCards(false);
      }
    };

    loadPaymentOptions();
  }, [isConfigured, fetchSavedCards, checkPlatformPaySupport]);

  const handleApplyCoupon = useCallback(async () => {
    // TODO: Validate coupon with backend
    if (couponCode.toUpperCase() === 'SAVE10') {
      setAppliedCoupon(couponCode);
      setDiscount(10);
      Alert.alert('Success', 'Coupon applied successfully!');
    } else if (couponCode.toUpperCase() === 'FIRST20') {
      setAppliedCoupon(couponCode);
      setDiscount(20);
      Alert.alert('Success', 'Coupon applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'The coupon code is invalid or expired.');
    }
  }, [couponCode]);

  const handleRemoveCoupon = useCallback(() => {
    setAppliedCoupon(undefined);
    setDiscount(0);
    setCouponCode('');
  }, []);

  const handlePayWithSheet = useCallback(async () => {
    if (!isConfigured) {
      // Skip payment in dev mode, just create booking
      handleConfirmBooking();
      return;
    }

    setIsProcessingPayment(true);
    try {
      const result = await processPaymentWithSheet(
        total,
        'usd',
        undefined, // appointmentId - we'll get this after booking
        undefined // orderId
      );

      if (result.success) {
        // Payment successful, create the appointment
        handleConfirmBooking(result.paymentIntentId);
      } else {
        Alert.alert('Payment Failed', result.error?.message || 'Please try again.');
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert('Payment Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [isConfigured, total, processPaymentWithSheet]);

  const handlePayWithPlatformPay = useCallback(async () => {
    setIsProcessingPayment(true);
    try {
      const result = await processWithPlatformPay(total, 'usd');

      if (result.success) {
        handleConfirmBooking(result.paymentIntentId);
      } else {
        Alert.alert('Payment Failed', result.error?.message || 'Please try again.');
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert('Payment Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [total, processWithPlatformPay]);

  const handleConfirmBooking = useCallback(
    (paymentIntentId?: string) => {
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
        paymentIntentId,
      });
    },
    [bookingSchedule.selectedTime, bookingForm, appliedCoupon, createAppointment]
  );

  const isLoading = isCreating || isProcessingPayment;

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
            {appliedCoupon ? (
              <View className="flex-row items-center justify-between bg-green-50 p-3 rounded-lg">
                <View>
                  <Text className="text-green-700 font-medium">Coupon Applied</Text>
                  <Text className="text-green-600 text-sm">
                    {appliedCoupon.toUpperCase()} - {discount}% off
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleRemoveCoupon}
                  className="bg-green-100 px-3 py-1 rounded"
                >
                  <Text className="text-green-700">Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={setCouponCode}
                  autoCapitalize="characters"
                />
                <Button variant="outline" onPress={handleApplyCoupon} disabled={!couponCode}>
                  Apply
                </Button>
              </View>
            )}
          </Card>

          {/* Payment Method Selection */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Payment Method</Text>

            {isLoadingCards ? (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#0ea5e9" />
                <Text className="text-gray-500 mt-2">Loading payment options...</Text>
              </View>
            ) : !isConfigured ? (
              <View className="bg-yellow-50 p-4 rounded-lg">
                <Text className="text-yellow-800 font-medium">Development Mode</Text>
                <Text className="text-yellow-700 text-sm mt-1">
                  Payment processing is disabled. Booking will proceed without payment.
                </Text>
              </View>
            ) : (
              <>
                {/* Saved Cards */}
                {savedCards.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-sm text-gray-600 mb-2">Saved Cards</Text>
                    {savedCards.map((card) => (
                      <TouchableOpacity
                        key={card.id}
                        onPress={() => setSelectedCardId(card.id)}
                        className={`flex-row items-center p-3 rounded-lg border mb-2 ${
                          selectedCardId === card.id
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <View className="w-10 h-6 bg-gray-100 rounded items-center justify-center mr-3">
                          <Text className="text-xs font-bold text-gray-600">
                            {CARD_BRAND_DISPLAY[card.card?.brand || 'unknown']?.slice(0, 2) || '??'}
                          </Text>
                        </View>
                        <View className="flex-1">
                          <Text className="font-medium text-gray-900">
                            {CARD_BRAND_DISPLAY[card.card?.brand || 'unknown'] || 'Card'} ****{' '}
                            {card.card?.last4}
                          </Text>
                          <Text className="text-sm text-gray-500">
                            Expires {card.card?.expiryMonth}/{card.card?.expiryYear}
                          </Text>
                        </View>
                        {card.isDefault && (
                          <View className="bg-sky-100 px-2 py-1 rounded">
                            <Text className="text-sky-700 text-xs font-medium">Default</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Add New Card / Payment Sheet */}
                <TouchableOpacity
                  onPress={() => setSelectedCardId(null)}
                  className={`flex-row items-center p-3 rounded-lg border mb-2 ${
                    selectedCardId === null
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <View className="w-10 h-6 bg-gray-100 rounded items-center justify-center mr-3">
                    <Text className="text-lg text-gray-400">+</Text>
                  </View>
                  <Text className="font-medium text-gray-900">Add New Card</Text>
                </TouchableOpacity>

                {/* Platform Pay Options */}
                {isPlatformPayAvailable && (
                  <View className="mt-4 pt-4 border-t border-gray-100">
                    <Text className="text-sm text-gray-600 mb-2">Express Checkout</Text>
                    <Button
                      variant="outline"
                      onPress={handlePayWithPlatformPay}
                      disabled={isLoading}
                      className="mb-2"
                    >
                      Pay with Apple Pay / Google Pay
                    </Button>
                  </View>
                )}
              </>
            )}
          </Card>

          {/* Price Breakdown */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Price Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Subtotal</Text>
                <Text className="text-gray-900">${subtotal.toFixed(2)}</Text>
              </View>
              {discount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-green-600">Discount ({discount}%)</Text>
                  <Text className="text-green-600">-${discountAmount.toFixed(2)}</Text>
                </View>
              )}
              <View className="flex-row justify-between pt-2 border-t border-gray-100 mt-2">
                <Text className="font-semibold text-gray-900">Total</Text>
                <Text className="font-bold text-xl text-gray-900">${total.toFixed(2)}</Text>
              </View>
            </View>
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
        <Button onPress={handlePayWithSheet} disabled={isLoading} size="lg" className="w-full">
          {isLoading ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="white" size="small" />
              <Text className="text-white font-semibold">Processing...</Text>
            </View>
          ) : (
            `Pay $${total.toFixed(2)} & Confirm`
          )}
        </Button>

        {/* Test card hint in development */}
        {__DEV__ && isConfigured && (
          <Text className="text-center text-gray-400 text-xs mt-3">
            Test Card: 4242 4242 4242 4242 | Exp: 12/34 | CVC: 123
          </Text>
        )}
      </View>
    </View>
  );
}
