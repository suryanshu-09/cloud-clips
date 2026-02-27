/**
 * Configuration exports for Cloud Clips mobile app
 */

export {
  MAP_STYLES,
  AVAILABLE_MAP_STYLES,
  DEFAULT_MAP_CONFIG,
  MAP_UI_OPTIONS,
  MAP_ANIMATION_DURATION,
} from './mapStyles';
export type { MapStyle, IMapStyleConfig } from './mapStyles';

// OpenStreetMap configuration
export {
  OSM_STANDARD_TILES,
  OSM_HUMANITARIAN_TILES,
  OSM_TOPOGRAPHIC_TILES,
  OSM_CYCLE_TILES,
  NOMINATIM_CONFIG,
  OSM_USAGE_POLICY,
  DEFAULT_OSM_CONFIG,
  AVAILABLE_OSM_TILE_PROVIDERS,
  getTileProvider,
  buildNominatimUrl,
  getAttributionText,
} from './openstreetmap';
export type { IOpenStreetMapTileConfig } from './openstreetmap';
