import { useState, useMemo, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/ui';
import { AppointmentCard, AppointmentCardSkeleton } from '@/components/booking';
import { useAppointments } from '@/features/bookings/hooks/useAppointments';
import { triggerSelectionHaptic } from '@/services/haptics';
import type { IAppointmentWithDetails } from '@/features/bookings/types';

type FilterType = 'all' | 'today' | 'upcoming' | 'pending';

const FILTER_LABELS: Record<FilterType, string> = {
  all: 'All',
  today: 'Today',
  upcoming: 'Upcoming',
  pending: 'Pending',
};

/**
 * Returns start and end timestamps for today (local time).
 */
function getTodayRange(): { start: number; end: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  return { start, end };
}

export default function BarberAppointmentsListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch all appointments (no server-side status filter so we can do client-side filtering across tabs)
  const { appointments, isLoading } = useAppointments();

  const filteredAppointments = useMemo(() => {
    if (!appointments.length) return [];

    switch (filter) {
      case 'all':
        return appointments;

      case 'today': {
        const { start, end } = getTodayRange();
        return appointments.filter((apt) => apt.scheduledFor >= start && apt.scheduledFor < end);
      }

      case 'upcoming': {
        const now = Date.now();
        return appointments.filter(
          (apt) =>
            apt.scheduledFor > now && (apt.status === 'pending' || apt.status === 'confirmed')
        );
      }

      case 'pending':
        return appointments.filter((apt) => apt.status === 'pending');

      default:
        return appointments;
    }
  }, [appointments, filter]);

  const handleViewDetails = useCallback(
    (id: string) => {
      router.push(`/(barber)/appointments/${id}`);
    },
    [router]
  );

  const renderAppointmentCard = useCallback(
    ({ item }: { item: IAppointmentWithDetails }) => (
      <View className="mb-3">
        <AppointmentCard appointment={item} onViewDetails={handleViewDetails} showActions={false} />
      </View>
    ),
    [handleViewDetails]
  );

  const keyExtractor = useCallback((item: IAppointmentWithDetails) => item._id, []);

  const renderEmptyState = useCallback(() => {
    const filterLabel = filter !== 'all' ? ` ${FILTER_LABELS[filter].toLowerCase()}` : '';
    return (
      <EmptyState
        icon="📅"
        title="No Appointments"
        description={`You don't have any${filterLabel} appointments at the moment.`}
      />
    );
  }, [filter]);

  const renderLoadingSkeleton = () => (
    <View className="p-6 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <AppointmentCardSkeleton key={index} />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Appointments</Text>
        <Text className="text-gray-600">Manage your bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(['all', 'today', 'upcoming', 'pending'] as FilterType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => {
                  triggerSelectionHaptic();
                  setFilter(type);
                }}
                className={`px-4 py-2 rounded-full ${
                  filter === type ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === type ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {FILTER_LABELS[type]}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Content */}
      {isLoading ? (
        renderLoadingSkeleton()
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={keyExtractor}
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </View>
  );
}
