import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import RNMapView, { Marker, Region } from 'react-native-maps';
import { MapView } from './MapView';
import { Button } from '@/components/ui/Button';

interface ILocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface ILocationPickerProps {
  initialLocation?: ILocation;
  onLocationSelect: (location: ILocation) => void;
  onCancel?: () => void;
  title?: string;
}

export function LocationPicker({
  initialLocation,
  onLocationSelect,
  onCancel,
  title = 'Select Location',
}: ILocationPickerProps) {
  const mapRef = useRef<RNMapView>(null);
  const [selectedLocation, setSelectedLocation] = useState<ILocation | null>(
    initialLocation || null
  );
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 37.78825,
    longitude: initialLocation?.longitude || -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleMapPress = useCallback(async (event: any) => {
    const coordinate = event.nativeEvent.coordinate;
    setIsLoading(true);

    try {
      // In a real app, you would reverse geocode here to get the address
      // For now, we'll just use coordinates
      const location: ILocation = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        address: `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`,
      };

      setSelectedLocation(location);
    } catch (error) {
      console.error('Error selecting location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
    }
  }, [selectedLocation, onLocationSelect]);

  const handleCurrentLocation = useCallback(async () => {
    setIsLoading(true);
    try {
      // In a real app, you would get the current location here
      // For now, we'll just center the map
      console.log('Getting current location...');
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {onCancel && (
          <Pressable onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={false}
        >
          {selectedLocation && (
            <Marker
              coordinate={{
                latitude: selectedLocation.latitude,
                longitude: selectedLocation.longitude,
              }}
              pinColor="#8B5CF6"
            />
          )}
        </MapView>

        <Pressable
          style={styles.currentLocationButton}
          onPress={handleCurrentLocation}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#8B5CF6" />
          ) : (
            <Text style={styles.currentLocationIcon}>📍</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.footer}>
        {selectedLocation ? (
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedLabel}>Selected Location:</Text>
            <Text style={styles.selectedAddress} numberOfLines={2}>
              {selectedLocation.address || 'Unknown address'}
            </Text>
          </View>
        ) : (
          <Text style={styles.instruction}>Tap on the map to select a location</Text>
        )}

        <Button onPress={handleConfirm} disabled={!selectedLocation || isLoading} className="mt-3">
          Confirm Location
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: '#8B5CF6',
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  currentLocationIcon: {
    fontSize: 24,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  selectedInfo: {
    marginBottom: 8,
  },
  selectedLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  instruction: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
});
