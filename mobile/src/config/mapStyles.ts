/**
 * Map configuration constants and tile URL templates
 * Supports multiple map styles for OpenStreetMap tiles
 */

export type MapStyle = 'standard' | 'dark' | 'satellite' | 'terrain';

export interface IMapStyleConfig {
  id: MapStyle;
  name: string;
  description: string;
  urlTemplate: string;
  attribution: string;
  maxZoom: number;
  flipY: boolean;
}

// OpenStreetMap tile providers and styles
export const MAP_STYLES: Record<MapStyle, IMapStyleConfig> = {
  standard: {
    id: 'standard',
    name: 'Standard',
    description: 'Classic OpenStreetMap style',
    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    flipY: false,
  },
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode for low-light environments',
    urlTemplate: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png',
    attribution: '© Stadia Maps © OpenStreetMap contributors',
    maxZoom: 20,
    flipY: false,
  },
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    description: 'Satellite imagery view',
    urlTemplate:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '© Esri © OpenStreetMap contributors',
    maxZoom: 18,
    flipY: false,
  },
  terrain: {
    id: 'terrain',
    name: 'Terrain',
    description: 'Topographic terrain view',
    urlTemplate: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap © OpenStreetMap contributors',
    maxZoom: 17,
    flipY: false,
  },
};

// Available map styles for user selection
export const AVAILABLE_MAP_STYLES: IMapStyleConfig[] = Object.values(MAP_STYLES);

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
  style: 'standard' as MapStyle,
  showsUserLocation: true,
  showsMyLocationButton: true,
  showsCompass: true,
  showsBuildings: false,
  showsTraffic: false,
  showsIndoors: false,
  zoomEnabled: true,
  rotateEnabled: true,
  scrollEnabled: true,
  pitchEnabled: true,
  toolbarEnabled: true,
  cacheEnabled: true,
  loadingEnabled: true,
  loadingIndicatorColor: '#3B82F6',
  loadingBackgroundColor: '#FFFFFF',
};

// Map UI customization options
export const MAP_UI_OPTIONS = {
  markerSize: 40,
  markerAnchor: { x: 0.5, y: 1.0 },
  calloutAnchor: { x: 0.5, y: 0 },
  clusterRadius: 50,
  edgePadding: {
    top: 50,
    right: 50,
    bottom: 50,
    left: 50,
  },
};

// Map animation durations
export const MAP_ANIMATION_DURATION = {
  regionChange: 1000,
  markerSelection: 300,
  userLocation: 500,
};
