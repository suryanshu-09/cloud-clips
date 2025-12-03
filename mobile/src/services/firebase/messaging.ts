import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storageHelpers } from '../storage/mmkv';
import apiClient from '../api/client';

// Storage keys
const PUSH_TOKEN_KEY = 'pushToken';
const PUSH_TOKEN_REGISTERED_KEY = 'pushTokenRegistered';

// Check if we're running in Expo Go (where push notifications are not supported in SDK 53+)
const isExpoGo = Constants.appOwnership === 'expo';

// Configure notification handler only if not in Expo Go
if (!isExpoGo) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('[Messaging] Failed to set notification handler:', error);
  }
} else {
  console.log(
    '[Messaging] Running in Expo Go - push notifications are disabled. Use a development build for full functionality.'
  );
}

export interface INotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: {
    allowsAlert: boolean | null;
    allowsBadge: boolean | null;
    allowsSound: boolean | null;
  };
}

// FCM/Push notification service
export const messagingService = {
  // Check if notifications are available (not in Expo Go)
  isAvailable: (): boolean => {
    return !isExpoGo;
  },

  // Request notification permissions
  requestPermissions: async (): Promise<INotificationPermissions> => {
    if (isExpoGo) {
      console.warn(
        '[Messaging] Push notifications not available in Expo Go. Use a development build.'
      );
      return { granted: false, canAskAgain: false };
    }

    try {
      const { status, canAskAgain, ios } = await Notifications.requestPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        ios: ios
          ? {
              allowsAlert: ios.allowsAlert,
              allowsBadge: ios.allowsBadge,
              allowsSound: ios.allowsSound,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[Messaging] Error requesting permissions:', error);
      return { granted: false, canAskAgain: false };
    }
  },

  // Get current permission status
  getPermissionStatus: async (): Promise<INotificationPermissions> => {
    if (isExpoGo) {
      return { granted: false, canAskAgain: false };
    }

    try {
      const { status, canAskAgain, ios } = await Notifications.getPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        ios: ios
          ? {
              allowsAlert: ios.allowsAlert,
              allowsBadge: ios.allowsBadge,
              allowsSound: ios.allowsSound,
            }
          : undefined,
      };
    } catch (error) {
      console.error('[Messaging] Error getting permission status:', error);
      return { granted: false, canAskAgain: false };
    }
  },

  // Get push notification token (Expo Push Token)
  getExpoPushToken: async (): Promise<string | null> => {
    if (isExpoGo) {
      console.warn('[Messaging] Push tokens not available in Expo Go. Use a development build.');
      return null;
    }

    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.warn('[Messaging] EAS Project ID not found. Push notifications may not work.');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId });

      // Store token locally
      storageHelpers.setString('expoPushToken', token.data);

      return token.data;
    } catch (error) {
      console.error('[Messaging] Error getting push token:', error);
      return null;
    }
  },

  // Get device push token (for FCM/APNS)
  getDevicePushToken: async (): Promise<string | null> => {
    if (isExpoGo) {
      return null;
    }

    try {
      const token = await Notifications.getDevicePushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('[Messaging] Error getting device push token:', error);
      return null;
    }
  },

  /**
   * Register push token with the backend
   * This should be called after login and when the token refreshes
   */
  registerTokenWithBackend: async (): Promise<boolean> => {
    if (isExpoGo) {
      console.warn('[Messaging] Cannot register token in Expo Go.');
      return false;
    }

    try {
      // Get the push token
      const expoPushToken = await messagingService.getExpoPushToken();
      const devicePushToken = await messagingService.getDevicePushToken();

      const token = expoPushToken || devicePushToken;
      if (!token) {
        console.warn('[Messaging] No push token available to register');
        return false;
      }

      // Check if we've already registered this token
      const storedToken = storageHelpers.getString(PUSH_TOKEN_KEY);
      const alreadyRegistered = storageHelpers.getBoolean(PUSH_TOKEN_REGISTERED_KEY);

      if (storedToken === token && alreadyRegistered) {
        console.log('[Messaging] Token already registered with backend');
        return true;
      }

      // Register with backend
      await apiClient.post('/notifications/token', {
        token,
        tokenType: expoPushToken ? 'expo' : Platform.OS === 'ios' ? 'apns' : 'fcm',
        platform: Platform.OS,
        deviceId: Constants.sessionId || 'unknown',
      });

      // Store the registered token
      storageHelpers.setString(PUSH_TOKEN_KEY, token);
      storageHelpers.setBoolean(PUSH_TOKEN_REGISTERED_KEY, true);

      console.log('[Messaging] Push token registered with backend successfully');
      return true;
    } catch (error) {
      console.error('[Messaging] Error registering token with backend:', error);
      return false;
    }
  },

  /**
   * Unregister push token from backend
   * Call this on logout
   */
  unregisterTokenFromBackend: async (): Promise<void> => {
    try {
      const token = storageHelpers.getString(PUSH_TOKEN_KEY);
      if (token) {
        await apiClient.delete('/notifications/token', { data: { token } }).catch(() => {});
      }

      // Clear stored token info
      storageHelpers.delete(PUSH_TOKEN_KEY);
      storageHelpers.setBoolean(PUSH_TOKEN_REGISTERED_KEY, false);

      console.log('[Messaging] Push token unregistered from backend');
    } catch (error) {
      console.error('[Messaging] Error unregistering token:', error);
    }
  },

  // Schedule a local notification
  scheduleNotification: async (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string | null> => {
    if (isExpoGo) {
      console.warn('[Messaging] Notifications not available in Expo Go.');
      return null;
    }

    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: trigger || null,
      });
    } catch (error) {
      console.error('[Messaging] Error scheduling notification:', error);
      return null;
    }
  },

  /**
   * Schedule an appointment reminder notification
   */
  scheduleAppointmentReminder: async (
    appointmentId: string,
    barberName: string,
    appointmentTime: Date,
    reminderMinutes: number = 60
  ): Promise<string | null> => {
    if (isExpoGo) return null;

    const reminderTime = new Date(appointmentTime.getTime() - reminderMinutes * 60 * 1000);

    // Don't schedule if the reminder time is in the past
    if (reminderTime <= new Date()) {
      console.log('[Messaging] Reminder time is in the past, skipping');
      return null;
    }

    return await messagingService.scheduleNotification(
      'Appointment Reminder',
      `Your appointment with ${barberName} is in ${reminderMinutes} minutes`,
      {
        type: 'appointment_reminder',
        appointmentId,
      },
      { date: reminderTime }
    );
  },

  // Cancel a scheduled notification
  cancelNotification: async (notificationId: string): Promise<void> => {
    if (isExpoGo) return;

    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('[Messaging] Error canceling notification:', error);
    }
  },

  // Cancel all scheduled notifications
  cancelAllNotifications: async (): Promise<void> => {
    if (isExpoGo) return;

    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Messaging] Error canceling all notifications:', error);
    }
  },

  // Get all scheduled notifications
  getScheduledNotifications: async (): Promise<Notifications.NotificationRequest[]> => {
    if (isExpoGo) return [];

    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('[Messaging] Error getting scheduled notifications:', error);
      return [];
    }
  },

  // Get badge count
  getBadgeCount: async (): Promise<number> => {
    if (isExpoGo || Platform.OS !== 'ios') return 0;

    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('[Messaging] Error getting badge count:', error);
      return 0;
    }
  },

  // Set badge count
  setBadgeCount: async (count: number): Promise<void> => {
    if (isExpoGo || Platform.OS !== 'ios') return;

    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('[Messaging] Error setting badge count:', error);
    }
  },

  // Clear badge
  clearBadge: async (): Promise<void> => {
    if (isExpoGo || Platform.OS !== 'ios') return;

    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('[Messaging] Error clearing badge:', error);
    }
  },

  // Add notification received listener
  addNotificationReceivedListener: (
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription | null => {
    if (isExpoGo) {
      console.warn('[Messaging] Notification listeners not available in Expo Go.');
      return null;
    }

    try {
      return Notifications.addNotificationReceivedListener(listener);
    } catch (error) {
      console.error('[Messaging] Error adding notification listener:', error);
      return null;
    }
  },

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener: (
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription | null => {
    if (isExpoGo) {
      return null;
    }

    try {
      return Notifications.addNotificationResponseReceivedListener(listener);
    } catch (error) {
      console.error('[Messaging] Error adding response listener:', error);
      return null;
    }
  },

  // Remove notification listeners
  removeNotificationSubscription: (subscription: Notifications.Subscription | null): void => {
    if (subscription) {
      subscription.remove();
    }
  },

  // Present notification immediately
  presentNotification: async (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string | null> => {
    if (isExpoGo) {
      console.warn('[Messaging] Notifications not available in Expo Go.');
      return null;
    }

    try {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // null means present immediately
      });
    } catch (error) {
      console.error('[Messaging] Error presenting notification:', error);
      return null;
    }
  },

  /**
   * Get the last notification response (for handling deep links from killed state)
   */
  getLastNotificationResponse: async (): Promise<Notifications.NotificationResponse | null> => {
    if (isExpoGo) return null;

    try {
      return await Notifications.getLastNotificationResponseAsync();
    } catch (error) {
      console.error('[Messaging] Error getting last notification response:', error);
      return null;
    }
  },

  /**
   * Dismiss all presented notifications
   */
  dismissAllNotifications: async (): Promise<void> => {
    if (isExpoGo) return;

    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('[Messaging] Error dismissing notifications:', error);
    }
  },
};

export default messagingService;
