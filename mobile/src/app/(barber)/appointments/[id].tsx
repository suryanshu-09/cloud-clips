import { useState } from 'react';
import { ScrollView, Text, View, Alert, Linking, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { format } from 'date-fns';
import { Card, Button, Badge, Avatar } from '@/components/ui';

type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export default function BarberAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const appointment = useQuery(
    api.appointments.queries.getAppointmentById,
    id ? { appointmentId: id as Id<'appointments'> } : 'skip'
  );

  const updateStatus = useMutation(api.appointments.mutations.updateAppointmentStatus);
  const cancelAppointment = useMutation(api.appointments.mutations.cancelAppointment);

  // Loading state
  if (appointment === undefined) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading appointment details...</Text>
      </View>
    );
  }

  // Not found state
  if (appointment === null) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-lg font-semibold text-gray-900 mb-2">Appointment Not Found</Text>
        <Text className="text-gray-600 text-center mb-4">
          This appointment may have been deleted or you don't have access to it.
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  const handleConfirm = async () => {
    Alert.alert('Confirm Appointment', 'Are you sure you want to confirm this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await updateStatus({
              appointmentId: appointment._id,
              status: 'confirmed',
            });
            Alert.alert('Success', 'Appointment confirmed successfully!');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Failed to confirm appointment';
            Alert.alert('Error', message);
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    Alert.alert('Reject Appointment', 'Are you sure you want to reject this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            await cancelAppointment({
              appointmentId: appointment._id,
            });
            Alert.alert('Success', 'Appointment rejected');
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to reject appointment';
            Alert.alert('Error', message);
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleStartService = async () => {
    setIsProcessing(true);
    try {
      await updateStatus({
        appointmentId: appointment._id,
        status: 'in_progress',
      });
      Alert.alert('Success', 'Service started');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start service';
      Alert.alert('Error', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteService = async () => {
    setIsProcessing(true);
    try {
      await updateStatus({
        appointmentId: appointment._id,
        status: 'completed',
      });
      Alert.alert('Success', 'Service completed! Payment will be processed.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to complete service';
      Alert.alert('Error', message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    if (appointment.client?.phone) {
      Linking.openURL(`tel:${appointment.client.phone}`);
    }
  };

  const handleMessage = () => {
    if (appointment.client?.phone) {
      Linking.openURL(`sms:${appointment.client.phone}`);
    }
  };

  const handleNavigate = () => {
    if (appointment.addressCoords) {
      const { lat, lng } = appointment.addressCoords;
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    }
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'no_show':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPaymentStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'refunded':
        return 'info';
      case 'failed':
        return 'danger';
      default:
        return 'default';
    }
  };

  const formatStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const formattedDate = format(new Date(appointment.scheduledFor), 'EEEE, MMMM d, yyyy');
  const formattedTime = format(new Date(appointment.scheduledFor), 'h:mm a');
  const locationLabel = appointment.locationType === 'in_home' ? 'Home Service' : 'In Salon';

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Status */}
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Status</Text>
              <Badge
                variant={getStatusBadgeVariant(appointment.status as AppointmentStatus)}
                size="lg"
              >
                {formatStatusLabel(appointment.status)}
              </Badge>
            </View>
          </Card>

          {/* Client Info */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Client Information</Text>
            <View className="flex-row items-center gap-3 mb-4">
              <Avatar
                size="lg"
                source={appointment.client?.avatar}
                fallback={appointment.client?.name?.charAt(0) ?? '?'}
              />
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">
                  {appointment.client?.name ?? 'Unknown Client'}
                </Text>
              </View>
            </View>

            {appointment.client?.phone && (
              <View className="space-y-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base">📞</Text>
                  <Text className="text-sm text-gray-700">{appointment.client.phone}</Text>
                </View>
              </View>
            )}

            <View className="flex-row gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onPress={handleCall}
                disabled={!appointment.client?.phone}
                className="flex-1"
              >
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={handleMessage}
                disabled={!appointment.client?.phone}
                className="flex-1"
              >
                Message
              </Button>
            </View>
          </Card>

          {/* Service Details */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Service Details</Text>
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Service</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {appointment.serviceName}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Date</Text>
                <Text className="text-base font-semibold text-gray-900">{formattedDate}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Time</Text>
                <Text className="text-base font-semibold text-gray-900">{formattedTime}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Duration</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {appointment.duration} minutes
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-gray-200 pt-3">
                <Text className="text-base font-semibold text-gray-900">Price</Text>
                <Text className="text-xl font-bold text-gray-900">${appointment.price}</Text>
              </View>
            </View>
          </Card>

          {/* Location */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Location</Text>
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-base">📍</Text>
              <Text className="text-sm font-medium text-gray-900">{locationLabel}</Text>
            </View>
            {appointment.address && (
              <Text className="text-sm text-gray-600 mb-3">{appointment.address}</Text>
            )}
            {appointment.addressCoords && (
              <Button variant="outline" size="sm" onPress={handleNavigate}>
                Open in Maps
              </Button>
            )}
          </Card>

          {/* Special Requests */}
          {appointment.specialRequests && (
            <Card className="p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Special Requests</Text>
              <Text className="text-sm text-gray-700">{appointment.specialRequests}</Text>
            </Card>
          )}

          {/* Payment Status */}
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Payment</Text>
              <Badge variant={getPaymentStatusBadgeVariant(appointment.paymentStatus)} size="lg">
                {formatStatusLabel(appointment.paymentStatus)}
              </Badge>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {appointment.status !== 'cancelled' &&
        appointment.status !== 'completed' &&
        appointment.status !== 'no_show' && (
          <View className="p-6 bg-white border-t border-gray-200 space-y-2">
            {appointment.status === 'pending' && (
              <View className="flex-row gap-3">
                <Button
                  variant="outline"
                  onPress={handleReject}
                  disabled={isProcessing}
                  className="flex-1"
                >
                  Reject
                </Button>
                <Button onPress={handleConfirm} disabled={isProcessing} className="flex-1">
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Button>
              </View>
            )}

            {appointment.status === 'confirmed' && (
              <Button onPress={handleStartService} disabled={isProcessing} size="lg">
                {isProcessing ? 'Processing...' : 'Start Service'}
              </Button>
            )}

            {appointment.status === 'in_progress' && (
              <Button onPress={handleCompleteService} disabled={isProcessing} size="lg">
                {isProcessing ? 'Processing...' : 'Complete Service'}
              </Button>
            )}
          </View>
        )}
    </View>
  );
}
