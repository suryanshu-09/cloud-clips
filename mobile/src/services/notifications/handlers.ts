/**
 * Notification Handlers
 *
 * Handles foreground and background notifications, including deep linking
 * to appropriate screens based on notification type.
 */

import { router } from 'expo-router';
import { messagingService } from '../firebase/messaging';

// Use types from expo-notifications without importing the module directly
type Notification = import('expo-notifications').Notification;
type NotificationResponse = import('expo-notifications').NotificationResponse;
type Subscription = import('expo-notifications').Subscription;

/**
 * Notification types that the app can receive
 */
export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'new_message'
  | 'payment_received'
  | 'payment_failed'
  | 'order_update'
  | 'promo'
  | 'system';

/**
 * Notification data payload
 */
export interface INotificationData {
  type: NotificationType;
  appointmentId?: string;
  barberId?: string;
  orderId?: string;
  messageId?: string;
  promoCode?: string;
  deepLink?: string;
}

/**
 * In-app notification display options
 */
interface IInAppNotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  onPress?: () => void;
}

// Store for in-app notification callback
let showInAppNotificationCallback: ((options: IInAppNotificationOptions) => void) | null = null;

/**
 * Register a callback to show in-app notifications (e.g., toast/snackbar)
 * This should be called from the root layout component
 */
export const registerInAppNotificationCallback = (
  callback: (options: IInAppNotificationOptions) => void
): void => {
  showInAppNotificationCallback = callback;
};

/**
 * Show an in-app notification using the registered callback
 */
const showInAppNotification = (options: IInAppNotificationOptions): void => {
  if (showInAppNotificationCallback) {
    showInAppNotificationCallback(options);
  } else {
    // Fallback to console log if no callback registered
    console.log('[Notifications] In-app notification:', options);
  }
};

/**
 * Handle notification press (deep linking)
 */
const handleNotificationPress = (data: INotificationData): void => {
  console.log('[Notifications] Handling notification press:', data);

  // If there's a specific deep link, use it
  if (data.deepLink) {
    router.push(data.deepLink as any);
    return;
  }

  // Handle based on notification type
  switch (data.type) {
    case 'appointment_reminder':
    case 'appointment_confirmed':
    case 'appointment_cancelled':
    case 'appointment_rescheduled':
      if (data.appointmentId) {
        router.push(`/(client)/appointments/${data.appointmentId}` as any);
      } else {
        router.push('/(client)/appointments' as any);
      }
      break;

    case 'new_message':
      if (data.appointmentId) {
        router.push(`/(client)/chat/${data.appointmentId}` as any);
      } else {
        router.push('/(client)/messages' as any);
      }
      break;

    case 'payment_received':
    case 'payment_failed':
      if (data.appointmentId) {
        router.push(`/(client)/appointments/${data.appointmentId}` as any);
      } else if (data.orderId) {
        router.push(`/(client)/profile/orders/${data.orderId}` as any);
      }
      break;

    case 'order_update':
      if (data.orderId) {
        router.push(`/(client)/profile/orders/${data.orderId}` as any);
      } else {
        router.push('/(client)/profile/orders' as any);
      }
      break;

    case 'promo':
      router.push('/(client)/coupons' as any);
      break;

    case 'system':
    default:
      // Navigate to notifications screen
      router.push('/(client)/notifications' as any);
      break;
  }
};

/**
 * Handle foreground notification (when app is open)
 */
const handleForegroundNotification = (notification: Notification): void => {
  const { title, body, data } = notification.request.content;

  console.log('[Notifications] Foreground notification received:', { title, body, data });

  // Show in-app notification
  showInAppNotification({
    title: title || 'Notification',
    body: body || '',
    type: (data?.type as NotificationType) || 'system',
    onPress: () => handleNotificationPress(data as INotificationData),
  });
};

/**
 * Handle notification response (user tapped notification)
 */
const handleNotificationResponse = (response: NotificationResponse): void => {
  const { data } = response.notification.request.content;

  console.log('[Notifications] Notification response:', data);

  if (data) {
    handleNotificationPress(data as INotificationData);
  }
};

// Track subscription state
let isSetup = false;
let foregroundSubscription: Subscription | null = null;
let responseSubscription: Subscription | null = null;

/**
 * Setup notification handlers
 * Should be called once when the app starts (e.g., in the root layout)
 */
export const setupNotificationHandlers = (): (() => void) => {
  if (isSetup) {
    console.log('[Notifications] Handlers already setup');
    return () => {};
  }

  console.log('[Notifications] Setting up notification handlers');

  // Handle foreground notifications
  foregroundSubscription = messagingService.addNotificationReceivedListener(
    handleForegroundNotification
  );

  // Handle notification taps
  responseSubscription = messagingService.addNotificationResponseListener(
    handleNotificationResponse
  );

  // Check if app was opened from notification (killed state)
  messagingService.getLastNotificationResponse().then((response) => {
    if (response) {
      const { data } = response.notification.request.content;
      console.log('[Notifications] App opened from notification:', data);

      // Small delay to ensure navigation is ready
      setTimeout(() => {
        if (data) {
          handleNotificationPress(data as INotificationData);
        }
      }, 500);
    }
  });

  isSetup = true;

  // Return cleanup function
  return () => {
    console.log('[Notifications] Cleaning up notification handlers');

    if (foregroundSubscription) {
      messagingService.removeNotificationSubscription(foregroundSubscription);
      foregroundSubscription = null;
    }

    if (responseSubscription) {
      messagingService.removeNotificationSubscription(responseSubscription);
      responseSubscription = null;
    }

    isSetup = false;
  };
};

/**
 * Request notification permissions and register token
 * Should be called after user logs in
 */
export const initializeNotifications = async (): Promise<boolean> => {
  try {
    // Check if notifications are available
    if (!messagingService.isAvailable()) {
      console.log('[Notifications] Notifications not available in this environment');
      return false;
    }

    // Request permissions
    const permissions = await messagingService.requestPermissions();

    if (!permissions.granted) {
      console.log('[Notifications] Permission not granted');
      return false;
    }

    // Register token with backend
    const registered = await messagingService.registerTokenWithBackend();

    console.log('[Notifications] Initialization complete, token registered:', registered);
    return registered;
  } catch (error) {
    console.error('[Notifications] Initialization error:', error);
    return false;
  }
};

/**
 * Cleanup notifications on logout
 */
export const cleanupNotifications = async (): Promise<void> => {
  try {
    // Unregister token from backend
    await messagingService.unregisterTokenFromBackend();

    // Clear badge
    await messagingService.clearBadge();

    // Cancel all scheduled notifications
    await messagingService.cancelAllNotifications();

    console.log('[Notifications] Cleanup complete');
  } catch (error) {
    console.error('[Notifications] Cleanup error:', error);
  }
};

/**
 * Get notification-related analytics data
 */
export const getNotificationAnalytics = async (): Promise<{
  hasPermission: boolean;
  badgeCount: number;
  scheduledCount: number;
}> => {
  const permissions = await messagingService.getPermissionStatus();
  const badgeCount = await messagingService.getBadgeCount();
  const scheduled = await messagingService.getScheduledNotifications();

  return {
    hasPermission: permissions.granted,
    badgeCount,
    scheduledCount: scheduled.length,
  };
};

export default {
  setupNotificationHandlers,
  initializeNotifications,
  cleanupNotifications,
  registerInAppNotificationCallback,
  getNotificationAnalytics,
};
