/**
 * Client Appointments List Screen
 * Displays user's appointments with tab navigation (Upcoming/Past/Cancelled)
 *
 * Uses Convex reactive queries — data auto-updates when the backend changes,
 * so there is no manual refetch or pull-to-refresh required.
 *
 * Backend statuses: pending | confirmed | in_progress | completed | cancelled | no_show
 *   Upcoming tab  → pending + confirmed + in_progress
 *   Past tab       → completed + no_show
 *   Cancelled tab  → cancelled
 */

import { useState, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { AppointmentCard, AppointmentCardSkeleton } from '@/components/booking/AppointmentCard';
import { useAppointments } from '@/features/bookings/hooks/useAppointments';
import { useBooking } from '@/features/bookings/hooks/useBooking';
import { useTranslation } from '@/services/i18n/useTranslation';
import { triggerSelectionHaptic } from '@/services/haptics';
import type { IAppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';
import type { Id } from '@convex/_generated/dataModel';

type TabType = 'upcoming' | 'past' | 'cancelled';

// Status groupings for tabs — defined outside component to avoid re-creation
const UPCOMING_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'in_progress'];
const PAST_STATUSES: AppointmentStatus[] = ['completed', 'no_show'];
const CANCELLED_STATUSES: AppointmentStatus[] = ['cancelled'];

interface ITabButtonProps {
  label: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
  appointmentText: string;
  appointmentsText: string;
}

function TabButton({
  label,
  isActive,
  count,
  onPress,
  appointmentText,
  appointmentsText,
}: ITabButtonProps) {
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
        {count} {count === 1 ? appointmentText : appointmentsText}
      </Text>
    </Pressable>
  );
}

function AppointmentSkeleton() {
  return (
    <View className="px-4">
      {[1, 2, 3].map((i) => (
        <View key={i} className="mb-4">
          <AppointmentCardSkeleton />
        </View>
      ))}
    </View>
  );
}

export default function AppointmentsListScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Fetch all appointments — Convex queries are reactive and auto-update
  const { appointments, isLoading, isError } = useAppointments();

  // Booking mutations
  const { cancelAppointment, isCanceling } = useBooking({
    onSuccess: () => {
      setCancelModalVisible(false);
      setSelectedAppointmentId(null);
      setCancelReason('');
      Alert.alert(t('common.success'), t('appointments.cancel.success'));
    },
    onError: (error) => {
      Alert.alert(t('common.error'), error.message || t('errors.generic'));
    },
  });

  // Filter appointments by tab (status-based, no date logic)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      switch (activeTab) {
        case 'upcoming':
          return UPCOMING_STATUSES.includes(apt.status as AppointmentStatus);
        case 'past':
          return PAST_STATUSES.includes(apt.status as AppointmentStatus);
        case 'cancelled':
          return CANCELLED_STATUSES.includes(apt.status as AppointmentStatus);
        default:
          return true;
      }
    });
  }, [appointments, activeTab]);

  // Count appointments per tab
  const appointmentCounts = useMemo(() => {
    return {
      upcoming: appointments.filter((apt) =>
        UPCOMING_STATUSES.includes(apt.status as AppointmentStatus)
      ).length,
      past: appointments.filter((apt) => PAST_STATUSES.includes(apt.status as AppointmentStatus))
        .length,
      cancelled: appointments.filter((apt) =>
        CANCELLED_STATUSES.includes(apt.status as AppointmentStatus)
      ).length,
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

  const handleConfirmCancel = useCallback(async () => {
    if (selectedAppointmentId) {
      await cancelAppointment(
        selectedAppointmentId as Id<'appointments'>,
        cancelReason || undefined
      );
    }
  }, [selectedAppointmentId, cancelReason, cancelAppointment]);

  const handleReschedule = useCallback(
    (id: string) => {
      router.push(`/appointments/${id}/reschedule`);
    },
    [router]
  );

  const handleRebook = useCallback(
    (appointment: IAppointmentWithDetails) => {
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

  const handleLeaveReview = useCallback(
    (appointment: IAppointmentWithDetails) => {
      router.push({
        pathname: '/appointments/review',
        params: {
          appointmentId: appointment._id,
          barberId: appointment.barberId,
        },
      });
    },
    [router]
  );

  const handleBookNew = useCallback(() => {
    triggerSelectionHaptic();
    router.push('/search');
  }, [router]);

  const keyExtractor = useCallback((item: IAppointmentWithDetails) => item._id, []);

  // Render appointment item
  const renderAppointment = useCallback(
    ({ item }: { item: IAppointmentWithDetails }) => (
      <View className="px-4 mb-4">
        <AppointmentCard
          appointment={item}
          onViewDetails={handleViewDetails}
          onCancel={handleCancel}
          onReschedule={handleReschedule}
          onRebook={handleRebook}
          onLeaveReview={handleLeaveReview}
          isLoading={isCanceling}
          hasReview={item.hasReview}
        />
      </View>
    ),
    [
      handleViewDetails,
      handleCancel,
      handleReschedule,
      handleRebook,
      handleLeaveReview,
      isCanceling,
    ]
  );

  // Empty state config per tab
  const emptyStateConfig = {
    upcoming: {
      icon: '📅',
      title: t('appointments.empty.upcoming'),
      description: t('appointments.empty.upcomingTip'),
      actionLabel: t('home.bookNow'),
    },
    past: {
      icon: '📋',
      title: t('appointments.empty.past'),
      description: t('appointments.empty.pastTip'),
      actionLabel: t('home.bookNow'),
    },
    cancelled: {
      icon: '🚫',
      title: t('appointments.empty.cancelled'),
      description: t('appointments.empty.cancelledTip'),
      actionLabel: undefined,
    },
  };

  const currentEmptyState = emptyStateConfig[activeTab];

  return (
    <SafeView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 pt-4 pb-2 bg-white border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900 mb-1">{t('appointments.title')}</Text>
        <Text className="text-gray-600 text-sm">
          {t('appointments.empty.upcomingTip').split('.')[0]}
        </Text>
      </View>

      {/* Tabs */}
      <View className="flex-row gap-2 px-4 py-3 bg-white border-b border-gray-100">
        <TabButton
          label={t('appointments.tabs.upcoming')}
          isActive={activeTab === 'upcoming'}
          count={appointmentCounts.upcoming}
          onPress={() => {
            triggerSelectionHaptic();
            setActiveTab('upcoming');
          }}
          appointmentText="appointment"
          appointmentsText="appointments"
        />
        <TabButton
          label={t('appointments.tabs.past')}
          isActive={activeTab === 'past'}
          count={appointmentCounts.past}
          onPress={() => {
            triggerSelectionHaptic();
            setActiveTab('past');
          }}
          appointmentText="appointment"
          appointmentsText="appointments"
        />
        <TabButton
          label={t('appointments.tabs.cancelled')}
          isActive={activeTab === 'cancelled'}
          count={appointmentCounts.cancelled}
          onPress={() => {
            triggerSelectionHaptic();
            setActiveTab('cancelled');
          }}
          appointmentText="appointment"
          appointmentsText="appointments"
        />
      </View>

      {/* Content */}
      {isLoading ? (
        <AppointmentSkeleton />
      ) : isError ? (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-xl mb-2">{t('errors.generic')}</Text>
          <Text className="text-gray-600 text-center mb-4">{t('errors.network')}</Text>
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
          keyExtractor={keyExtractor}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
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
        title={t('appointments.cancel.title')}
      >
        <View>
          <Text className="text-gray-600 mb-4">{t('appointments.cancel.message')}</Text>
          <Input
            label={t('appointments.cancel.reason')}
            placeholder={t('appointments.cancel.reasonPlaceholder')}
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
                {t('common.cancel')}
              </Button>
            </View>
            <View className="flex-1">
              <Button
                variant="danger"
                onPress={handleConfirmCancel}
                loading={isCanceling}
                fullWidth
              >
                {t('appointments.cancel.confirm')}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </SafeView>
  );
}
