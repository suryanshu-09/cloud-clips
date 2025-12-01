import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage wrapper for Jotai persistence (synchronous interface)
export const storage = {
  getItem: (key: string): string | null => {
    // Note: This is a workaround for Jotai's synchronous storage requirement
    // We'll use the async version in storageHelpers for better practices
    let result: string | null = null;
    AsyncStorage.getItem(key).then((value) => {
      result = value;
    });
    return result;
  },
  setItem: (key: string, value: string): void => {
    AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string): void => {
    AsyncStorage.removeItem(key);
  },
};

// Helper functions for async storage operations
export const storageHelpers = {
  // String operations
  getString: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },
  setString: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },

  // Number operations
  getNumber: async (key: string): Promise<number | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? Number(value) : null;
  },
  setNumber: async (key: string, value: number): Promise<void> => {
    await AsyncStorage.setItem(key, String(value));
  },

  // Boolean operations
  getBoolean: async (key: string): Promise<boolean | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? value === 'true' : null;
  },
  setBoolean: async (key: string, value: boolean): Promise<void> => {
    await AsyncStorage.setItem(key, String(value));
  },

  // Object operations (JSON)
  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Error parsing stored object for key "${key}":`, error);
      return null;
    }
  },
  setObject: async <T>(key: string, value: T): Promise<void> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error stringifying object for key "${key}":`, error);
    }
  },

  // Delete operations
  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
  clearAll: async (): Promise<void> => {
    await AsyncStorage.clear();
  },

  // Check existence
  contains: async (key: string): Promise<boolean> => {
    const keys = await AsyncStorage.getAllKeys();
    return keys.includes(key);
  },

  // Get all keys
  getAllKeys: async (): Promise<string[]> => {
    return await AsyncStorage.getAllKeys();
  },
};

export default storage;
