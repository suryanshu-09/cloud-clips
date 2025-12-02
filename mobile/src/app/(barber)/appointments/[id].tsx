import { useState } from 'react';
import { ScrollView, Text, View, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Card, Button, Badge, Avatar } from '@/components/ui';

type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

// Mock data - replace with real data from API
const MOCK_APPOINTMENT = {
  id: '1',
  client: {
    name: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    profileImage: null,
    totalBookings: 5,
  },
  service: {
    name: 'Premium Haircut',
    duration: 45,
    price: 45,
  },
  date: '2025-12-01',
  time: '10:00 AM',
  status: 'pending' as AppointmentStatus,
  location: {
    type: 'Home Service',
    address: '123 Main St, Apt 4B, New York, NY 10001',
    coordinates: { lat: 40.7128, lng: -74.006 },
  },
  notes: 'Please bring clippers. Prefer a fade haircut.',
  createdAt: '2025-11-28T10:30:00Z',
};

export default function BarberAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState(MOCK_APPOINTMENT);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    Alert.alert('Confirm Appointment', 'Are you sure you want to confirm this appointment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          setIsProcessing(true);
          try {
            // TODO: Implement API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAppointment({ ...appointment, status: 'confirmed' });
            Alert.alert('Success', 'Appointment confirmed successfully!');
          } catch (error) {
            Alert.alert('Error', 'Failed to confirm appointment');
          } finally {
            setIsProcessing(false);
          }
        },
      },
    ]);
  };

  const handleReject = async () => {
    Alert.alert('Reject Appointment', 'Please provide a reason for rejection:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setIsProcessing(true);
          try {
            // TODO: Implement API call
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAppointment({ ...appointment, status: 'cancelled' });
            Alert.alert('Success', 'Appointment rejected');
          } catch (error) {
            Alert.alert('Error', 'Failed to reject appointment');
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
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAppointment({ ...appointment, status: 'in_progress' });
      Alert.alert('Success', 'Service started');
    } catch (error) {
      Alert.alert('Error', 'Failed to start service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteService = async () => {
    setIsProcessing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setAppointment({ ...appointment, status: 'completed' });
      Alert.alert('Success', 'Service completed! Payment will be processed.');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete service');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCall = () => {
    Linking.openURL(`tel:${appointment.client.phone}`);
  };

  const handleMessage = () => {
    Linking.openURL(`sms:${appointment.client.phone}`);
  };

  const handleNavigate = () => {
    const { lat, lng } = appointment.location.coordinates;
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
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
      default:
        return 'default';
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Status */}
          <Card className="p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">Status</Text>
              <Badge variant={getStatusBadgeVariant(appointment.status)} size="lg">
                {appointment.status.charAt(0).toUpperCase() +
                  appointment.status.slice(1).replace('_', ' ')}
              </Badge>
            </View>
          </Card>

          {/* Client Info */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Client Information</Text>
            <View className="flex-row items-center gap-3 mb-4">
              <Avatar size="lg" fallback={appointment.client.name.charAt(0)} />
              <View className="flex-1">
                <Text className="text-base font-bold text-gray-900">{appointment.client.name}</Text>
                <Text className="text-sm text-gray-600">
                  {appointment.client.totalBookings} bookings
                </Text>
              </View>
            </View>

            <View className="space-y-2">
              <View className="flex-row items-center gap-2">
                <Text className="text-base">📞</Text>
                <Text className="text-sm text-gray-700">{appointment.client.phone}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="text-base">✉️</Text>
                <Text className="text-sm text-gray-700">{appointment.client.email}</Text>
              </View>
            </View>

            <View className="flex-row gap-2 mt-4">
              <Button variant="outline" size="sm" onPress={handleCall} className="flex-1">
                Call
              </Button>
              <Button variant="outline" size="sm" onPress={handleMessage} className="flex-1">
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
                  {appointment.service.name}
                </Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Date</Text>
                <Text className="text-base font-semibold text-gray-900">{appointment.date}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Time</Text>
                <Text className="text-base font-semibold text-gray-900">{appointment.time}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-gray-600">Duration</Text>
                <Text className="text-base font-semibold text-gray-900">
                  {appointment.service.duration} minutes
                </Text>
              </View>
              <View className="flex-row items-center justify-between border-t border-gray-200 pt-3">
                <Text className="text-base font-semibold text-gray-900">Price</Text>
                <Text className="text-xl font-bold text-gray-900">
                  ${appointment.service.price}
                </Text>
              </View>
            </View>
          </Card>

          {/* Location */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Location</Text>
            <View className="flex-row items-center gap-2 mb-2">
              <Text className="text-base">📍</Text>
              <Text className="text-sm font-medium text-gray-900">{appointment.location.type}</Text>
            </View>
            <Text className="text-sm text-gray-600 mb-3">{appointment.location.address}</Text>
            <Button variant="outline" size="sm" onPress={handleNavigate}>
              Open in Maps
            </Button>
          </Card>

          {/* Notes */}
          {appointment.notes && (
            <Card className="p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-2">Client Notes</Text>
              <Text className="text-sm text-gray-700">{appointment.notes}</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
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
