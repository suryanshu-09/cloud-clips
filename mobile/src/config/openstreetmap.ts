/**
 * OpenStreetMap Tile Provider Configuration
 *
 * Configuration for OpenStreetMap tile layers with proper attribution
 * as required by OpenStreetMap's Tile Usage Policy.
 *
 * @see https://operations.osmfoundation.org/policies/tiles/
 */

export interface IOpenStreetMapTileConfig {
  /** Tile server URL template with {z}, {x}, {y} placeholders */
  urlTemplate: string;
  /** Required attribution text (must be displayed on map) */
  attribution: string;
  /** Maximum zoom level supported */
  maxZoom: number;
  /** Subdomains for load balancing (if applicable) */
  subdomains?: string[];
  /** Whether to flip Y coordinates */
  flipY: boolean;
  /** Cache duration in milliseconds */
  tileCacheDuration: number;
}

/**
 * Standard OpenStreetMap tile configuration
 * This is the default OSM tile layer (openstreetmap.org)
 */
export const OSM_STANDARD_TILES: IOpenStreetMapTileConfig = {
  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19,
  flipY: false,
  tileCacheDuration: 86400000, // 24 hours
};

/**
 * OpenStreetMap Humanitarian tile layer (HOT)
 * Focused on humanitarian mapping initiatives
 */
export const OSM_HUMANITARIAN_TILES: IOpenStreetMapTileConfig = {
  urlTemplate: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png',
  attribution: '© OpenStreetMap contributors, Tiles style by Humanitarian OpenStreetMap Team',
  maxZoom: 19,
  subdomains: ['a', 'b', 'c'],
  flipY: false,
  tileCacheDuration: 86400000,
};

/**
 * OpenStreetMap Topographic tile layer (OpenTopoMap)
 * Shows elevation contours and topographic details
 */
export const OSM_TOPOGRAPHIC_TILES: IOpenStreetMapTileConfig = {
  urlTemplate: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  attribution: '© OpenTopoMap (CC-BY-SA) © OpenStreetMap contributors',
  maxZoom: 17,
  subdomains: ['a', 'b', 'c'],
  flipY: false,
  tileCacheDuration: 86400000,
};

/**
 * OpenStreetMap Cycle Map tile layer
 * Optimized for cycling routes and bike paths
 */
export const OSM_CYCLE_TILES: IOpenStreetMapTileConfig = {
  urlTemplate: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
  attribution: '© CyclOSM contributors © OpenStreetMap contributors',
  maxZoom: 20,
  subdomains: ['a', 'b', 'c'],
  flipY: false,
  tileCacheDuration: 86400000,
};

/**
 * Nominatim geocoding service configuration
 * Required for address search and geocoding
 *
 * @see https://operations.osmfoundation.org/policies/nominatim/
 */
export const NOMINATIM_CONFIG = {
  /** Base URL for Nominatim API */
  baseUrl: 'https://nominatim.openstreetmap.org',
  /** Required User-Agent header (per Nominatim Usage Policy) */
  userAgent: 'CloudClips/1.0 (cloudclips@example.com)',
  /** Rate limit: 1 request per second */
  rateLimitMs: 1000,
  /** Request timeout in milliseconds */
  timeout: 10000,
  /** Default search result limit */
  defaultLimit: 10,
  /** Response format */
  format: 'json',
  /** Include address details in response */
  addressdetails: 1,
} as const;

/**
 * OpenStreetMap Tile Usage Policy compliance settings
 * @see https://operations.osmfoundation.org/policies/tiles/
 */
export const OSM_USAGE_POLICY = {
  /** Bulk downloading is prohibited without permission */
  bulkDownloadProhibited: true,
  /** Heavy use requires alternative tile provider */
  heavyUseThreshold: 10000,
  /** Required attribution must be visible */
  attributionRequired: true,
  /** Copyright notice requirements */
  copyrightNotice: '© OpenStreetMap contributors',
  /** URL to OpenStreetMap copyright page */
  copyrightUrl: 'https://www.openstreetmap.org/copyright',
  /** License information */
  license: 'Open Database License (ODbL)',
} as const;

/**
 * Default OpenStreetMap configuration
 * Use this as the primary configuration for the app
 */
export const DEFAULT_OSM_CONFIG = {
  /** Default tile provider */
  tiles: OSM_STANDARD_TILES,
  /** Nominatim geocoding settings */
  nominatim: NOMINATIM_CONFIG,
  /** Usage policy compliance */
  policy: OSM_USAGE_POLICY,
  /** Initial map view */
  initialRegion: {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  },
  /** Default zoom level */
  defaultZoom: 12,
  /** Cache geocoding results in MMKV */
  cacheGeocodingResults: true,
} as const;

/**
 * Available OpenStreetMap tile providers
 */
export const AVAILABLE_OSM_TILE_PROVIDERS: Record<string, IOpenStreetMapTileConfig> = {
  standard: OSM_STANDARD_TILES,
  humanitarian: OSM_HUMANITARIAN_TILES,
  topographic: OSM_TOPOGRAPHIC_TILES,
  cycle: OSM_CYCLE_TILES,
};

/**
 * Get tile configuration by provider name
 */
export function getTileProvider(
  providerName: keyof typeof AVAILABLE_OSM_TILE_PROVIDERS
): IOpenStreetMapTileConfig {
  return AVAILABLE_OSM_TILE_PROVIDERS[providerName] || OSM_STANDARD_TILES;
}

/**
 * Build Nominatim API URL with proper encoding
 */
export function buildNominatimUrl(
  endpoint: 'search' | 'reverse' | 'lookup',
  params: Record<string, string | number>
): string {
  const queryString = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');

  return `${NOMINATIM_CONFIG.baseUrl}/${endpoint}?${queryString}`;
}

/**
 * Get complete attribution text for display
 */
export function getAttributionText(
  provider: IOpenStreetMapTileConfig = OSM_STANDARD_TILES
): string {
  return `${provider.attribution} | ${OSM_USAGE_POLICY.copyrightUrl}`;
}
