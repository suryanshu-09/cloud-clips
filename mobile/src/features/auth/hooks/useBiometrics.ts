import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAtomValue } from 'jotai';
import { biometricService, BiometricType, IBiometricResult } from '@/services/biometric';
import { isAuthenticatedAtom, currentUserAtom } from '@/store/atoms/authAtom';
import { storageHelpers } from '@/services/storage/mmkv';

const AUTH_STORAGE_KEY = 'auth';

interface IUseBiometricsReturn {
  // State
  isAvailable: boolean;
  isEnabled: boolean;
  biometricType: BiometricType;
  biometricName: string;
  isLoading: boolean;

  // Methods
  authenticate: (promptMessage?: string) => Promise<IBiometricResult>;
  enable: () => Promise<IBiometricResult>;
  disable: () => void;
  loginWithBiometrics: () => Promise<{ userId: string; token: string } | null>;
}

/**
 * Hook for biometric authentication
 * Provides biometric availability, type, and authentication methods
 */
export function useBiometrics(): IUseBiometricsReturn {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const currentUser = useAtomValue(currentUserAtom);

  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<BiometricType>(BiometricType.NONE);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize biometric state
  useEffect(() => {
    const initBiometrics = async () => {
      try {
        setIsLoading(true);

        // Check availability
        const available = await biometricService.isAvailable();
        setIsAvailable(available);

        if (available) {
          // Get biometric type and name
          const type = await biometricService.getBiometricType();
          const name = await biometricService.getBiometricName();
          setBiometricType(type);
          setBiometricName(name);
        }

        // Check if enabled
        setIsEnabled(biometricService.isEnabled());
      } catch (error) {
        console.error('[useBiometrics] Initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initBiometrics();
  }, []);

  /**
   * Authenticate with biometrics
   */
  const authenticate = useCallback(async (promptMessage?: string): Promise<IBiometricResult> => {
    return biometricService.authenticate(promptMessage);
  }, []);

  /**
   * Enable biometric login for the current user
   */
  const enable = useCallback(async (): Promise<IBiometricResult> => {
    if (!isAuthenticated || !currentUser) {
      return {
        success: false,
        error: 'You must be logged in to enable biometric login',
        errorCode: 'NOT_AUTHENTICATED',
      };
    }

    // Get the current auth token
    const authData = storageHelpers.getObject<{ token: string }>(AUTH_STORAGE_KEY);
    if (!authData?.token) {
      return {
        success: false,
        error: 'No authentication token found',
        errorCode: 'NO_TOKEN',
      };
    }

    const result = await biometricService.enable(currentUser.id, authData.token);

    if (result.success) {
      setIsEnabled(true);
      Alert.alert(
        'Biometric Login Enabled',
        `You can now use ${biometricName} to sign in quickly.`
      );
    }

    return result;
  }, [isAuthenticated, currentUser, biometricName]);

  /**
   * Disable biometric login
   */
  const disable = useCallback(() => {
    biometricService.disable();
    setIsEnabled(false);
    Alert.alert('Biometric Login Disabled', 'Biometric login has been turned off.');
  }, []);

  /**
   * Attempt to login using stored biometric credentials
   */
  const loginWithBiometrics = useCallback(async (): Promise<{
    userId: string;
    token: string;
  } | null> => {
    if (!isAvailable || !isEnabled) {
      return null;
    }

    // Check if we have stored credentials
    if (!biometricService.hasStoredCredentials()) {
      setIsEnabled(false);
      return null;
    }

    return biometricService.getCredentials();
  }, [isAvailable, isEnabled]);

  return {
    // State
    isAvailable,
    isEnabled,
    biometricType,
    biometricName,
    isLoading,

    // Methods
    authenticate,
    enable,
    disable,
    loginWithBiometrics,
  };
}

export default useBiometrics;
