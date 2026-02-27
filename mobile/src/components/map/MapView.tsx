import React, { forwardRef } from 'react';
import RNMapView, { MapViewProps, UrlTile } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { useAtomValue } from 'jotai';
import { mapStyleAtom } from '@/store/atoms/themeAtom';
import { MAP_STYLES, type MapStyle, DEFAULT_MAP_CONFIG } from '@/config/mapStyles';

interface ICustomMapViewProps extends MapViewProps {
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  followsUserLocation?: boolean;
  mapTileStyle?: MapStyle;
  tileOpacity?: number;
}

export const MapView = forwardRef<RNMapView, ICustomMapViewProps>(
  (
    {
      showsUserLocation = DEFAULT_MAP_CONFIG.showsUserLocation,
      showsMyLocationButton = DEFAULT_MAP_CONFIG.showsMyLocationButton,
      followsUserLocation = false,
      customMapStyle,
      tileOpacity = 1.0,
      style,
      ...props
    },
    ref
  ) => {
    const userMapStyle = useAtomValue(mapStyleAtom);
    const activeMapStyle = customMapStyle || userMapStyle || DEFAULT_MAP_CONFIG.style;
    const mapConfig = MAP_STYLES[activeMapStyle];

    return (
      <RNMapView
        ref={ref}
        style={[styles.map, style]}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={showsMyLocationButton}
        followsUserLocation={followsUserLocation}
        showsCompass={DEFAULT_MAP_CONFIG.showsCompass}
        showsBuildings={DEFAULT_MAP_CONFIG.showsBuildings}
        showsTraffic={DEFAULT_MAP_CONFIG.showsTraffic}
        showsIndoors={DEFAULT_MAP_CONFIG.showsIndoors}
        zoomEnabled={DEFAULT_MAP_CONFIG.zoomEnabled}
        rotateEnabled={DEFAULT_MAP_CONFIG.rotateEnabled}
        scrollEnabled={DEFAULT_MAP_CONFIG.scrollEnabled}
        pitchEnabled={DEFAULT_MAP_CONFIG.pitchEnabled}
        toolbarEnabled={DEFAULT_MAP_CONFIG.toolbarEnabled}
        cacheEnabled={DEFAULT_MAP_CONFIG.cacheEnabled}
        loadingEnabled={DEFAULT_MAP_CONFIG.loadingEnabled}
        loadingIndicatorColor={DEFAULT_MAP_CONFIG.loadingIndicatorColor}
        loadingBackgroundColor={DEFAULT_MAP_CONFIG.loadingBackgroundColor}
        {...props}
      >
        <UrlTile
          urlTemplate={mapConfig.urlTemplate}
          maximumZ={mapConfig.maxZoom}
          flipY={mapConfig.flipY}
          tileCachePath={`cloudclips-tiles-${activeMapStyle}`}
          tileCacheMaxAge={7 * 24 * 60 * 60}
          opacity={tileOpacity}
        />
      </RNMapView>
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
