import React, { forwardRef } from 'react';
import RNMapView, { MapViewProps, PROVIDER_GOOGLE } from 'react-native-maps';
import { StyleSheet, Platform } from 'react-native';

interface ICustomMapViewProps extends MapViewProps {
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
}

export const MapView = forwardRef<RNMapView, ICustomMapViewProps>(
  (
    {
      showsUserLocation = true,
      showsMyLocationButton = true,
      followsUserLocation = false,
      style,
      ...props
    },
    ref
  ) => {
    return (
      <RNMapView
        ref={ref}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        style={[styles.map, style]}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        followsUserLocation={followsUserLocation}
        showsCompass={true}
        showsBuildings={true}
        showsTraffic={false}
        loadingEnabled={true}
        loadingIndicatorColor="#8B5CF6"
        {...props}
      />
    );
  }
);

MapView.displayName = 'MapView';

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: '100%',
  },
});
