import { useState, useMemo, useCallback } from 'react';
import { ScrollView, Text, View, Alert, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

import { useAppointment, useBooking, useAvailability } from '@/features/bookings';
import type { AppointmentStatus, PaymentStatus } from '@/features/bookings';
import { Button, Card, Avatar, Badge, Modal } from '@/components/ui';
import type { Id } from '@convex/_generated/dataModel';
import { api } from '@convex/_generated/api';
import { useQuery as useConvexQuery } from 'convex/react';

const isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

// ---------------------------------------------------------------------------
// Status badge configuration for all 6 appointment statuses
// ---------------------------------------------------------------------------
const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; variant: 'warning' | 'info' | 'primary' | 'success' | 'danger' | 'default' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'primary' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  no_show: { label: 'No Show', variant: 'default' },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; variant: 'warning' | 'success' | 'default' | 'danger' }
> = {
  pending: { label: 'Payment Pending', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  refunded: { label: 'Refunded', variant: 'default' },
  failed: { label: 'Payment Failed', variant: 'danger' },
};

// ---------------------------------------------------------------------------
// Reschedule Modal
// ---------------------------------------------------------------------------
interface IRescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  barberId: string;
  currentDate: number;
  duration: number;
  onConfirm: (newTimestamp: number) => void;
  isSubmitting: boolean;
}

function RescheduleModal({
  visible,
  onClose,
  barberId,
  currentDate,
  _duration,
  onConfirm,
  isSubmitting,
}: IRescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState<number>(() => {
    // Default to tomorrow if current appointment is in the past
    const now = Date.now();
    const base = currentDate > now ? currentDate : now + 24 * 60 * 60 * 1000;
    const d = new Date(base);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // Generate next 14 days for date selection
  const availableDates = useMemo(() => {
    const dates: { timestamp: number; label: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const ts = d.getTime();
      let label = format(d, 'EEE, MMM d');
      if (isToday(d)) label = 'Today';
      else if (isTomorrow(d)) label = 'Tomorrow';
      dates.push({ timestamp: ts, label });
    }
    return dates;
  }, []);

  // Fetch availability for selected date
  const { availableSlots, isLoading: slotsLoading } = useAvailability({
    barberId,
    date: selectedDate,
    enabled: visible,
  });

  const handleDateSelect = useCallback((timestamp: number) => {
    setSelectedDate(timestamp);
    setSelectedSlot(null);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!selectedSlot) return;
    const [hours, minutes] = selectedSlot.split(':').map(Number);
    const d = new Date(selectedDate);
    d.setHours(hours, minutes, 0, 0);
    onConfirm(d.getTime());
  }, [selectedSlot, selectedDate, onConfirm]);

  return (
    <Modal visible={visible} onClose={onClose} title="Reschedule Appointment" size="lg">
      <View className="max-h-[500px]">
        {/* Date Selection */}
        <Text className="text-sm font-medium text-gray-500 mb-2">Select Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {availableDates.map((d) => (
              <Pressable
                key={d.timestamp}
                onPress={() => handleDateSelect(d.timestamp)}
                className={`px-4 py-2 rounded-lg border ${
                  selectedDate === d.timestamp
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedDate === d.timestamp ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {d.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Time Slots */}
        <Text className="text-sm font-medium text-gray-500 mb-2">Select Time</Text>
        {slotsLoading ? (
          <View className="items-center py-6">
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text className="text-gray-500 text-sm mt-2">Loading available times...</Text>
          </View>
        ) : availableSlots.length === 0 ? (
          <View className="items-center py-6">
            <Text className="text-gray-500 text-sm">No available slots on this date</Text>
          </View>
        ) : (
          <ScrollView className="max-h-[200px]" nestedScrollEnabled>
            <View className="flex-row flex-wrap gap-2">
              {availableSlots.map((slot: string) => {
                const [h, m] = slot.split(':').map(Number);
                const displayTime = format(new Date(2000, 0, 1, h, m), 'h:mm a');
                return (
                  <Pressable
                    key={slot}
                    onPress={() => setSelectedSlot(slot)}
                    className={`px-4 py-2 rounded-lg border ${
                      selectedSlot === slot
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selectedSlot === slot ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {displayTime}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Confirm Button */}
        <View className="mt-4 gap-2">
          <Button
            onPress={handleConfirm}
            disabled={!selectedSlot || isSubmitting}
            loading={isSubmitting}
            fullWidth
          >
            Confirm Reschedule
          </Button>
          <Button variant="ghost" onPress={onClose} fullWidth>
            Cancel
          </Button>
        </View>
      </View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------
export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const appointmentId = id as Id<'appointments'> | undefined;
  const { appointment, isLoading } = useAppointment(appointmentId);

  const receipt = useConvexQuery(
    isDevMode || !appointmentId ? 'skip' : api.receipts.queries.getReceiptByAppointmentId,
    isDevMode || !appointmentId ? 'skip' : { appointmentId: appointmentId }
  );

  const { cancelAppointment, rescheduleAppointment, isCanceling, isRescheduling } = useBooking({
    onSuccess: () => {
      setShowRescheduleModal(false);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Something went wrong');
    },
  });

  // -- Cancel Handler --
  const handleCancel = useCallback(() => {
    if (!appointmentId) return;
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAppointment(appointmentId, 'Cancelled by client');
              Alert.alert('Success', 'Appointment cancelled successfully', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch {
              // Error handled by onError callback
            }
          },
        },
      ]
    );
  }, [appointmentId, cancelAppointment, router]);

  // -- Reschedule Handler --
  const handleReschedule = useCallback(
    async (newTimestamp: number) => {
      if (!appointmentId) return;
      try {
        await rescheduleAppointment({
          appointmentId,
          newScheduledFor: newTimestamp,
        });
        Alert.alert('Success', 'Appointment rescheduled successfully');
      } catch {
        // Error handled by onError callback
      }
    },
    [appointmentId, rescheduleAppointment]
  );

  // -- Contact Barber --
  const handleContactBarber = useCallback(() => {
    if (!appointment) return;
    router.push(`/chat/${appointment.barberId}` as never);
  }, [appointment, router]);

  // -- View Receipt --
  const handleViewReceipt = useCallback(() => {
    if (receipt?._id) {
      router.push(`/(client)/receipts/${receipt._id}` as never);
    }
  }, [receipt, router]);

  // -----------------------------------------------------------------------
  // Loading State
  // -----------------------------------------------------------------------
  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading appointment...</Text>
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Error / Not Found State
  // -----------------------------------------------------------------------
  if (!appointment) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-4xl mb-4">📋</Text>
        <Text className="text-xl font-semibold text-gray-900 mb-2">Appointment Not Found</Text>
        <Text className="text-gray-600 text-center mb-6">
          The appointment you&apos;re looking for doesn&apos;t exist or has been removed.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  // -----------------------------------------------------------------------
  // Derived values
  // -----------------------------------------------------------------------
  const status = appointment.status as AppointmentStatus;
  const paymentStatus = appointment.paymentStatus as PaymentStatus;

  const formattedDate = format(new Date(appointment.scheduledFor), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(appointment.scheduledFor), 'h:mm a');

  const canCancel = status === 'pending' || status === 'confirmed';
  const canReschedule = status === 'pending' || status === 'confirmed';
  const showContactBarber =
    status !== 'cancelled' && status !== 'completed' && status !== 'no_show';

  const barberName =
    appointment.barber?.businessName || appointment.barber?.name || 'Unknown Barber';
  const barberAvatar = appointment.barber?.avatar;

  const locationLabel =
    appointment.locationType === 'in_home'
      ? 'Home Visit'
      : appointment.locationType === 'in_salon'
        ? 'At Salon'
        : appointment.locationType?.replace(/_/g, ' ') || 'Unknown';
  const locationEmoji = appointment.locationType === 'in_home' ? '🏠' : '💈';

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const paymentConfig = PAYMENT_STATUS_CONFIG[paymentStatus] || PAYMENT_STATUS_CONFIG.pending;

  const isAppointmentPast = isPast(new Date(appointment.scheduledFor));

  return (
    <View className="flex-1 bg-gray-50">
      {/* Confirmed Header Banner */}
      {status === 'confirmed' && !isAppointmentPast && (
        <View className="bg-green-500 p-6 items-center">
          <Text className="text-white text-2xl font-bold mb-1">Booking Confirmed</Text>
          <Text className="text-green-100">Your appointment has been confirmed</Text>
        </View>
      )}

      {/* In Progress Header Banner */}
      {status === 'in_progress' && (
        <View className="bg-blue-600 p-6 items-center">
          <Text className="text-white text-2xl font-bold mb-1">In Progress</Text>
          <Text className="text-blue-100">Your appointment is happening now</Text>
        </View>
      )}

      <ScrollView className="flex-1">
        <View className="p-6 gap-4">
          {/* Status Badges */}
          <View className="flex-row gap-2 flex-wrap">
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
            <Badge variant={paymentConfig.variant} size="sm">
              {paymentConfig.label}
            </Badge>
          </View>

          {/* Barber Info */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Barber</Text>
            <View className="flex-row items-center gap-3">
              <Avatar source={barberAvatar || 'https://via.placeholder.com/100'} size="lg" />
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900">{barberName}</Text>
                {appointment.barber?.name && appointment.barber?.businessName && (
                  <Text className="text-gray-600">{appointment.barber.name}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Service Details */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Service Details</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Service</Text>
                <Text className="font-semibold text-gray-900">{appointment.serviceName}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Duration</Text>
                <Text className="font-semibold text-gray-900">{appointment.duration} min</Text>
              </View>
              <View className="flex-row justify-between border-t border-gray-100 pt-2">
                <Text className="text-gray-700 font-medium">Price</Text>
                <Text className="font-bold text-gray-900 text-lg">
                  ${(appointment.price / 100).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card>

          {/* Date & Time */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Date & Time</Text>
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">📅</Text>
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-900">{formattedDate}</Text>
                <Text className="text-gray-700 mt-1">{formattedTime}</Text>
              </View>
            </View>
          </Card>

          {/* Location */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Location</Text>
            <View className="flex-row items-start gap-3">
              <Text className="text-2xl">{locationEmoji}</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900">{locationLabel}</Text>
                {appointment.address && (
                  <Text className="text-gray-600 mt-1">{appointment.address}</Text>
                )}
              </View>
            </View>
          </Card>

          {/* Special Requests */}
          {appointment.specialRequests && (
            <Card className="p-4">
              <Text className="text-sm font-medium text-gray-500 mb-3">Special Requests</Text>
              <Text className="text-gray-700">{appointment.specialRequests}</Text>
            </Card>
          )}

          {/* Appointment ID */}
          <Card className="p-4 bg-gray-100">
            <Text className="text-xs text-gray-500 mb-1">Appointment ID</Text>
            <Text className="text-sm font-mono text-gray-700">{appointment._id}</Text>
          </Card>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View className="p-6 bg-white border-t border-gray-200 gap-3">
        {/* View Receipt Button - shown if payment is completed and receipt exists */}
        {receipt && appointment?.paymentStatus === 'paid' && (
          <Button variant="outline" onPress={handleViewReceipt} fullWidth>
            View Receipt
          </Button>
        )}
        {showContactBarber && (
          <Button variant="outline" onPress={handleContactBarber} fullWidth>
            Contact Barber
          </Button>
        )}
        {canReschedule && (
          <Button variant="secondary" onPress={() => setShowRescheduleModal(true)} fullWidth>
            Reschedule Appointment
          </Button>
        )}
        {canCancel && (
          <Button
            variant="danger"
            onPress={handleCancel}
            disabled={isCanceling}
            loading={isCanceling}
            fullWidth
          >
            {isCanceling ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        )}
        {!canCancel && !showContactBarber && !receipt && (
          <Button onPress={() => router.push('/appointments' as never)} fullWidth>
            View All Appointments
          </Button>
        )}
      </View>

      {/* Reschedule Modal */}
      {canReschedule && (
        <RescheduleModal
          visible={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          barberId={appointment.barberId}
          currentDate={appointment.scheduledFor}
          duration={appointment.duration}
          onConfirm={handleReschedule}
          isSubmitting={isRescheduling}
        />
      )}
    </View>
  );
}
