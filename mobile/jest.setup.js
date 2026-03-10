import '@testing-library/jest-native/extend-expect';

// Mock MMKV storage
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock the storage utility to avoid issues with atomWithStorage in tests
const mockStorage = {
  getItem: jest.fn((key) => {
    // Return initial auth state for auth key
    if (key === 'auth') {
      return JSON.stringify({
        isAuthenticated: false,
        user: null,
        token: null,
        refreshToken: null,
      });
    }
    return null;
  }),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};

jest.mock('@/store/utils/storage', () => ({
  storage: mockStorage,
  queryClientPersister: {
    persistClient: jest.fn(),
    restoreClient: jest.fn(),
    removeClient: jest.fn(),
  },
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  useSegments: () => [],
  usePathname: () => '',
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  watchPositionAsync: jest.fn(),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

// Silence the warning: Animated: `useNativeDriver` is not supported
// Note: jest-expo preset handles this automatically

// Mock console methods to keep test output clean
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Define __DEV__ for tests
global.__DEV__ = true;

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  jest.clearAllTimers();
});

// Use fake timers to prevent hanging tests
beforeEach(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});
