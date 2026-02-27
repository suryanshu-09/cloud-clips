// Export types
export * from './types';

// Export hooks
export * from './hooks/useNotifications';
export { usePushToken } from './hooks/usePushToken';
export {
  useNotificationSetup,
  registerInAppNotificationCallback,
} from './hooks/useNotificationSetup';

// Export service
export { notificationService } from './services/notificationService';
