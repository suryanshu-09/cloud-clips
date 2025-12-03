import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notificationService';
import type {
  INotification,
  INotificationPermissions,
  INotificationSettings,
  IPushTokens,
  INotificationPayload,
} from '../types';

// Query keys
export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params?: { unreadOnly?: boolean }) => [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unreadCount'] as const,
  settings: () => [...notificationKeys.all, 'settings'] as const,
  permissions: () => [...notificationKeys.all, 'permissions'] as const,
  scheduled: () => [...notificationKeys.all, 'scheduled'] as const,
};

/**
 * Hook to get notification permissions status
 */
export function useNotificationPermissions() {
  return useQuery<INotificationPermissions>({
    queryKey: notificationKeys.permissions(),
    queryFn: () => notificationService.getPermissionStatus(),
    staleTime: 0, // Always fresh check
  });
}

/**
 * Hook to request notification permissions
 */
export function useRequestNotificationPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.requestPermissions(),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.permissions(), data);

      // If permissions granted, register for push notifications
      if (data.granted) {
        notificationService.registerForPushNotifications().catch((error) => {
          console.error('[useRequestNotificationPermissions] Failed to register:', error);
        });
      }
    },
  });
}

/**
 * Hook to register device for push notifications
 */
export function useRegisterPushNotifications() {
  return useMutation<IPushTokens, Error>({
    mutationFn: () => notificationService.registerForPushNotifications(),
  });
}

/**
 * Hook to get notifications list with infinite scrolling
 */
export function useNotifications(params?: { unreadOnly?: boolean }) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(params),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      notificationService.getNotifications({
        ...params,
        cursor: pageParam,
        limit: 20,
      }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount() {
  return useQuery<number>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationService.getUnreadCount(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markAsRead(notificationId),
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      // Clear badge
      notificationService.clearBadge();
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.deleteNotification(notificationId),
    onSuccess: () => {
      // Invalidate notifications and unread count
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Hook to get notification settings
 */
export function useNotificationSettings() {
  return useQuery<INotificationSettings>({
    queryKey: notificationKeys.settings(),
    queryFn: () => notificationService.getNotificationSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update notification settings
 */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings: Partial<INotificationSettings>) =>
      notificationService.updateNotificationSettings(settings),
    onSuccess: (data) => {
      queryClient.setQueryData(notificationKeys.settings(), data);
    },
  });
}

/**
 * Hook to schedule a local notification
 */
export function useScheduleLocalNotification() {
  return useMutation({
    mutationFn: ({
      payload,
      trigger,
    }: {
      payload: INotificationPayload;
      trigger?: Notifications.NotificationTriggerInput;
    }) => notificationService.scheduleLocalNotification(payload, trigger),
  });
}

/**
 * Hook to get all scheduled notifications
 */
export function useScheduledNotifications() {
  return useQuery({
    queryKey: notificationKeys.scheduled(),
    queryFn: () => notificationService.getAllScheduledNotifications(),
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook to listen for notification events
 * Automatically sets up and cleans up listeners
 */
export function useNotificationListener(options?: {
  onNotificationReceived?: (notification: Notifications.Notification) => void;
  onNotificationTapped?: (response: Notifications.NotificationResponse) => void;
}) {
  const queryClient = useQueryClient();
  const receivedListenerRef = useRef<Notifications.Subscription | null>(null);
  const responseListenerRef = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Set up notification received listener
    receivedListenerRef.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        // Invalidate unread count when new notification is received
        queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
        queryClient.invalidateQueries({ queryKey: notificationKeys.list() });

        // Call custom handler if provided
        if (options?.onNotificationReceived) {
          options.onNotificationReceived(notification);
        }
      }
    );

    // Set up notification response listener (when user taps notification)
    responseListenerRef.current = notificationService.addNotificationResponseListener(
      (response) => {
        // Invalidate queries when notification is tapped
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });

        // Call custom handler if provided
        if (options?.onNotificationTapped) {
          options.onNotificationTapped(response);
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      notificationService.removeNotificationSubscription(receivedListenerRef.current);
      notificationService.removeNotificationSubscription(responseListenerRef.current);
    };
  }, [options?.onNotificationReceived, options?.onNotificationTapped, queryClient]);
}

/**
 * Hook to manage badge count
 */
export function useBadgeCount() {
  const { data: unreadCount } = useUnreadNotificationCount();

  useEffect(() => {
    if (unreadCount !== undefined) {
      notificationService.setBadgeCount(unreadCount);
    }
  }, [unreadCount]);

  return {
    count: unreadCount || 0,
    clearBadge: () => notificationService.clearBadge(),
    setBadgeCount: (count: number) => notificationService.setBadgeCount(count),
  };
}
