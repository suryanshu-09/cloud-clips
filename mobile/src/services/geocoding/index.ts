import { nominatimService } from './nominatim';
import { IReverseGeocodingParams, IGeocodingResult } from './types';

export { nominatimService } from './nominatim';
export type {
  IGeocodingConfig,
  IGeocodingError,
  IGeocodingResult,
  IGeocodingSearchParams,
  IReverseGeocodingParams,
  INominatimResult,
  INominatimAddress,
  ICachedGeocodingResult,
} from './types';

/**
 * Reverse geocode coordinates to address
 * Converts latitude/longitude to a human-readable address
 *
 * @param params - Object containing latitude and longitude
 * @returns Promise resolving to geocoding result
 *
 * @example
 * ```typescript
 * const address = await reverseGeocode({
 *   latitude: 37.7749,
 *   longitude: -122.4194
 * });
 * console.log(address.displayName); // "San Francisco, California, USA"
 * ```
 */
export async function reverseGeocode(params: IReverseGeocodingParams): Promise<IGeocodingResult> {
  return nominatimService.reverse(params);
}

/**
 * Reverse geocode coordinates with error handling wrapper
 * Returns null instead of throwing on error
 *
 * @param params - Object containing latitude and longitude
 * @returns Promise resolving to geocoding result or null on error
 *
 * @example
 * ```typescript
 * const address = await reverseGeocodeSafe({
 *   latitude: 37.7749,
 *   longitude: -122.4194
 * });
 * if (address) {
 *   console.log(address.displayName);
 * }
 * ```
 */
export async function reverseGeocodeSafe(
  params: IReverseGeocodingParams
): Promise<IGeocodingResult | null> {
  try {
    return await nominatimService.reverse(params);
  } catch (error) {
    console.error('[ReverseGeocoding] Error:', error);
    return null;
  }
}
