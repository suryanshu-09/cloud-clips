import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { useAtomValue, useSetAtom } from 'jotai';
import {
  setCurrentLocationAtom,
  setLocationLoadingAtom,
  setLocationErrorAtom,
  currentLocationAtom,
  ILocation,
} from '@/store/atoms/locationAtom';

export interface IUseCurrentLocationReturn {
  // State
  location: ILocation | null;
  isLoading: boolean;
  isTracking: boolean;
  error: string | null;

  // Actions
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  refreshLocation: () => Promise<ILocation | null>;
  clearError: () => void;
}

export interface ICurrentLocationOptions {
  /** Enable background location tracking (requires background permission) */
  enableBackground?: boolean;
  /** Minimum distance (in meters) to trigger location update */
  distanceInterval?: number;
  /** Minimum time (in milliseconds) between location updates */
  timeInterval?: number;
  /** Request location accuracy level */
  accuracy?: Location.Accuracy;
  /** Auto-start tracking on mount if permission granted */
  autoStart?: boolean;
}

/**
 * Hook to get and track user location in real-time
 * Uses watchPositionAsync for continuous tracking with configurable intervals
 *
 * @example
 * // Basic usage
 * const { location, isLoading, startTracking } = useCurrentLocation();
 *
 * // With options
 * const { location, isTracking } = useCurrentLocation({
 *   autoStart: true,
 *   distanceInterval: 100, // Update every 100 meters
 *   timeInterval: 5000,    // Or every 5 seconds
 * });
 */
export function useCurrentLocation(
  options: ICurrentLocationOptions = {}
): IUseCurrentLocationReturn {
  const {
    distanceInterval = 10,
    timeInterval = 5000,
    accuracy = Location.Accuracy.Balanced,
    autoStart = false,
  } = options;

  const [isTracking, setIsTracking] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const appState = useRef(AppState.currentState);

  const location = useAtomValue(currentLocationAtom);
  const setLocation = useSetAtom(setCurrentLocationAtom);
  const setLoading = useSetAtom(setLocationLoadingAtom);
  const setError = useSetAtom(setLocationErrorAtom);

  /**
   * Get current location one-time
   */
  const getCurrentLocation = useCallback(async (): Promise<ILocation | null> => {
    setLoading(true);
    setLocalError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const errorMessage = 'Location permission not granted';
        setLocalError(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return null;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy,
      });

      const newLocation: ILocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setLocation(newLocation);
      setLoading(false);

      return newLocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setLocalError(errorMessage);
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [accuracy, setLocation, setLoading, setError]);

  /**
   * Start watching location updates
   */
  const startTracking = useCallback(async () => {
    if (locationSubscription.current) {
      return;
    }

    setLoading(true);
    setLocalError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        const errorMessage = 'Location permission required for tracking';
        setLocalError(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        const errorMessage = 'Location services are disabled';
        setLocalError(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Get initial location before starting watch
      const initialPosition = await Location.getCurrentPositionAsync({
        accuracy,
      });

      setLocation({
        latitude: initialPosition.coords.latitude,
        longitude: initialPosition.coords.longitude,
      });

      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy,
          distanceInterval,
          timeInterval,
        },
        (newPosition) => {
          setLocation({
            latitude: newPosition.coords.latitude,
            longitude: newPosition.coords.longitude,
          });
        }
      );

      locationSubscription.current = subscription;
      setIsTracking(true);
      setLoading(false);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start location tracking';
      setLocalError(errorMessage);
      setError(errorMessage);
      setIsTracking(false);
      setLoading(false);
    }
  }, [accuracy, distanceInterval, timeInterval, setLocation, setLoading, setError]);

  /**
   * Stop watching location updates
   */
  const stopTracking = useCallback(() => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    setIsTracking(false);
  }, []);

  /**
   * Refresh location manually
   */
  const refreshLocation = useCallback(async (): Promise<ILocation | null> => {
    if (isTracking) {
      // If already tracking, just return current location
      return location;
    }
    return getCurrentLocation();
  }, [isTracking, location, getCurrentLocation]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  /**
   * Handle app state changes
   * Pause tracking when app is in background (unless background mode enabled)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground
        if (isTracking && !locationSubscription.current) {
          startTracking();
        }
      } else if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App has gone to background
        if (isTracking && !options.enableBackground) {
          stopTracking();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isTracking, options.enableBackground, startTracking, stopTracking]);

  /**
   * Auto-start tracking if enabled and permission already granted
   */
  useEffect(() => {
    if (autoStart) {
      Location.getForegroundPermissionsAsync().then(({ status }) => {
        if (status === 'granted') {
          startTracking();
        }
      });
    }

    return () => {
      stopTracking();
    };
  }, [autoStart, startTracking, stopTracking]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    location,
    isLoading: !location && !localError,
    isTracking,
    error: localError,
    startTracking,
    stopTracking,
    refreshLocation,
    clearError,
  };
}

export default useCurrentLocation;
