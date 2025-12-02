import * as Location from 'expo-location';
import type {
  ILocation,
  ILocationPermissionStatus,
  ICoordinates,
  IGeocodeResult,
  IReverseGeocodeResult,
} from '../types';

class LocationService {
  /**
   * Request location permissions from the user
   */
  async requestPermissions(): Promise<ILocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      throw new Error('Failed to request location permissions');
    }
  }

  /**
   * Check current location permission status
   */
  async checkPermissions(): Promise<ILocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error checking location permissions:', error);
      throw new Error('Failed to check location permissions');
    }
  }

  /**
   * Get the current location of the user
   */
  async getCurrentLocation(): Promise<ILocation> {
    try {
      const permission = await this.checkPermissions();

      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error('Failed to get current location');
    }
  }

  /**
   * Get high accuracy current location (useful for precise location needs)
   */
  async getHighAccuracyLocation(): Promise<ILocation> {
    try {
      const permission = await this.checkPermissions();

      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      };
    } catch (error) {
      console.error('Error getting high accuracy location:', error);
      throw new Error('Failed to get high accuracy location');
    }
  }

  /**
   * Watch for location changes
   */
  async watchLocation(
    callback: (location: ILocation) => void,
    options?: {
      accuracy?: Location.Accuracy;
      distanceInterval?: number;
      timeInterval?: number;
    }
  ): Promise<Location.LocationSubscription> {
    try {
      const permission = await this.checkPermissions();

      if (!permission.granted) {
        throw new Error('Location permission not granted');
      }

      return await Location.watchPositionAsync(
        {
          accuracy: options?.accuracy || Location.Accuracy.Balanced,
          distanceInterval: options?.distanceInterval || 10, // meters
          timeInterval: options?.timeInterval || 10000, // milliseconds
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
          });
        }
      );
    } catch (error) {
      console.error('Error watching location:', error);
      throw new Error('Failed to watch location');
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<IGeocodeResult[]> {
    try {
      const results = await Location.geocodeAsync(address);

      return results.map((result) => ({
        latitude: result.latitude,
        longitude: result.longitude,
        address,
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Reverse geocode coordinates to an address
   */
  async reverseGeocode(coordinates: ICoordinates): Promise<IReverseGeocodeResult | null> {
    try {
      const results = await Location.reverseGeocodeAsync(coordinates);

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      const addressParts = [
        result.streetNumber,
        result.street,
        result.city,
        result.region,
        result.postalCode,
        result.country,
      ].filter(Boolean);

      return {
        address: addressParts.join(', '),
        city: result.city || undefined,
        country: result.country || undefined,
        postalCode: result.postalCode || undefined,
        street: result.street || undefined,
        streetNumber: result.streetNumber || undefined,
        region: result.region || undefined,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw new Error('Failed to reverse geocode');
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(from: ICoordinates, to: ICoordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(from.latitude)) *
        Math.cos(this.toRadians(to.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Format distance for display
   */
  formatDistance(distanceInKm: number): string {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)} m`;
    }
    return `${distanceInKm.toFixed(1)} km`;
  }
}

export const locationService = new LocationService();
