import { useState, useEffect, useCallback } from 'react';
import { locationService } from '../services/locationService';
import type { ILocation, ILocationPermissionStatus } from '../types';

interface IUseLocationReturn {
  location: ILocation | null;
  isLoading: boolean;
  error: Error | null;
  permission: ILocationPermissionStatus | null;
  requestPermission: () => Promise<void>;
  getCurrentLocation: () => Promise<void>;
  refreshLocation: () => Promise<void>;
}

export function useLocation(): IUseLocationReturn {
  const [location, setLocation] = useState<ILocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permission, setPermission] = useState<ILocationPermissionStatus | null>(null);

  // Check permissions on mount
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const status = await locationService.checkPermissions();
        setPermission(status);

        // Auto-fetch location if permission is already granted
        if (status.granted) {
          await fetchLocation();
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to check permissions'));
      }
    };

    checkPermission();
  }, []);

  const fetchLocation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();

      // Try to get address via reverse geocoding
      try {
        const geocoded = await locationService.reverseGeocode(currentLocation);
        if (geocoded) {
          setLocation({
            ...currentLocation,
            address: geocoded.address,
            city: geocoded.city,
            country: geocoded.country,
            postalCode: geocoded.postalCode,
          });
        } else {
          setLocation(currentLocation);
        }
      } catch (geocodeError) {
        // If reverse geocoding fails, just use the coordinates
        console.warn('Reverse geocoding failed:', geocodeError);
        setLocation(currentLocation);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to get location'));
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermission = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const status = await locationService.requestPermissions();
      setPermission(status);

      if (status.granted) {
        await fetchLocation();
      } else {
        setError(new Error('Location permission denied'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to request permission'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentLocation = useCallback(async () => {
    await fetchLocation();
  }, []);

  const refreshLocation = useCallback(async () => {
    await fetchLocation();
  }, []);

  return {
    location,
    isLoading,
    error,
    permission,
    requestPermission,
    getCurrentLocation,
    refreshLocation,
  };
}
