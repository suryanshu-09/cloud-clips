import { useState, useCallback, useRef, useEffect } from 'react';
import { nominatimService } from '@/services/geocoding';
import {
  IGeocodingResult,
  IGeocodingError,
  IGeocodingSearchParams,
} from '@/services/geocoding/types';

export interface IUseAddressAutocompleteReturn {
  suggestions: IGeocodingResult[];
  isLoading: boolean;
  error: IGeocodingError | null;
  search: (query: string) => void;
  clear: () => void;
}

export interface IUseAddressAutocompleteOptions {
  limit?: number;
  countryCodes?: string[];
  minQueryLength?: number;
}

/**
 * Hook for address autocomplete with debouncing and caching
 *
 * Features:
 * - 300ms debouncing to prevent excessive API calls
 * - MMKV caching for 24 hours
 * - Automatic rate limiting (1 request/second to Nominatim)
 * - Proper User-Agent header for Nominatim API
 * - Request cancellation on unmount or new search
 *
 * @example
 * ```typescript
 * const { suggestions, isLoading, error, search, clear } = useAddressAutocomplete({
 *   limit: 5,
 *   countryCodes: ['us', 'ca'],
 *   minQueryLength: 3,
 * });
 *
 * // In your input onChange handler:
 * search(query);
 *
 * // Display suggestions:
 * {suggestions.map(suggestion => (
 *   <TouchableOpacity key={suggestion.placeId} onPress={() => selectAddress(suggestion)}>
 *     <Text>{suggestion.displayName}</Text>
 *   </TouchableOpacity>
 * ))}
 * ```
 */
export function useAddressAutocomplete(
  options: IUseAddressAutocompleteOptions = {}
): IUseAddressAutocompleteReturn {
  const { limit = 5, countryCodes, minQueryLength = 3 } = options;

  const [suggestions, setSuggestions] = useState<IGeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<IGeocodingError | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Clear debounce timer and abort controller
   */
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Search for addresses with debouncing
   */
  const search = useCallback(
    (query: string) => {
      cleanup();

      // Clear suggestions if query is empty or too short
      if (!query.trim() || query.trim().length < minQueryLength) {
        setSuggestions([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Debounce the search
      debounceTimerRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        abortControllerRef.current = new AbortController();

        try {
          const params: IGeocodingSearchParams = {
            query: query.trim(),
            limit,
            ...(countryCodes && { countryCodes }),
          };

          const results = await nominatimService.search(params);

          // Only update state if component is still mounted and request wasn't aborted
          if (isMountedRef.current && !abortControllerRef.current.signal.aborted) {
            setSuggestions(results);
            setError(null);
          }
        } catch (err) {
          // Only update error state if component is still mounted and request wasn't aborted
          if (
            isMountedRef.current &&
            abortControllerRef.current &&
            !abortControllerRef.current.signal.aborted
          ) {
            if (err && typeof err === 'object' && 'code' in err) {
              const geocodingError = err as IGeocodingError;
              setError(geocodingError);
            } else {
              setError({
                message: err instanceof Error ? err.message : 'Unknown error occurred',
                code: 'NETWORK_ERROR',
              });
            }
            setSuggestions([]);
          }
        } finally {
          if (
            isMountedRef.current &&
            abortControllerRef.current &&
            !abortControllerRef.current.signal.aborted
          ) {
            setIsLoading(false);
          }
        }
      }, 300); // 300ms debounce
    },
    [cleanup, limit, countryCodes, minQueryLength]
  );

  /**
   * Clear suggestions and reset state
   */
  const clear = useCallback(() => {
    cleanup();
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clear,
  };
}

export default useAddressAutocomplete;
