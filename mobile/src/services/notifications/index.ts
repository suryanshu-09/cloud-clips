/**
 * Notifications Service Index
 *
 * Re-exports all notification-related functionality
 */

export {
  setupNotificationHandlers,
  initializeNotifications,
  cleanupNotifications,
  registerInAppNotificationCallback,
  getNotificationAnalytics,
} from './handlers';

export type { NotificationType, INotificationData } from './handlers';
