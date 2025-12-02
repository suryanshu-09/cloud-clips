/**
 * Client Appointments List Screen
 * Displays user's appointments with tab navigation (Upcoming/Past/Cancelled)
 */

import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, RefreshControl, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AppointmentCard } from '@/components/booking/AppointmentCard';
import { useAppointments } from '@/features/bookings/hooks/useAppointments';
import { useBooking } from '@/features/bookings/hooks/useBooking';
import type { AppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';

type TabType = 'upcoming' | 'past' | 'cancelled';

interface ITabButtonProps {
  label: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
}

function TabButton({ label, isActive, count, onPress }: ITabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 py-3 px-2 items-center rounded-lg ${
        isActive ? 'bg-blue-600' : 'bg-gray-100'
      }`}
    >
      <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-600'}`}>
        {label}
      </Text>
      <Text className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
        {count} {count === 1 ? 'appointment' : 'appointments'}
      </Text>
    </Pressable>
  );
}

function AppointmentSkeleton() {
  return (
    <View className="px-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-4">
          <SkeletonCard />
        </View>
      ))}
    </View>
  );
}

export default function AppointmentsListScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch all appointments
  const { appointments, isLoading, isError, refetch, isRefetching } = useAppointments();

  // Booking mutations
  const { cancelAppointment, isCanceling } = useBooking({
    onSuccess: () => {
      setCancelModalVisible(false);
      setSelectedAppointmentId(null);
      setCancelReason('');
      refetch();
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to cancel appointment');
    },
  });

  // Filter appointments by tab
  const filteredAppointments = useMemo(() => {
    const now = new Date();

    return appointments.filter((apt) => {
      const scheduledDate = new Date(apt.scheduledFor);

      switch (activeTab) {
        case 'upcoming':
          return (apt.status === 'pending' || apt.status === 'confirmed') && scheduledDate >= now;
        case 'past':
          return apt.status === 'completed' || scheduledDate < now;
        case 'cancelled':
          return apt.status === 'cancelled';
        default:
          return true;
      }
    });
  }, [appointments, activeTab]);

  // Count appointments per tab
  const appointmentCounts = useMemo(() => {
    const now = new Date();

    return {
      upcoming: appointments.filter((apt) => {
        const scheduledDate = new Date(apt.scheduledFor);
        return (apt.status === 'pending' || apt.status === 'confirmed') && scheduledDate >= now;
      }).length,
      past: appointments.filter((apt) => {
        const scheduledDate = new Date(apt.scheduledFor);
        return apt.status === 'completed' || scheduledDate < now;
      }).length,
      cancelled: appointments.filter((apt) => apt.status === 'cancelled').length,
    };
  }, [appointments]);

  // Handlers
  const handleViewDetails = useCallback(
    (id: string) => {
      router.push(`/appointments/${id}`);
    },
    [router]
  );

  const handleCancel = useCallback((id: string) => {
    setSelectedAppointmentId(id);
    setCancelModalVisible(true);
  }, []);

  const handleConfirmCancel = useCallback(() => {
    if (selectedAppointmentId) {
      cancelAppointment.mutate({
        id: selectedAppointmentId,
        reason: cancelReason || undefined,
      });
    }
  }, [selectedAppointmentId, cancelReason, cancelAppointment]);

  const handleReschedule = useCallback(
    (id: string) => {
      router.push(`/appointments/${id}/reschedule`);
    },
    [router]
  );

  const handleRebook = useCallback(
    (appointment: AppointmentWithDetails) => {
      // Navigate to booking flow with pre-filled data
      router.push({
        pathname: '/search',
        params: {
          barberId: appointment.barberId,
          serviceType: appointment.serviceType,
        },
      });
    },
    [router]
  );

  const handleBookNew = useCallback(() => {
    router.push('/search');
  }, [router]);

  // Render appointment item
  const renderAppointment = useCallback(
    ({ item }: { item: AppointmentWithDetails }) => (
      <View className="px-4 mb-4">
        <AppointmentCard
          appointment={item}
          onViewDetails={handleViewDetails}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          onRebook={handleRebook}
          isLoading={isCanceling}
        />
      </View>
    ),
    [handleViewDetails, handleCancel, handleReschedule, handleRebook, isCanceling]
  );

  // Empty state config per tab
  const emptyStateConfig = {
    upcoming: {
      icon: '📅',
      title: 'No Upcoming Appointments',
      description: 'Book your next haircut or grooming session with a professional barber.',
      actionLabel: 'Book Now',
    },
    past: {
      icon: '📋',
      title: 'No Past Appointments',
      description: "You haven't completed any appointments yet.",
      actionLabel: 'Book Your First',
    },
    cancelled: {
      icon: '🚫',
      title: 'No Cancelled Appointments',
      description: "You haven't cancelled any appointments.",
      actionLabel: undefined,
    },
  };

  const currentEmptyState = emptyStateConfig[activeTab];

  return (
    <SafeView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-1">My Appointments</Text>
        <Text className="text-gray-600 text-sm">Manage your upcoming and past appointments</Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <TabButton
          label="Upcoming"
          isActive={activeTab === 'upcoming'}
          count={appointmentCounts.upcoming}
          onPress={() => setActiveTab('upcoming')}
        />
        <TabButton
          label="Past"
          isActive={activeTab === 'past'}
          count={appointmentCounts.past}
          onPress={() => setActiveTab('past')}
        />
        <TabButton
          label="Cancelled"
          isActive={activeTab === 'cancelled'}
          count={appointmentCounts.cancelled}
          onPress={() => setActiveTab('cancelled')}
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <AppointmentSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-xl mb-2">Something went wrong</Text>
          <Text className="text-gray-600 text-center mb-4">Unable to load your appointments</Text>
          <Button onPress={() => refetch()} variant="primary">
            Try Again
          </Button>
        </View>
      ) : filteredAppointments.length === 0 ? (
        <EmptyState
          icon={currentEmptyState.icon}
          title={currentEmptyState.title}
          description={currentEmptyState.description}
          actionLabel={currentEmptyState.actionLabel}
          onAction={currentEmptyState.actionLabel ? handleBookNew : undefined}
        />
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        />
      )}

      {/* Floating Action Button */}
      <View className="absolute bottom-6 right-4">
        <Pressable
          onPress={handleBookNew}
          className="bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg active:bg-blue-700"
        >
          <Text className="text-white text-2xl">+</Text>
        </Pressable>
      </View>

      {/* Cancel Confirmation Modal */}
      <Modal
        visible={cancelModalVisible}
        onClose={() => {
          setCancelModalVisible(false);
          setSelectedAppointmentId(null);
          setCancelReason('');
        }}
        title="Cancel Appointment"
      >
        <View>
          <Text className="text-gray-600 mb-4">
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </Text>
          <Input
            label="Reason for cancellation (optional)"
            placeholder="Enter your reason..."
            value={cancelReason}
            onChangeText={setCancelReason}
            multiline
            numberOfLines={3}
          />
          <View className="flex-row gap-3 mt-6">
            <View className="flex-1">
              <Button
                variant="outline"
                onPress={() => {
                  setCancelModalVisible(false);
                  setSelectedAppointmentId(null);
                  setCancelReason('');
                }}
                fullWidth
              >
                Keep Appointment
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="danger"
                onPress={handleConfirmCancel}
                loading={isCanceling}
                fullWidth
              >
                Cancel Appointment
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeView>
  );
}
