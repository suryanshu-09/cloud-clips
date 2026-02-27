/**
 * useNotificationSetup Hook
 *
 * Central hook for setting up Expo push notifications in the app.
 * Combines notification handlers, token registration, and permission management.
 * Should be used in the root layout to initialize notifications globally.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAtomValue } from 'jotai';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { isAuthenticatedAtom } from '@/store/atoms/authAtom';
import { usePushToken } from './usePushToken';
import { NotificationType } from '../types';
import { messagingService } from '@/services/firebase/messaging';

// In-app notification callback type
interface IInAppNotificationOptions {
  title: string;
  body: string;
  type?: NotificationType;
  onPress?: () => void;
}

let showInAppNotificationCallback: ((options: IInAppNotificationOptions) => void) | null = null;

/**
 * Register a callback to show in-app notifications (e.g., toast/snackbar)
 * Should be called from the root layout or notification provider component
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
    console.log('[Notifications] In-app notification:', options);
  }
};

/**
 * Handle notification press for deep linking
 */
const handleNotificationPress = (data: Record<string, any>): void => {
  console.log('[Notifications] Handling notification press:', data);

  const type = data?.type as NotificationType;
  const deepLink = data?.deepLink as string;

  // If there's a specific deep link, use it
  if (deepLink) {
    router.push(deepLink as any);
    return;
  }

  // Handle based on notification type
  switch (type) {
    case 'appointment':
      const appointmentId = data?.appointmentId as string;
      if (appointmentId) {
        router.push(`/(client)/appointments/${appointmentId}` as any);
      } else {
        router.push('/(client)/appointments' as any);
      }
      break;

    case 'chat':
      const conversationId = data?.conversationId as string;
      if (conversationId) {
        router.push(`/(client)/chat/${conversationId}` as any);
      } else {
        router.push('/(client)/messages' as any);
      }
      break;

    case 'promo':
      router.push('/(client)/coupons' as any);
      break;

    case 'system':
    default:
      router.push('/(client)/notifications' as any);
      break;
  }
};

export interface IUseNotificationSetupReturn {
  isAvailable: boolean;
  registerInAppCallback: (callback: (options: IInAppNotificationOptions) => void) => void;
}

/**
 * Hook to set up push notifications in the app
 * Handles:
 * - Setting notification handler configuration
 * - Listening for foreground notifications
 * - Listening for notification taps (deep linking)
 * - Auto-registering push token when authenticated
 * - Handling app launch from notification (killed state)
 */
export function useNotificationSetup(): IUseNotificationSetupReturn {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const { registerToken, unregisterToken, isAvailable } = usePushToken();
  const listenersSetupRef = useRef(false);

  /**
   * Handle foreground notification (app is open)
   */
  const handleForegroundNotification = useCallback((notification: Notifications.Notification) => {
    const { title, body, data } = notification.request.content;

    console.log('[Notifications] Foreground notification received:', { title, body, data });

    // Show in-app notification
    showInAppNotification({
      title: title || 'Notification',
      body: body || '',
      type: (data?.type as NotificationType) || 'system',
      onPress: () => handleNotificationPress(data || {}),
    });
  }, []);

  /**
   * Handle notification response (user tapped notification)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const { data } = response.notification.request.content;

    console.log('[Notifications] Notification tapped:', data);

    if (data) {
      handleNotificationPress(data);
    }
  }, []);

  /**
   * Initialize notification handlers and listeners
   */
  useEffect(() => {
    if (!messagingService.isAvailable()) {
      console.log('[Notifications] Push notifications not available in this environment');
      return;
    }

    if (listenersSetupRef.current) {
      return;
    }

    console.log('[Notifications] Setting up notification handlers');

    // Set up notification handler configuration
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Listen for foreground notifications
    const foregroundSubscription = Notifications.addNotificationReceivedListener(
      handleForegroundNotification
    );

    // Listen for notification taps
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Check if app was opened from notification (killed state)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const { data } = response.notification.request.content;
        console.log('[Notifications] App opened from notification:', data);

        // Small delay to ensure navigation is ready
        setTimeout(() => {
          if (data) {
            handleNotificationPress(data);
          }
        }, 500);
      }
    });

    listenersSetupRef.current = true;

    // Cleanup
    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
      listenersSetupRef.current = false;
    };
  }, [handleForegroundNotification, handleNotificationResponse]);

  /**
   * Auto-register token when user becomes authenticated
   */
  useEffect(() => {
    if (isAuthenticated && isAvailable) {
      const timeoutId = setTimeout(() => {
        registerToken();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, isAvailable, registerToken]);

  /**
   * Unregister token on logout
   */
  useEffect(() => {
    if (!isAuthenticated && isAvailable) {
      unregisterToken();
    }
  }, [isAuthenticated, isAvailable, unregisterToken]);

  return {
    isAvailable,
    registerInAppCallback: registerInAppNotificationCallback,
  };
}

export default useNotificationSetup;
