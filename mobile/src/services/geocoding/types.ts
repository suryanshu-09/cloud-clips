/**
 * Nominatim Geocoding Service Types
 *
 * Type definitions for OpenStreetMap Nominatim API
 * @see https://nominatim.org/release-docs/develop/api/Search/
 */

import { ICoordinates } from '@/types';

/**
 * Nominatim address components
 */
export interface INominatimAddress {
  house_number?: string;
  road?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

/**
 * Nominatim search result
 */
export interface INominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: INominatimAddress;
  extratags?: Record<string, string>;
}

/**
 * Nominatim reverse geocoding result
 */
export interface INominatimReverseResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: INominatimAddress;
  boundingbox: [string, string, string, string];
}

/**
 * Geocoding result with parsed coordinates
 */
export interface IGeocodingResult {
  placeId: number;
  coordinates: ICoordinates;
  displayName: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  boundingBox: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
  importance: number;
}

/**
 * Search parameters for geocoding
 */
export interface IGeocodingSearchParams {
  query: string;
  limit?: number;
  countryCodes?: string[];
  viewBox?: {
    minLon: number;
    minLat: number;
    maxLon: number;
    maxLat: number;
  };
}

/**
 * Reverse geocoding parameters
 */
export interface IReverseGeocodingParams {
  latitude: number;
  longitude: number;
}

/**
 * Cached geocoding result with timestamp
 */
export interface ICachedGeocodingResult {
  result: IGeocodingResult | IGeocodingResult[];
  timestamp: number;
}

/**
 * Geocoding service error
 */
export interface IGeocodingError {
  message: string;
  code: 'RATE_LIMIT' | 'NETWORK_ERROR' | 'TIMEOUT' | 'INVALID_RESPONSE' | 'NOT_FOUND';
  statusCode?: number;
}

/**
 * Geocoding service configuration
 */
export interface IGeocodingConfig {
  baseUrl: string;
  userAgent: string;
  rateLimitMs: number;
  timeout: number;
  defaultLimit: number;
  cacheDuration: number;
  debounceMs: number;
}
