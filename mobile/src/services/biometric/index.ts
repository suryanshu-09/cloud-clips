import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { storageHelpers } from '@/services/storage/mmkv';

// Storage keys
const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometricCredentials';

/**
 * Biometric authentication types
 */
export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACIAL_RECOGNITION = 'faceId',
  IRIS = 'iris',
  NONE = 'none',
}

/**
 * Biometric authentication result
 */
export interface IBiometricResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

/**
 * Stored credentials for biometric login
 */
interface IBiometricCredentials {
  userId: string;
  encryptedToken: string;
  createdAt: number;
}

/**
 * Biometric authentication service
 * Uses expo-local-authentication for fingerprint/face recognition
 */
export const biometricService = {
  /**
   * Check if biometric authentication is available on the device
   */
  isAvailable: async (): Promise<boolean> => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return isEnrolled;
    } catch (error) {
      console.error('[Biometric] Error checking availability:', error);
      return false;
    }
  },

  /**
   * Get the type of biometric authentication available
   */
  getBiometricType: async (): Promise<BiometricType> => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return BiometricType.FACIAL_RECOGNITION;
      }

      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return BiometricType.FINGERPRINT;
      }

      if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        return BiometricType.IRIS;
      }

      return BiometricType.NONE;
    } catch (error) {
      console.error('[Biometric] Error getting biometric type:', error);
      return BiometricType.NONE;
    }
  },

  /**
   * Get a user-friendly name for the biometric type
   */
  getBiometricName: async (): Promise<string> => {
    const type = await biometricService.getBiometricType();

    switch (type) {
      case BiometricType.FACIAL_RECOGNITION:
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
      case BiometricType.FINGERPRINT:
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case BiometricType.IRIS:
        return 'Iris Recognition';
      default:
        return 'Biometric';
    }
  },

  /**
   * Authenticate with biometrics
   */
  authenticate: async (promptMessage?: string): Promise<IBiometricResult> => {
    try {
      const isAvailable = await biometricService.isAvailable();
      if (!isAvailable) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device',
          errorCode: 'NOT_AVAILABLE',
        };
      }

      const biometricName = await biometricService.getBiometricName();
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${biometricName}`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      // Handle different error cases
      let errorMessage = 'Authentication failed';
      let errorCode = 'UNKNOWN';

      if (result.error === 'user_cancel') {
        errorMessage = 'Authentication cancelled';
        errorCode = 'USER_CANCEL';
      } else if (result.error === 'system_cancel') {
        errorMessage = 'Authentication was cancelled by the system';
        errorCode = 'SYSTEM_CANCEL';
      } else if (result.error === 'not_enrolled') {
        errorMessage = 'No biometrics enrolled on this device';
        errorCode = 'NOT_ENROLLED';
      } else if (result.error === 'lockout') {
        errorMessage = 'Too many failed attempts. Please try again later.';
        errorCode = 'LOCKOUT';
      } else if (result.error === 'lockout_permanent') {
        errorMessage = 'Biometrics locked. Please unlock your device first.';
        errorCode = 'LOCKOUT_PERMANENT';
      }

      return {
        success: false,
        error: errorMessage,
        errorCode,
      };
    } catch (error: any) {
      console.error('[Biometric] Authentication error:', error);
      return {
        success: false,
        error: error.message || 'Authentication failed',
        errorCode: 'ERROR',
      };
    }
  },

  /**
   * Check if biometric login is enabled for the app
   */
  isEnabled: (): boolean => {
    return storageHelpers.getBoolean(BIOMETRIC_ENABLED_KEY) || false;
  },

  /**
   * Enable biometric login
   * Requires successful biometric authentication first
   */
  enable: async (userId: string, authToken: string): Promise<IBiometricResult> => {
    try {
      // First verify biometric authentication works
      const authResult = await biometricService.authenticate(
        'Authenticate to enable biometric login'
      );

      if (!authResult.success) {
        return authResult;
      }

      // Store encrypted credentials
      // Note: In production, you'd want to use a secure keychain/keystore
      const credentials: IBiometricCredentials = {
        userId,
        encryptedToken: authToken, // In production, encrypt this
        createdAt: Date.now(),
      };

      storageHelpers.setObject(BIOMETRIC_CREDENTIALS_KEY, credentials);
      storageHelpers.setBoolean(BIOMETRIC_ENABLED_KEY, true);

      return { success: true };
    } catch (error: any) {
      console.error('[Biometric] Error enabling:', error);
      return {
        success: false,
        error: error.message || 'Failed to enable biometric login',
        errorCode: 'ERROR',
      };
    }
  },

  /**
   * Disable biometric login
   */
  disable: (): void => {
    storageHelpers.delete(BIOMETRIC_CREDENTIALS_KEY);
    storageHelpers.setBoolean(BIOMETRIC_ENABLED_KEY, false);
  },

  /**
   * Get stored credentials after successful biometric authentication
   */
  getCredentials: async (): Promise<{ userId: string; token: string } | null> => {
    try {
      if (!biometricService.isEnabled()) {
        return null;
      }

      // Authenticate first
      const authResult = await biometricService.authenticate('Authenticate to sign in');

      if (!authResult.success) {
        return null;
      }

      const credentials =
        storageHelpers.getObject<IBiometricCredentials>(BIOMETRIC_CREDENTIALS_KEY);

      if (!credentials) {
        return null;
      }

      // Check if credentials are too old (e.g., 30 days)
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
      if (Date.now() - credentials.createdAt > maxAge) {
        biometricService.disable();
        return null;
      }

      return {
        userId: credentials.userId,
        token: credentials.encryptedToken,
      };
    } catch (error) {
      console.error('[Biometric] Error getting credentials:', error);
      return null;
    }
  },

  /**
   * Check if there are stored credentials for biometric login
   */
  hasStoredCredentials: (): boolean => {
    const credentials = storageHelpers.getObject<IBiometricCredentials>(BIOMETRIC_CREDENTIALS_KEY);
    return !!credentials;
  },

  /**
   * Clear all biometric data
   * Call this on logout
   */
  clear: (): void => {
    storageHelpers.delete(BIOMETRIC_CREDENTIALS_KEY);
    storageHelpers.delete(BIOMETRIC_ENABLED_KEY);
  },

  /**
   * Get security level of the device
   */
  getSecurityLevel: async (): Promise<LocalAuthentication.SecurityLevel> => {
    try {
      return await LocalAuthentication.getEnrolledLevelAsync();
    } catch (error) {
      console.error('[Biometric] Error getting security level:', error);
      return LocalAuthentication.SecurityLevel.NONE;
    }
  },
};

export default biometricService;
