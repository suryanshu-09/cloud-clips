/**
 * AppointmentCard Component
 * Displays appointment details with status badges and action buttons
 */

import { memo, useMemo, useCallback } from 'react';
import { View, Text, Pressable, type PressableProps } from 'react-native';
import { format, formatDistanceToNow, isPast } from 'date-fns';

import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { triggerSelectionHaptic } from '@/services/haptics';
import type { IAppointmentWithDetails, AppointmentStatus } from '@/features/bookings/types';

interface IAppointmentCardProps extends Omit<PressableProps, 'children'> {
  appointment: IAppointmentWithDetails;
  onCancel?: (id: string) => void;
  onReschedule?: (id: string) => void;
  onRebook?: (appointment: IAppointmentWithDetails) => void;
  onViewDetails?: (id: string) => void;
  onLeaveReview?: (appointment: IAppointmentWithDetails) => void;
  isLoading?: boolean;
  showActions?: boolean;
  hasReview?: boolean;
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'info' | 'default';
    bgClass: string;
    textClass: string;
  }
> = {
  pending: {
    label: 'Pending',
    variant: 'warning',
    bgClass: 'bg-yellow-100',
    textClass: 'text-yellow-700',
  },
  confirmed: {
    label: 'Confirmed',
    variant: 'info',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
  },
  in_progress: {
    label: 'In Progress',
    variant: 'success',
    bgClass: 'bg-green-100',
    textClass: 'text-green-700',
  },
  completed: {
    label: 'Completed',
    variant: 'default',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-700',
  },
  cancelled: {
    label: 'Cancelled',
    variant: 'danger',
    bgClass: 'bg-red-100',
    textClass: 'text-red-700',
  },
  no_show: {
    label: 'No Show',
    variant: 'danger',
    bgClass: 'bg-red-200',
    textClass: 'text-red-900',
  },
};

/**
 * Format a price number as USD currency (e.g. $25.00)
 */
function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
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
  onLeaveReview,
  isLoading = false,
  showActions = true,
  hasReview = false,
  ...props
}: IAppointmentCardProps) {
  const statusConfig = STATUS_CONFIG[appointment.status];

  const scheduledDate = useMemo(
    () => new Date(appointment.scheduledFor),
    [appointment.scheduledFor]
  );

  const _isPastAppointment = useMemo(() => isPast(scheduledDate), [scheduledDate]);

  // Format date using date-fns: e.g. "Sat, Jan 15, 2026"
  const formattedDate = useMemo(() => format(scheduledDate, 'EEE, MMM d, yyyy'), [scheduledDate]);

  // Format time using date-fns: e.g. "2:30 PM"
  const formattedTime = useMemo(() => format(scheduledDate, 'h:mm a'), [scheduledDate]);

  // Relative time: e.g. "in 3 hours" or "2 days ago"
  const relativeTime = useMemo(
    () => formatDistanceToNow(scheduledDate, { addSuffix: true }),
    [scheduledDate]
  );

  // Duration display
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

  // Location display using locationType field
  const locationDisplay = useMemo(() => {
    if (appointment.locationType === 'in_home') {
      return { icon: '🏠', label: 'In-Home' };
    }
    return { icon: '💈', label: 'In-Salon' };
  }, [appointment.locationType]);

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
    triggerSelectionHaptic();
    onViewDetails?.(appointment._id);
  }, [onViewDetails, appointment._id]);

  const handleLeaveReview = useCallback(() => {
    onLeaveReview?.(appointment);
  }, [onLeaveReview, appointment]);

  // Determine which actions to show based on status
  const canCancel = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canReschedule = appointment.status === 'pending' || appointment.status === 'confirmed';
  const canRebook =
    appointment.status === 'completed' ||
    appointment.status === 'cancelled' ||
    appointment.status === 'no_show';
  const canLeaveReview = appointment.status === 'completed' && !hasReview;

  // For no_show, use custom styling since Badge doesn't have a maroon variant
  const isNoShow = appointment.status === 'no_show';

  return (
    <Pressable onPress={handleViewDetails} disabled={isLoading} {...props}>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        {/* Header with status */}
        <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-gray-900">{appointment.serviceName}</Text>
            {isNoShow ? (
              <View className="rounded-full px-2 py-0.5 bg-red-200">
                <Text className="text-xs font-medium text-red-900">{statusConfig.label}</Text>
              </View>
            ) : (
              <Badge variant={statusConfig.variant} size="sm">
                {statusConfig.label}
              </Badge>
            )}
          </View>
          <Text className="text-lg font-bold text-gray-900">{formatPrice(appointment.price)}</Text>
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
            <Text className="text-sm text-gray-500">
              {locationDisplay.icon} {locationDisplay.label}
            </Text>
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

          {/* Relative time indicator */}
          <Text className="text-xs text-gray-400 mb-2">{relativeTime}</Text>

          {/* Address if available */}
          {appointment.address && (
            <View className="flex-row items-start gap-2 mt-2">
              <Text className="text-lg">📍</Text>
              <Text className="text-sm text-gray-600 flex-1" numberOfLines={2}>
                {appointment.address}
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
            {canRebook && onRebook && !canLeaveReview && (
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
            {canLeaveReview && onLeaveReview && (
              <Button
                variant="primary"
                size="sm"
                onPress={handleLeaveReview}
                disabled={isLoading}
                fullWidth
              >
                Leave Review
              </Button>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

export const AppointmentCard = memo(AppointmentCardComponent);

export function AppointmentCardSkeleton() {
  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <View className="px-4 pt-4 pb-2 flex-row items-center justify-between">
        <Skeleton height={16} width="45%" variant="text" />
        <Skeleton height={20} width={72} variant="text" />
      </View>
      <View className="px-4 py-3 border-b border-gray-100 flex-row items-center gap-3">
        <Skeleton width={40} height={40} variant="circular" />
        <View className="flex-1 gap-2">
          <Skeleton height={14} width="55%" variant="text" />
          <Skeleton height={12} width="35%" variant="text" />
        </View>
      </View>
      <View className="px-4 py-3 gap-2">
        <Skeleton height={12} width="95%" variant="text" />
        <Skeleton height={12} width="80%" variant="text" />
      </View>
    </Card>
  );
}
