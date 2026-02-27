/**
 * Global hooks exports for Cloud Clips mobile app
 *
 * These are shared hooks that don't belong to a specific feature.
 * Feature-specific hooks should be imported from their feature directories.
 *
 * @example
 * import { useNetworkStatus } from '@/hooks';
 */

export { useNetworkStatus } from './useNetworkStatus';
export { useMapConfig } from './useMapConfig';
export { useLocation } from './useLocation';
export { useCurrentLocation } from './useCurrentLocation';
export { useReverseGeocoding } from './useReverseGeocoding';
export { useAddressAutocomplete } from './useAddressAutocomplete';
export { useReducedMotion } from './useReducedMotion';
export { useFontScale, useFontScaleSync } from './useFontScale';
