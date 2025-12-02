/**
 * AppointmentCard Component
 * Displays appointment details with status badges and action buttons
 */

import { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { AppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';

interface IAppointmentCardProps extends Omit<PressableProps, 'children'> {
  appointment: AppointmentWithDetails;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onRebook?: (appointment: AppointmentWithDetails) => void;
  onViewDetails?: (id: string) => void;
  isLoading?: boolean;
  showActions?: boolean;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  confirmed: { label: 'Confirmed', variant: 'success' },
  completed: { label: 'Completed', variant: 'info' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

/**
 * Format date to a readable string
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format time to a readable string
 */
function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if appointment is in the past
 */
function isPastAppointment(scheduledFor: Date): boolean {
  return new Date(scheduledFor) < new Date();
}

/**
 * AppointmentCard - Displays appointment information with actions
 */
function AppointmentCardComponent({
  appointment,
  onCancel,
  onReschedule,
  onRebook,
  onViewDetails,
  isLoading = false,
  showActions = true,
  ...props
}: IAppointmentCardProps) {
  const statusConfig = STATUS_CONFIG[appointment.status];
  const isPast = useMemo(
    () => isPastAppointment(appointment.scheduledFor),
    [appointment.scheduledFor]
  );

  // Memoize formatted date/time
  const formattedDate = useMemo(
    () => formatDate(appointment.scheduledFor),
    [appointment.scheduledFor]
  );
  const formattedTime = useMemo(
    () => formatTime(appointment.scheduledFor),
    [appointment.scheduledFor]
  );

  // Memoize duration display
  const durationDisplay = useMemo(() => {
    const hours = Math.floor(appointment.duration / 60);
    const minutes = appointment.duration % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  }, [appointment.duration]);

  // Memoize location display
  const locationDisplay = useMemo(() => {
    if (appointment.location.type === 'in_home') {
      return '🏠 At Your Location';
    }
    return '💈 At Salon';
  }, [appointment.location.type]);

  // Callbacks
  const handleCancel = useCallback(() => {
    onCancel?.(appointment._id);
  }, [onCancel, appointment._id]);

  const handleReschedule = useCallback(() => {
    onReschedule?.(appointment._id);
  }, [onReschedule, appointment._id]);

  const handleRebook = useCallback(() => {
    onRebook?.(appointment);
  }, [onRebook, appointment]);

  const handleViewDetails = useCallback(() => {
    onViewDetails?.(appointment._id);
  }, [onViewDetails, appointment._id]);

  // Determine which actions to show
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canReschedule = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canRebook = appointment.status === 'completed' || appointment.status === 'cancelled';

  return (
    <Pressable onPress={handleViewDetails} disabled={isLoading} {...props}>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Header with status */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-gray-900">{appointment.serviceName}</Text>
            <Badge variant={statusConfig.variant} size="sm">
              {statusConfig.label}
            </Badge>
          </View>
          <Text className="text-lg font-bold text-gray-900">${appointment.price}</Text>
        </View>

        {/* Barber info */}
        <View className="flex-row items-center px-4 py-3 border-b border-gray-100">
          <Avatar
            source={appointment.barberAvatar}
            size="md"
            fallback={appointment.barberName?.charAt(0) || 'B'}
          />
          <View className="ml-3 flex-1">
            <Text className="text-base font-medium text-gray-900">{appointment.barberName}</Text>
            <Text className="text-sm text-gray-500">{locationDisplay}</Text>
          </View>
        </View>

        {/* Date, Time, Duration */}
        <View className="px-4 py-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">📅</Text>
              <Text className="text-sm text-gray-700">{formattedDate}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">⏰</Text>
              <Text className="text-sm text-gray-700">{formattedTime}</Text>
            </View>
            <View className="flex-row items-center gap-2">
              <Text className="text-xl">⏱️</Text>
              <Text className="text-sm text-gray-700">{durationDisplay}</Text>
            </View>
          </View>

          {/* Address if available */}
          {appointment.location.address && (
            <View className="flex-row items-start gap-2 mt-2">
              <Text className="text-lg">📍</Text>
              <Text className="text-sm text-gray-600 flex-1" numberOfLines={2}>
                {appointment.location.address}
              </Text>
            </View>
          )}

          {/* Special requests */}
          {appointment.specialRequests && (
            <View className="mt-2 bg-gray-50 p-2 rounded-lg">
              <Text className="text-xs text-gray-500 mb-1">Special Requests:</Text>
              <Text className="text-sm text-gray-700" numberOfLines={2}>
                {appointment.specialRequests}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {showActions && (
          <View className="flex-row gap-2 px-4 pb-4">
            {canCancel && onCancel && (
              <Button
                variant="outline"
                size="sm"
                onPress={handleCancel}
                disabled={isLoading}
                fullWidth
              >
                Cancel
              </Button>
            )}
            {canReschedule && onReschedule && (
              <Button
                variant="primary"
                size="sm"
                onPress={handleReschedule}
                disabled={isLoading}
                fullWidth
              >
                Reschedule
              </Button>
            )}
            {canRebook && onRebook && (
              <Button
                variant="primary"
                size="sm"
                onPress={handleRebook}
                disabled={isLoading}
                fullWidth
              >
                Book Again
              </Button>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export const AppointmentCard = memo(AppointmentCardComponent);
