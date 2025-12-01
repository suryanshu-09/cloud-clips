import { ScrollView, Text, View, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppointment, useBooking } from '@/features/bookings';
import { Button, Card, Avatar, Badge } from '@/components/ui';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PAYMENT_STATUS_COLORS = {
  pending: 'bg-orange-100 text-orange-800',
  completed: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
};

export default function AppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const { appointment, isLoading } = useAppointment(id);
  const { cancelAppointment, isCancelling } = useBooking({
    onSuccess: () => {
      Alert.alert('Success', 'Appointment cancelled successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to cancel appointment');
    },
  });

  const handleCancel = () => {
    Alert.alert(
      'Cancel Appointment',
      'Are you sure you want to cancel this appointment? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => cancelAppointment.mutate({ id, reason: 'Cancelled by client' }),
        },
      ]
    );
  };

  const handleContactBarber = () => {
    // Navigate to chat
    router.push(`/chat/${appointment?.barberId}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading appointment...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-xl font-semibold text-gray-900 mb-2">Appointment Not Found</Text>
        <Text className="text-gray-600 text-center mb-6">
          The appointment you're looking for doesn't exist or has been removed.
        </Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </View>
    );
  }

  const formattedDate = new Date(appointment.scheduledFor).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = new Date(appointment.scheduledFor).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const showContactBarber =
    appointment.status !== 'cancelled' && appointment.status !== 'completed';

  return (
    <View className="flex-1 bg-gray-50">
      {/* Success Header */}
      {appointment.status === 'confirmed' && (
        <View className="bg-green-500 p-6 items-center">
          <Text className="text-white text-2xl font-bold mb-1">✓ Booking Confirmed</Text>
          <Text className="text-green-100">Your appointment has been confirmed</Text>
        </View>
      )}

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Status Badges */}
          <View className="flex-row gap-2">
            <Badge className={STATUS_COLORS[appointment.status]}>
              {appointment.status.toUpperCase()}
            </Badge>
            <Badge className={PAYMENT_STATUS_COLORS[appointment.paymentStatus]}>
              Payment: {appointment.paymentStatus}
            </Badge>
          </View>

          {/* Barber Info */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Barber</Text>
            <View className="flex-row items-center gap-3">
              <Avatar source={{ uri: 'https://via.placeholder.com/100' }} size="lg" />
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900">{appointment.barberId}</Text>
                <Text className="text-gray-600">Professional Barber</Text>
              </View>
            </View>
          </Card>

          {/* Service Details */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Service Details</Text>
            <View className="space-y-2">
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Service</Text>
                <Text className="font-semibold text-gray-900">{appointment.serviceType}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Hair Type</Text>
                <Text className="font-semibold text-gray-900 capitalize">
                  {appointment.hairType}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Duration</Text>
                <Text className="font-semibold text-gray-900">{appointment.duration} min</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-gray-700">Price</Text>
                <Text className="font-semibold text-gray-900">${appointment.price}</Text>
              </View>
            </View>
          </Card>

          {/* Date & Time */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Date & Time</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-1">{formattedDate}</Text>
            <Text className="text-gray-700">{formattedTime}</Text>
          </Card>

          {/* Location */}
          <Card className="p-4">
            <Text className="text-sm font-medium text-gray-500 mb-3">Location</Text>
            <View className="flex-row items-start gap-2">
              <Text className="text-2xl">
                {appointment.location.type === 'in_home' ? '🏠' : '💈'}
              </Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 capitalize">
                  {appointment.location.type.replace('_', ' ')}
                </Text>
                {appointment.location.address && (
                  <Text className="text-gray-600 mt-1">{appointment.location.address}</Text>
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
      <View className="p-6 bg-white border-t border-gray-200 space-y-3">
        {showContactBarber && (
          <Button variant="outline" onPress={handleContactBarber}>
            Contact Barber
          </Button>
        )}
        {canCancel && (
          <Button variant="destructive" onPress={handleCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
          </Button>
        )}
        {!canCancel && !showContactBarber && (
          <Button onPress={() => router.push('/appointments')}>View All Appointments</Button>
        )}
      </View>
    </View>
  );
}
