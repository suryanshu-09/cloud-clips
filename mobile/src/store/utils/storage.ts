import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createJSONStorage } from 'jotai/utils';
import { Platform } from 'react-native';
import { storage as mmkvStorage, storageHelpers } from '@/services/storage/mmkv';

/**
 * Storage utilities for state persistence
 *
 * Performance optimizations:
 * - Uses MMKV for native platforms (~30x faster than AsyncStorage)
 * - Uses localStorage for web
 * - Synchronous API for better integration with Jotai and TanStack Query
 */

// Create a wrapper that works synchronously for Jotai on web
const createSyncStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage on web for synchronous access
    return {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('[Storage] Web storage setItem error:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('[Storage] Web storage removeItem error:', error);
        }
      },
    };
  }

  // On native platforms, use MMKV with synchronous API
  return mmkvStorage;
};

// Helper to create a Jotai-compatible storage object with JSON serialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = createJSONStorage<any>(createSyncStorage);

/**
 * TanStack Query persister for query cache persistence
 *
 * This enables offline-first capabilities by persisting query data
 * to MMKV storage and restoring it on app launch.
 */
export const queryClientPersister = createSyncStoragePersister({
  storage: {
    getItem: (key: string) => {
      return storageHelpers.getString(key);
    },
    setItem: (key: string, value: string) => {
      storageHelpers.setString(key, value);
    },
    removeItem: (key: string) => {
      storageHelpers.delete(key);
    },
  },
  // Throttle persistence to prevent excessive writes
  throttleTime: 1000,
});

/**
 * Storage keys for commonly persisted data
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  THEME_PREFERENCE: 'theme_preference',
  QUERY_CACHE: 'query_cache',
  LAST_SYNC: 'last_sync',
} as const;

export default storage;
