import { useState, useCallback } from 'react';
import { locationService } from '../services/locationService';
import type { ICoordinates, IReverseGeocodeResult } from '../types';

interface IUseGeocodeReturn {
  geocode: (address: string) => Promise<ICoordinates[]>;
  reverseGeocode: (coordinates: ICoordinates) => Promise<IReverseGeocodeResult | null>;
  isLoading: boolean;
  error: Error | null;
}

export function useGeocode(): IUseGeocodeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const geocode = useCallback(async (address: string): Promise<ICoordinates[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const results = await locationService.geocodeAddress(address);
      return results.map(({ latitude, longitude }) => ({ latitude, longitude }));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to geocode address');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(
    async (coordinates: ICoordinates): Promise<IReverseGeocodeResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await locationService.reverseGeocode(coordinates);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to reverse geocode');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    geocode,
    reverseGeocode,
    isLoading,
    error,
  };
}
