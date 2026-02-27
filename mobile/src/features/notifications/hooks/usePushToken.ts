/**
 * usePushToken Hook
 *
 * Manages Expo push token registration with Convex backend.
 * Uses Convex mutations instead of REST API for better real-time sync.
 */

import { useCallback, useEffect, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@convex/_generated/api';
import { messagingService } from '@/services/firebase/messaging';
import { storageHelpers } from '@/services/storage/mmkv';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Storage keys
const PUSH_TOKEN_KEY = 'pushToken';
const PUSH_TOKEN_REGISTERED_KEY = 'pushTokenRegistered';

export interface IUsePushTokenReturn {
  registerToken: () => Promise<boolean>;
  unregisterToken: () => Promise<void>;
  isAvailable: boolean;
}

/**
 * Hook to manage push token registration with Convex
 */
export function usePushToken(): IUsePushTokenReturn {
  const { isAuthenticated } = useAuth();
  const isRegisteringRef = useRef(false);

  // Convex mutations
  const registerPushTokenMutation = useMutation(api.notifications.registerPushToken);
  const unregisterPushTokenMutation = useMutation(api.notifications.unregisterPushToken);

  /**
   * Register the current device's push token with Convex
   */
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (isRegisteringRef.current) {
      console.log('[usePushToken] Registration already in progress');
      return false;
    }

    if (!messagingService.isAvailable()) {
      console.log('[usePushToken] Push notifications not available in this environment');
      return false;
    }

    if (!isAuthenticated) {
      console.log('[usePushToken] User not authenticated, skipping token registration');
      return false;
    }

    isRegisteringRef.current = true;

    try {
      // Get the Expo push token
      const expoPushToken = await messagingService.getExpoPushToken();

      if (!expoPushToken) {
        console.warn('[usePushToken] No push token available');
        return false;
      }

      // Check if we've already registered this token
      const storedToken = storageHelpers.getString(PUSH_TOKEN_KEY);
      const alreadyRegistered = storageHelpers.getBoolean(PUSH_TOKEN_REGISTERED_KEY);

      if (storedToken === expoPushToken && alreadyRegistered) {
        console.log('[usePushToken] Token already registered with backend');
        return true;
      }

      // Register with Convex
      await registerPushTokenMutation({ token: expoPushToken });

      // Store the registered token
      storageHelpers.setString(PUSH_TOKEN_KEY, expoPushToken);
      storageHelpers.setBoolean(PUSH_TOKEN_REGISTERED_KEY, true);

      console.log('[usePushToken] Push token registered with Convex successfully');
      return true;
    } catch (error) {
      console.error('[usePushToken] Failed to register push token:', error);
      return false;
    } finally {
      isRegisteringRef.current = false;
    }
  }, [isAuthenticated, registerPushTokenMutation]);

  /**
   * Unregister the current device's push token from Convex
   */
  const unregisterToken = useCallback(async (): Promise<void> => {
    try {
      const token = storageHelpers.getString(PUSH_TOKEN_KEY);

      if (token) {
        // Unregister from Convex
        await unregisterPushTokenMutation({ token });

        // Clear stored token info
        storageHelpers.delete(PUSH_TOKEN_KEY);
        storageHelpers.setBoolean(PUSH_TOKEN_REGISTERED_KEY, false);

        console.log('[usePushToken] Push token unregistered from Convex');
      }
    } catch (error) {
      console.error('[usePushToken] Failed to unregister push token:', error);
    }
  }, [unregisterPushTokenMutation]);

  /**
   * Auto-register token when user becomes authenticated
   */
  useEffect(() => {
    if (isAuthenticated && messagingService.isAvailable()) {
      // Small delay to ensure everything is ready
      const timeoutId = setTimeout(() => {
        registerToken();
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, registerToken]);

  return {
    registerToken,
    unregisterToken,
    isAvailable: messagingService.isAvailable(),
  };
}

export default usePushToken;
