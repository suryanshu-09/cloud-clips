import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { createJSONStorage } from 'jotai/utils';
import { Platform } from 'react-native';

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
          console.error('Storage setItem error:', error);
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('Storage removeItem error:', error);
        }
      },
    };
  }

  // On native platforms, wrap AsyncStorage with a sync-like interface
  // Note: This is not truly synchronous but works with Jotai's storage
  return AsyncStorage;
};

// Helper to create a Jotai-compatible storage object with JSON serialization
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const storage = createJSONStorage<any>(createSyncStorage);

// TanStack Query persister for AsyncStorage
export const queryClientPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});
