import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Try to load MMKV, but gracefully fallback if native modules aren't available (e.g., Expo Go)
let mmkvInstance: {
  getString: (key: string) => string | undefined;
  set: (key: string, value: string | number | boolean) => void;
  getNumber: (key: string) => number | undefined;
  getBoolean: (key: string) => boolean | undefined;
  delete: (key: string) => void;
  contains: (key: string) => boolean;
  getAllKeys: () => string[];
  clearAll: () => void;
} | null = null;

let useAsyncStorageFallback = false;

// In-memory cache for AsyncStorage fallback (to provide sync-like API)
const memoryCache: Map<string, string> = new Map();
let memoryCacheInitialized = false;

// Initialize MMKV or fallback
try {
  if (Platform.OS !== 'web') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require('react-native-mmkv');
    mmkvInstance = new MMKV();
  }
} catch (error) {
  console.warn('[Storage] MMKV not available, falling back to AsyncStorage:', error);
  useAsyncStorageFallback = true;
}

// Initialize memory cache from AsyncStorage (for sync-like API)
async function initializeMemoryCache(): Promise<void> {
  if (memoryCacheInitialized || !useAsyncStorageFallback) return;

  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value]) => {
      if (value !== null) {
        memoryCache.set(key, value);
      }
    });
    memoryCacheInitialized = true;
  } catch (error) {
    console.error('[Storage] Failed to initialize memory cache:', error);
  }
}

// Call initialization immediately for Expo Go
if (useAsyncStorageFallback) {
  initializeMemoryCache();
}

/**
 * High-performance storage using MMKV on native platforms
 * Falls back to AsyncStorage (with memory cache) in Expo Go
 * Falls back to localStorage on web
 *
 * Performance benefits (with MMKV):
 * - Synchronous API (no async/await needed)
 * - ~30x faster than AsyncStorage
 * - Efficient memory usage
 * - Automatic encryption support
 */

// Storage wrapper for Jotai persistence (synchronous interface)
export const storage = {
  getItem: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    if (useAsyncStorageFallback) {
      return memoryCache.get(key) ?? null;
    }

    return mmkvInstance?.getString(key) ?? null;
  },
  setItem: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('[Storage] Web storage setItem error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.set(key, value);
      // Persist to AsyncStorage in background
      AsyncStorage.setItem(key, value).catch((error) => {
        console.error('[Storage] AsyncStorage setItem error:', error);
      });
      return;
    }

    mmkvInstance?.set(key, value);
  },
  removeItem: (key: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('[Storage] Web storage removeItem error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.delete(key);
      // Persist to AsyncStorage in background
      AsyncStorage.removeItem(key).catch((error) => {
        console.error('[Storage] AsyncStorage removeItem error:', error);
      });
      return;
    }

    mmkvInstance?.delete(key);
  },
};

// Helper functions for typed storage operations
export const storageHelpers = {
  // String operations
  getString: (key: string): string | null => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }

    if (useAsyncStorageFallback) {
      return memoryCache.get(key) ?? null;
    }

    return mmkvInstance?.getString(key) ?? null;
  },
  setString: (key: string, value: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('[Storage] Web storage error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.set(key, value);
      AsyncStorage.setItem(key, value).catch((error) => {
        console.error('[Storage] AsyncStorage error:', error);
      });
      return;
    }

    mmkvInstance?.set(key, value);
  },

  // Number operations
  getNumber: (key: string): number | null => {
    if (Platform.OS === 'web') {
      try {
        const value = localStorage.getItem(key);
        return value ? Number(value) : null;
      } catch {
        return null;
      }
    }

    if (useAsyncStorageFallback) {
      const value = memoryCache.get(key);
      return value ? Number(value) : null;
    }

    const value = mmkvInstance?.getNumber(key);
    return value !== undefined ? value : null;
  },
  setNumber: (key: string, value: number): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, String(value));
      } catch (error) {
        console.error('[Storage] Web storage error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.set(key, String(value));
      AsyncStorage.setItem(key, String(value)).catch((error) => {
        console.error('[Storage] AsyncStorage error:', error);
      });
      return;
    }

    mmkvInstance?.set(key, value);
  },

  // Boolean operations
  getBoolean: (key: string): boolean | null => {
    if (Platform.OS === 'web') {
      try {
        const value = localStorage.getItem(key);
        return value ? value === 'true' : null;
      } catch {
        return null;
      }
    }

    if (useAsyncStorageFallback) {
      const value = memoryCache.get(key);
      return value ? value === 'true' : null;
    }

    const value = mmkvInstance?.getBoolean(key);
    return value !== undefined ? value : null;
  },
  setBoolean: (key: string, value: boolean): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(key, String(value));
      } catch (error) {
        console.error('[Storage] Web storage error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.set(key, String(value));
      AsyncStorage.setItem(key, String(value)).catch((error) => {
        console.error('[Storage] AsyncStorage error:', error);
      });
      return;
    }

    mmkvInstance?.set(key, value);
  },

  // Object operations (JSON)
  getObject: <T>(key: string): T | null => {
    const value = storageHelpers.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`[Storage] Error parsing stored object for key "${key}":`, error);
      return null;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    try {
      storageHelpers.setString(key, JSON.stringify(value));
    } catch (error) {
      console.error(`[Storage] Error stringifying object for key "${key}":`, error);
    }
  },

  // Delete operations
  delete: (key: string): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('[Storage] Web storage error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.delete(key);
      AsyncStorage.removeItem(key).catch((error) => {
        console.error('[Storage] AsyncStorage error:', error);
      });
      return;
    }

    mmkvInstance?.delete(key);
  },
  clearAll: (): void => {
    if (Platform.OS === 'web') {
      try {
        localStorage.clear();
      } catch (error) {
        console.error('[Storage] Web storage error:', error);
      }
      return;
    }

    if (useAsyncStorageFallback) {
      memoryCache.clear();
      AsyncStorage.clear().catch((error) => {
        console.error('[Storage] AsyncStorage error:', error);
      });
      return;
    }

    mmkvInstance?.clearAll();
  },

  // Check existence
  contains: (key: string): boolean => {
    if (Platform.OS === 'web') {
      try {
        return localStorage.getItem(key) !== null;
      } catch {
        return false;
      }
    }

    if (useAsyncStorageFallback) {
      return memoryCache.has(key);
    }

    return mmkvInstance?.contains(key) ?? false;
  },

  // Get all keys
  getAllKeys: (): string[] => {
    if (Platform.OS === 'web') {
      try {
        return Object.keys(localStorage);
      } catch {
        return [];
      }
    }

    if (useAsyncStorageFallback) {
      return Array.from(memoryCache.keys());
    }

    return mmkvInstance?.getAllKeys() ?? [];
  },
};

// Export MMKV instance for advanced usage (may be null in Expo Go)
export { mmkvInstance };

// Export flag to check if using fallback
export const isUsingAsyncStorageFallback = useAsyncStorageFallback;

export default storage;
