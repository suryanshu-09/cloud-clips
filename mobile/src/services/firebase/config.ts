import { initializeApp, FirebaseApp, getApps } from 'firebase/app';
import Constants from 'expo-constants';

// Firebase configuration interface
interface IFirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

// Get Firebase config from environment variables
const firebaseConfig: IFirebaseConfig = {
  apiKey:
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY || Constants.expoConfig?.extra?.firebaseApiKey || '',
  authDomain:
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    Constants.expoConfig?.extra?.firebaseAuthDomain ||
    '',
  projectId:
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ||
    Constants.expoConfig?.extra?.firebaseProjectId ||
    '',
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    Constants.expoConfig?.extra?.firebaseStorageBucket ||
    '',
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    Constants.expoConfig?.extra?.firebaseMessagingSenderId ||
    '',
  appId:
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || Constants.expoConfig?.extra?.firebaseAppId || '',
  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ||
    Constants.expoConfig?.extra?.firebaseMeasurementId,
};

// Validate Firebase configuration
const validateFirebaseConfig = (config: IFirebaseConfig): boolean => {
  const requiredFields: (keyof IFirebaseConfig)[] = [
    'apiKey',
    'authDomain',
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId',
  ];

  const missingFields = requiredFields.filter((field) => !config[field]);

  if (missingFields.length > 0) {
    // Silent fail - only log once during initialization
    return false;
  }

  return true;
};

// Initialize Firebase app
let firebaseApp: FirebaseApp | null = null;

const initializeFirebase = (): FirebaseApp | null => {
  try {
    // Check if app is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return existingApps[0];
    }

    // Validate configuration
    if (!validateFirebaseConfig(firebaseConfig)) {
      // Silent fail - Firebase features will be disabled
      return null;
    }

    // Initialize Firebase
    firebaseApp = initializeApp(firebaseConfig);
    console.log('[Firebase] Initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('[Firebase] Initialization error:', error);
    return null;
  }
};

// Export initialized app
export const app = initializeFirebase();

// Export configuration
export { firebaseConfig };

export default app;
