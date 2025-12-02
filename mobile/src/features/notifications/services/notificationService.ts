import apiClient from '@/services/api/client';
import { messagingService } from '@/services/firebase/messaging';
import * as Notifications from 'expo-notifications';
import type {
  INotification,
  INotificationPermissions,
  INotificationSettings,
  IPushTokens,
  INotificationPayload,
  IScheduledNotification,
} from '../types';

export const notificationService = {
  /**
   * Request notification permissions from the device
   */
  async requestPermissions(): Promise<INotificationPermissions> {
    return await messagingService.requestPermissions();
  },

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<INotificationPermissions> {
    return await messagingService.getPermissionStatus();
  },

  /**
   * Register device for push notifications
   * Gets the push token and sends it to the backend
   */
  async registerForPushNotifications(): Promise<IPushTokens> {
    const expoPushToken = await messagingService.getExpoPushToken();
    const devicePushToken = await messagingService.getDevicePushToken();

    const tokens: IPushTokens = {
      expoPushToken,
      devicePushToken,
    };

    // Send token to backend if we have one
    if (expoPushToken) {
      try {
        await apiClient.post('/notifications/register', {
          expoPushToken,
          devicePushToken,
        });
      } catch (error) {
        console.error('[NotificationService] Failed to register token with backend:', error);
      }
    }

    return tokens;
  },

  /**
   * Unregister device from push notifications
   */
  async unregisterFromPushNotifications(): Promise<void> {
    try {
      await apiClient.post('/notifications/unregister');
    } catch (error) {
      console.error('[NotificationService] Failed to unregister from push notifications:', error);
      throw error;
    }
  },

  /**
   * Get all notifications for the current user
   */
  async getNotifications(params?: {
    limit?: number;
    cursor?: string;
    unreadOnly?: boolean;
  }): Promise<{ notifications: INotification[]; nextCursor?: string }> {
    const response = await apiClient.get<{ notifications: INotification[]; nextCursor?: string }>(
      '/notifications',
      { params }
    );
    return response.data;
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return response.data.count;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    await apiClient.post('/notifications/mark-all-read');
  },

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  /**
   * Get notification settings for the current user
   */
  async getNotificationSettings(): Promise<INotificationSettings> {
    const response = await apiClient.get<INotificationSettings>('/notifications/settings');
    return response.data;
  },

  /**
   * Update notification settings
   */
  async updateNotificationSettings(
    settings: Partial<INotificationSettings>
  ): Promise<INotificationSettings> {
    const response = await apiClient.patch<INotificationSettings>(
      '/notifications/settings',
      settings
    );
    return response.data;
  },

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    payload: INotificationPayload,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    return await messagingService.scheduleNotification(
      payload.title,
      payload.body,
      payload.data,
      trigger
    );
  },

  /**
   * Cancel a scheduled notification
   */
  async cancelScheduledNotification(notificationId: string): Promise<void> {
    await messagingService.cancelNotification(notificationId);
  },

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllScheduledNotifications(): Promise<void> {
    await messagingService.cancelAllNotifications();
  },

  /**
   * Get all scheduled notifications
   */
  async getAllScheduledNotifications(): Promise<IScheduledNotification[]> {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.map((notification) => ({
      id: notification.identifier,
      title: notification.content.title || '',
      body: notification.content.body || '',
      data: notification.content.data as Record<string, any>,
      scheduledTime: notification.trigger
        ? 'date' in notification.trigger
          ? new Date(notification.trigger.date)
          : new Date()
        : new Date(),
    }));
  },

  /**
   * Present a notification immediately (local notification)
   */
  async presentNotification(payload: INotificationPayload): Promise<string> {
    return await messagingService.presentNotification(payload.title, payload.body, payload.data);
  },

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    return await messagingService.getBadgeCount();
  },

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await messagingService.setBadgeCount(count);
  },

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await messagingService.clearBadge();
  },

  /**
   * Add notification received listener
   * Returns a subscription that should be cleaned up
   */
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return messagingService.addNotificationReceivedListener(listener);
  },

  /**
   * Add notification response listener (when user taps notification)
   * Returns a subscription that should be cleaned up
   */
  addNotificationResponseListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return messagingService.addNotificationResponseListener(listener);
  },

  /**
   * Remove notification subscription
   */
  removeNotificationSubscription(subscription: Notifications.Subscription): void {
    messagingService.removeNotificationSubscription(subscription);
  },
};
