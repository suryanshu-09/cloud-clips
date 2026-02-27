import { useState, useCallback, useRef } from 'react';
import { nominatimService } from '@/services/geocoding';
import {
  IGeocodingResult,
  IGeocodingError,
  IReverseGeocodingParams,
} from '@/services/geocoding/types';

export interface IUseReverseGeocodingReturn {
  address: IGeocodingResult | null;
  isLoading: boolean;
  error: IGeocodingError | null;
  reverseGeocode: (params: IReverseGeocodingParams) => Promise<IGeocodingResult | null>;
  reset: () => void;
}

/**
 * Hook for reverse geocoding - converting coordinates to address
 *
 * Uses Nominatim API with:
 * - Automatic rate limiting (1 request/second)
 * - MMKV caching for 24 hours
 * - Proper User-Agent header
 * - Error handling with typed errors
 *
 * @example
 * ```typescript
 * const { address, isLoading, error, reverseGeocode } = useReverseGeocoding();
 *
 * useEffect(() => {
 *   if (location) {
 *     reverseGeocode({ latitude: location.lat, longitude: location.lng });
 *   }
 * }, [location]);
 * ```
 */
export function useReverseGeocoding(): IUseReverseGeocodingReturn {
  const [address, setAddress] = useState<IGeocodingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<IGeocodingError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Convert coordinates to address
   */
  const reverseGeocode = useCallback(
    async (params: IReverseGeocodingParams): Promise<IGeocodingResult | null> => {
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await nominatimService.reverse(params);

        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) {
          return null;
        }

        setAddress(result);
        return result;
      } catch (err) {
        // Check if request was aborted
        if (abortControllerRef.current.signal.aborted) {
          return null;
        }

        if (err && typeof err === 'object' && 'code' in err) {
          const geocodingError = err as IGeocodingError;
          setError(geocodingError);
        } else {
          setError({
            message: err instanceof Error ? err.message : 'Unknown error occurred',
            code: 'NETWORK_ERROR',
          });
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setAddress(null);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    address,
    isLoading,
    error,
    reverseGeocode,
    reset,
  };
}

export default useReverseGeocoding;
