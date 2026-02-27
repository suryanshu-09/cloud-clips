import { useState, useEffect, useCallback } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  setCurrentLocationAtom,
  setLocationLoadingAtom,
  setLocationErrorAtom,
  currentLocationAtom,
  ILocation,
} from '@/store/atoms/locationAtom';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied' | 'blocked';

export interface ILocationPermissionState {
  status: LocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
}

export interface IUseLocationReturn {
  // State
  permissionStatus: LocationPermissionStatus;
  isLoading: boolean;
  error: string | null;
  currentLocation: ILocation | null;

  // Actions
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<LocationPermissionStatus>;
  openSettings: () => Promise<void>;
  getCurrentLocation: () => Promise<ILocation | null>;
  resetError: () => void;
}

/**
 * Hook for managing location permissions and location services
 * Handles iOS/Android differences and provides a unified API
 */
export function useLocation(): IUseLocationReturn {
  const [permissionState, setPermissionState] = useState<ILocationPermissionState>({
    status: 'undetermined',
    isLoading: false,
    error: null,
  });

  const currentLocation = useAtomValue(currentLocationAtom);
  const setCurrentLocation = useSetAtom(setCurrentLocationAtom);
  const setLocationLoading = useSetAtom(setLocationLoadingAtom);
  const setLocationError = useSetAtom(setLocationErrorAtom);

  /**
   * Check current location permission status
   */
  const checkPermission = useCallback(async (): Promise<LocationPermissionStatus> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      let permissionStatus: LocationPermissionStatus;

      switch (status) {
        case 'granted':
          permissionStatus = 'granted';
          break;
        case 'denied':
          // On iOS, denied means user said no (need to check if can ask again)
          // On Android, denied means user said no but can be asked again
          if (Platform.OS === 'ios') {
            const canAsk = await Location.getForegroundPermissionsAsync();
            // If we can't ask again, treat as blocked
            permissionStatus = canAsk.status === 'denied' ? 'blocked' : 'denied';
          } else {
            permissionStatus = 'denied';
          }
          break;
        default:
          permissionStatus = 'undetermined';
      }

      setPermissionState((prev) => ({ ...prev, status: permissionStatus }));
      return permissionStatus;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check permission';
      setPermissionState((prev) => ({ ...prev, error: errorMessage }));
      return 'undetermined';
    }
  }, []);

  /**
   * Request location permission
   * Returns true if granted, false otherwise
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setPermissionState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // First check if location services are enabled
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();

      if (!locationServicesEnabled) {
        const errorMessage =
          Platform.OS === 'ios'
            ? 'Please enable Location Services in Settings > Privacy & Security > Location Services'
            : 'Please enable Location Services in Settings > Location';

        setPermissionState((prev) => ({
          ...prev,
          isLoading: false,
          status: 'blocked',
          error: errorMessage,
        }));

        // Show alert to guide user to settings
        Alert.alert('Location Services Disabled', errorMessage, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: openSettings },
        ]);

        return false;
      }

      // Request foreground location permission
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      let permissionStatus: LocationPermissionStatus;

      if (status === 'granted') {
        permissionStatus = 'granted';
      } else if (status === 'denied') {
        // If we can't ask again, it's blocked
        permissionStatus = canAskAgain ? 'denied' : 'blocked';
      } else {
        permissionStatus = 'undetermined';
      }

      setPermissionState((prev) => ({
        ...prev,
        status: permissionStatus,
        isLoading: false,
      }));

      // If denied, show helpful alert
      if (permissionStatus === 'denied' || permissionStatus === 'blocked') {
        const settingsMessage =
          Platform.OS === 'ios'
            ? 'You can enable it in Settings > Privacy & Security > Location Services > Cloud Clips'
            : 'You can enable it in Settings > Apps > Cloud Clips > Permissions > Location';

        Alert.alert(
          'Location Permission Required',
          `Location access is needed to find nearby barbers. ${settingsMessage}`,
          [
            { text: 'Not Now', style: 'cancel' },
            ...(permissionStatus === 'blocked'
              ? [{ text: 'Open Settings', onPress: openSettings }]
              : []),
          ]
        );
      }

      return status === 'granted';
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setPermissionState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return false;
    }
  }, []);

  /**
   * Open app settings to allow user to manually enable permissions
   */
  const openSettings = useCallback(async (): Promise<void> => {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Failed to open settings:', error);
      Alert.alert(
        'Settings Unavailable',
        'Unable to open settings. Please open Settings manually to enable location permissions.'
      );
    }
  }, []);

  /**
   * Get current device location
   * Will request permission if not already granted
   */
  const getCurrentLocation = useCallback(async (): Promise<ILocation | null> => {
    setLocationLoading(true);
    setPermissionState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check permission first
      const currentStatus = await checkPermission();

      // Request permission if not granted
      if (currentStatus !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          setLocationLoading(false);
          setPermissionState((prev) => ({ ...prev, isLoading: false }));
          return null;
        }
      }

      // Get current position with high accuracy
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData: ILocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Update atoms
      setCurrentLocation(locationData);
      setPermissionState((prev) => ({ ...prev, isLoading: false }));
      setLocationLoading(false);

      return locationData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';

      setPermissionState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      setLocationError(errorMessage);
      setLocationLoading(false);

      // Handle specific location errors
      if (errorMessage.includes('timeout')) {
        Alert.alert(
          'Location Timeout',
          'Unable to get your location. Please check your GPS signal and try again.'
        );
      }

      return null;
    }
  }, [
    checkPermission,
    requestPermission,
    setCurrentLocation,
    setLocationError,
    setLocationLoading,
  ]);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setPermissionState((prev) => ({ ...prev, error: null }));
  }, []);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    // State
    permissionStatus: permissionState.status,
    isLoading: permissionState.isLoading,
    error: permissionState.error,
    currentLocation,

    // Actions
    requestPermission,
    checkPermission,
    openSettings,
    getCurrentLocation,
    resetError,
  };
}

export default useLocation;
