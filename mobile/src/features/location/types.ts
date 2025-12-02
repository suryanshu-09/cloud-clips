export interface ICoordinates {
  latitude: number;
  longitude: number;
}

export interface ILocation extends ICoordinates {
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  timestamp?: number;
}

export interface ILocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

export interface IDistanceResult {
  distance: number; // in kilometers
  duration?: number; // in minutes (if available from routing API)
}

export interface IGeocodeResult {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
}

export interface IReverseGeocodeResult {
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
  street?: string;
  streetNumber?: string;
  region?: string;
}
