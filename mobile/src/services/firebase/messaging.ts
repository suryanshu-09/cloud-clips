import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storageHelpers } from '../storage/mmkv';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  // Request notification permissions
  requestPermissions: async (): Promise<INotificationPermissions> => {
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
  },

  // Get current permission status
  getPermissionStatus: async (): Promise<INotificationPermissions> => {
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
  },

  // Get push notification token (Expo Push Token)
  getExpoPushToken: async (): Promise<string | null> => {
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
    try {
      const token = await Notifications.getDevicePushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('[Messaging] Error getting device push token:', error);
      return null;
    }
  },

  // Schedule a local notification
  scheduleNotification: async (
    title: string,
    body: string,
    data?: Record<string, unknown>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: trigger || null,
    });
  },

  // Cancel a scheduled notification
  cancelNotification: async (notificationId: string): Promise<void> => {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  // Cancel all scheduled notifications
  cancelAllNotifications: async (): Promise<void> => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  // Get badge count
  getBadgeCount: async (): Promise<number> => {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  },

  // Set badge count
  setBadgeCount: async (count: number): Promise<void> => {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  },

  // Clear badge
  clearBadge: async (): Promise<void> => {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(0);
    }
  },

  // Add notification received listener
  addNotificationReceivedListener: (
    listener: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(listener);
  },

  // Add notification response listener (when user taps notification)
  addNotificationResponseListener: (
    listener: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(listener);
  },

  // Remove notification listeners
  removeNotificationSubscription: (subscription: Notifications.Subscription): void => {
    subscription.remove();
  },

  // Present notification immediately
  presentNotification: async (
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): Promise<string> => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null, // null means present immediately
    });
  },
};

export default messagingService;
