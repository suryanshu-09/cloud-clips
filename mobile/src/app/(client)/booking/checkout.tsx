import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { useQuery as useConvexQuery, useAction, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { BookingSummary } from '@/components/booking';
import { Button, Card } from '@/components/ui';
import { useBooking } from '@/features/bookings';
import { useCoupon } from '@/features/payments';
import {
  useStripePayment,
  useSavedCards,
  usePlatformPay,
} from '@/features/payments/services/stripeService';
import type { IPaymentMethod } from '@/features/payments/types';
import { PaymentSheet, PaymentMethodSelector } from '@/components/payments';
import type { IPaymentResult } from '@/features/payments/services/stripeService';
import { bookingFormAtom } from './form';
import { bookingScheduleAtom } from './schedule';
import { CouponInput } from '@/components/product';

export default function CheckoutScreen() {
  const router = useRouter();
  const [bookingForm] = useAtom(bookingFormAtom);
  const [bookingSchedule] = useAtom(bookingScheduleAtom);

  // Fetch real barber profile data from Convex
  const barberProfile = useConvexQuery(
    api.barbers.queries.getBarberById,
    bookingForm.barberId ? { barberId: bookingForm.barberId as Id<'barberProfiles'> } : 'skip'
  );

  // Convex action for creating payment intent (requires appointmentId)
  const createPaymentIntent = useAction(api.payments.actions.createPaymentIntent);
  const trackCouponUsage = useMutation(api.coupons.mutations.trackUsage);

  // Payment state
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [savedCards, setSavedCards] = useState<IPaymentMethod[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Coupon state
  const { appliedCoupon, discountAmount, removeCoupon, hasCouponApplied } = useCoupon();

  // Payment Sheet state
  const [paymentSheetClientSecret, setPaymentSheetClientSecret] = useState<string | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  // Hooks
  const { isConfigured } = useStripePayment();
  const { fetchSavedCards } = useSavedCards();
  const { checkPlatformPaySupport, processWithPlatformPay } = usePlatformPay();

  const [createdAppointmentId, setCreatedAppointmentId] = useState<string | null>(null);

  const { createAppointment, isBooking } = useBooking({
    onSuccess: (appointmentId: string) => {
      setCreatedAppointmentId(appointmentId);
      // Navigate to confirmation screen
      router.push({
        pathname: '/(client)/booking/confirmation',
        params: {
          appointmentId,
          paymentStatus: isConfigured ? 'pending' : 'completed',
        },
      });
    },
    onError: (error) => {
      setBookingError(error.message || 'Failed to create appointment.');
      Alert.alert(
        'Booking Failed',
        error.message || 'Failed to create appointment. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Real service data from booking form atoms (populated by form screen)
  const barberName = barberProfile?.user?.name || 'Loading...';
  const barberAvatar = barberProfile?.user?.avatar;
  const serviceName = bookingForm.serviceName || 'Service';
  const servicePrice = bookingForm.price || 0;
  const serviceDuration = bookingForm.duration || 0;

  // Resolve the barber's userId for the bookAppointment mutation
  // The backend bookAppointment expects barberId as Id<'users'>, not Id<'barberProfiles'>
  const barberUserId = barberProfile?.userId;

  // Calculate total
  const subtotal = servicePrice;
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

  /**
   * Handle payment success from PaymentSheet
   */
  const handlePaymentSuccess = useCallback(
    (_result: IPaymentResult) => {
      setShowPaymentSheet(false);
      setPaymentSheetClientSecret(null);
      setIsProcessingPayment(false);
      // Navigate to confirmation screen with paid status
      if (createdAppointmentId) {
        router.push({
          pathname: '/(client)/booking/confirmation',
          params: {
            appointmentId: createdAppointmentId,
            paymentStatus: 'paid',
          },
        });
      }
    },
    [createdAppointmentId, router]
  );

  /**
   * Handle payment error from PaymentSheet
   */
  const handlePaymentError = useCallback(
    (_error: { code: string; message: string }) => {
      setIsProcessingPayment(false);
      setShowPaymentSheet(false);
      setPaymentSheetClientSecret(null);
      // Navigate to confirmation screen with failed status
      if (createdAppointmentId) {
        router.push({
          pathname: '/(client)/booking/confirmation',
          params: {
            appointmentId: createdAppointmentId,
            paymentStatus: 'failed',
          },
        });
      }
    },
    [createdAppointmentId, router]
  );

  /**
   * Handle payment cancellation from PaymentSheet
   */
  const handlePaymentCancel = useCallback(() => {
    setIsProcessingPayment(false);
    setShowPaymentSheet(false);
    setPaymentSheetClientSecret(null);
    // Navigate to confirmation screen with pending status
    if (createdAppointmentId) {
      router.push({
        pathname: '/(client)/booking/confirmation',
        params: {
          appointmentId: createdAppointmentId,
          paymentStatus: 'pending',
        },
      });
    }
  }, [createdAppointmentId, router]);

  /**
   * Core booking confirmation logic.
   *
   * Flow:
   * 1. Create the appointment via Convex mutation (status: pending, paymentStatus: pending)
   * 2. If Stripe is configured, create a PaymentIntent using the returned appointmentId
   * 3. Show Payment Sheet for secure card input with 3D Secure support
   * 4. Payment status is updated by Stripe webhook on the backend
   *
   * If Stripe is not configured (dev mode), the booking is created without payment.
   */
  const handleConfirmBooking = useCallback(async () => {
    setBookingError(null);

    if (!bookingSchedule.selectedTime || !bookingForm.barberId || !bookingForm.serviceId) {
      Alert.alert('Error', 'Missing booking information. Please go back and complete the form.');
      return;
    }

    if (!barberUserId) {
      Alert.alert('Error', 'Unable to load barber information. Please try again.');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // Step 1: Create appointment in Convex
      const appointmentId = await createAppointment({
        barberId: barberUserId as Id<'users'>,
        serviceId: bookingForm.serviceId,
        serviceName: bookingForm.serviceName || 'Service',
        scheduledFor: bookingSchedule.selectedTime,
        locationType: bookingForm.locationType || 'in_salon',
        address: bookingForm.address,
        addressCoords: bookingForm.addressCoords,
        specialRequests: bookingForm.specialRequests,
        duration: bookingForm.duration || 60,
        price: bookingForm.price || 0,
      });

      // Step 1.5: Track coupon usage if a coupon was applied
      if (hasCouponApplied && appliedCoupon && discountAmount > 0 && appointmentId) {
        try {
          await trackCouponUsage({
            couponCode: appliedCoupon.code,
            appointmentId: appointmentId as Id<'appointments'>,
            amount: servicePrice,
            discountAmount: discountAmount,
          });
        } catch (couponError) {
          console.error('Failed to track coupon usage:', couponError);
        }
      }

      // Step 2: If Stripe is configured, create payment intent and show Payment Sheet
      if (isConfigured && appointmentId) {
        try {
          // Create payment intent via Convex action
          const { clientSecret } = await createPaymentIntent({
            amount: Math.round(total * 100), // Convert to cents
            appointmentId: appointmentId as Id<'appointments'>,
          });

          // Show Payment Sheet component for secure payment with 3D Secure support
          setPaymentSheetClientSecret(clientSecret);
          setShowPaymentSheet(true);
          return;
        } catch (paymentError) {
          const err = paymentError as Error;
          console.error('Payment intent creation error:', err);
          setIsProcessingPayment(false);
          Alert.alert(
            'Payment Setup Error',
            'Your appointment was created but we could not set up payment. ' +
              'Please try again from your appointments.',
            [{ text: 'OK', onPress: () => router.replace('/(client)') }]
          );
          return;
        }
      }

      // Success is handled by the useBooking onSuccess callback for non-Stripe mode
      setIsProcessingPayment(false);
    } catch {
      // Error handled by useBooking onError callback
      setIsProcessingPayment(false);
    }
  }, [
    bookingSchedule.selectedTime,
    bookingForm,
    barberUserId,
    createAppointment,
    isConfigured,
    createPaymentIntent,
    total,
    hasCouponApplied,
    appliedCoupon,
    discountAmount,
    trackCouponUsage,
    servicePrice,
  ]);

  const handlePayWithPlatformPay = useCallback(async () => {
    setBookingError(null);

    if (!bookingSchedule.selectedTime || !bookingForm.barberId || !bookingForm.serviceId) {
      Alert.alert('Error', 'Missing booking information. Please go back and complete the form.');
      return;
    }

    if (!barberUserId) {
      Alert.alert('Error', 'Unable to load barber information. Please try again.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Step 1: Create appointment first
      const appointmentId = await createAppointment({
        barberId: barberUserId as Id<'users'>,
        serviceId: bookingForm.serviceId,
        serviceName: bookingForm.serviceName || 'Service',
        scheduledFor: bookingSchedule.selectedTime,
        locationType: bookingForm.locationType || 'in_salon',
        address: bookingForm.address,
        addressCoords: bookingForm.addressCoords,
        specialRequests: bookingForm.specialRequests,
        duration: bookingForm.duration || 60,
        price: bookingForm.price || 0,
      });

      if (!appointmentId) {
        Alert.alert('Error', 'Failed to create appointment.');
        return;
      }

      // Step 1.5: Track coupon usage if a coupon was applied
      if (hasCouponApplied && appliedCoupon && discountAmount > 0) {
        try {
          await trackCouponUsage({
            couponCode: appliedCoupon.code,
            appointmentId: appointmentId as Id<'appointments'>,
            amount: servicePrice,
            discountAmount: discountAmount,
          });
        } catch (couponError) {
          console.error('Failed to track coupon usage:', couponError);
        }
      }

      // Step 2: Process payment with platform pay
      const result = await processWithPlatformPay(total, 'usd', appointmentId as string, undefined);

      // Navigate to confirmation with appropriate status
      router.push({
        pathname: '/(client)/booking/confirmation',
        params: {
          appointmentId: appointmentId as string,
          paymentStatus: result.success ? 'paid' : 'failed',
        },
      });
    } catch (error) {
      const err = error as Error;
      Alert.alert('Error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessingPayment(false);
    }
  }, [
    bookingSchedule.selectedTime,
    bookingForm,
    barberUserId,
    createAppointment,
    total,
    processWithPlatformPay,
    router,
    hasCouponApplied,
    appliedCoupon,
    discountAmount,
    trackCouponUsage,
    servicePrice,
  ]);

  const isLoading = isProcessingPayment || isBooking;

  // Show loading state while barber profile is being fetched
  if (barberProfile === undefined && bookingForm.barberId) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0066CC" />
        <Text className="text-gray-600 mt-4">Loading booking details...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Checkout</Text>
        <Text className="text-gray-600">Review and confirm your booking</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Error Banner */}
          {bookingError && (
            <Card className="p-4 bg-red-50 border-red-200">
              <Text className="text-red-800 font-medium">Error</Text>
              <Text className="text-red-700 text-sm mt-1">{bookingError}</Text>
            </Card>
          )}

          {/* Booking Summary */}
          {bookingForm.serviceId && bookingSchedule.selectedTime && (
            <BookingSummary
              barberName={barberName}
              barberAvatar={barberAvatar}
              serviceName={serviceName}
              price={servicePrice}
              duration={serviceDuration}
              scheduledFor={bookingSchedule.selectedTime}
              locationType={bookingForm.locationType || 'in_salon'}
              address={bookingForm.address}
              specialRequests={bookingForm.specialRequests}
              discount={hasCouponApplied ? (discountAmount / subtotal) * 100 : 0}
              couponCode={appliedCoupon?.code}
            />
          )}

          {/* Coupon Code */}
          <Card className="p-4">
            <CouponInput
              amount={servicePrice}
              barberId={barberUserId}
              onCouponApplied={(_coupon, _discount) => {
                // Coupon applied successfully
              }}
              onCouponRemoved={() => {
                removeCoupon();
              }}
            />
          </Card>

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            savedCards={savedCards}
            isLoading={isLoadingCards}
            isConfigured={isConfigured}
            isPlatformPayAvailable={isPlatformPayAvailable}
            selectedCardId={selectedCardId}
            onSelectCard={setSelectedCardId}
            onPlatformPay={handlePayWithPlatformPay}
            disabled={isLoading}
            testID="checkout-payment-selector"
          />

          {/* Price Breakdown */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Price Summary</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">{serviceName}</Text>
                <Text className="text-gray-900">${subtotal.toFixed(2)}</Text>
              </View>
              {hasCouponApplied && discountAmount > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-green-600">Discount ({appliedCoupon?.code})</Text>
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

          {/* Payment Sheet - shown when payment intent is created */}
          {showPaymentSheet && paymentSheetClientSecret && (
            <PaymentSheet
              clientSecret={paymentSheetClientSecret}
              merchantDisplayName="Cloud Clips"
              amount={Math.round(total * 100)}
              currency="USD"
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              onPaymentCancel={handlePaymentCancel}
              testID="checkout-payment-sheet"
            />
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button
          onPress={handleConfirmBooking}
          disabled={isLoading || !barberUserId}
          size="lg"
          className="w-full"
        >
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
