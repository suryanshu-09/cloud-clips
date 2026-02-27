import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, Pressable, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

import { Ionicons } from '@expo/vector-icons';
import { useAtomValue } from 'jotai';
import RNMapView, { Region } from 'react-native-maps';

import { MapView } from '@/components/map/MapView';
import { BarberMarker } from '@/components/map/BarberMarker';
import { SearchRadiusSelector } from '@/components/map/SearchRadiusSelector';
import { BarberList } from '@/components/barber/BarberList';
import { createLazyComponent, preloadComponent } from '@/utils/performance';

// Lazy-load FilterBottomSheet — only needed when the user opens filters
const FilterBottomSheet = createLazyComponent(
  () => import('@/components/map/FilterBottomSheet').then((m) => ({ default: m.FilterBottomSheet }))
);
import { SafeView } from '@/components/ui/SafeView';
import { Badge } from '@/components/ui/Badge';
import { useNearbyBarbers, type IBarberProfile } from '@/features/barbers';
import { useCurrentLocation } from '@/hooks/useCurrentLocation';
import { searchRadiusAtom } from '@/store/atoms/locationAtom';
import { filterAtom, activeFiltersCountAtom, type IFilterState } from '@/store/atoms/filterAtom';

type ViewMode = 'map' | 'list';

const _SCREEN_WIDTH = Dimensions.get('window').width;

const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
};

const DEFAULT_DELTA = {
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function DiscoverScreen() {
  const router = useRouter();
  const mapRef = useRef<RNMapView>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showFilters, setShowFilters] = useState(false);
  const [showRadiusSelector, setShowRadiusSelector] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<IBarberProfile | null>(null);
  const [_mapRegion, setMapRegion] = useState<Region>({
    ...DEFAULT_LOCATION,
    ...DEFAULT_DELTA,
  });

  const slideAnim = useRef(new Animated.Value(0)).current;

  const { location, error: locationError } = useCurrentLocation();
  const searchRadius = useAtomValue(searchRadiusAtom);
  const filters = useAtomValue(filterAtom);
  const activeFiltersCount = useAtomValue(activeFiltersCountAtom);

  // Preload FilterBottomSheet as soon as the screen mounts
  useEffect(() => {
    preloadComponent(() =>
      import('@/components/map/FilterBottomSheet').then((m) => ({ default: m.FilterBottomSheet }))
    );
  }, []);

  const userLocation = useMemo(
    () => ({
      latitude: location?.latitude ?? DEFAULT_LOCATION.latitude,
      longitude: location?.longitude ?? DEFAULT_LOCATION.longitude,
      radius: searchRadius,
    }),
    [location, searchRadius]
  );

  const { data, isLoading, isError, error, refetch } = useNearbyBarbers(userLocation, {
    enabled: true,
  });

  // Filter barbers based on active filters
  const filteredBarbers = useMemo(() => {
    if (!data?.barbers) return [];
    let result = data.barbers;

    if (filters.priceRange) {
      result = result.filter((barber) => {
        if (!barber.services || barber.services.length === 0) return false;
        const lowestPrice = Math.min(...barber.services.map((s) => s.price));
        return lowestPrice >= filters.priceRange!.min && lowestPrice <= filters.priceRange!.max;
      });
    }

    if (filters.minRating) {
      result = result.filter((barber) => barber.rating >= filters.minRating!);
    }

    if (filters.specialties.length > 0) {
      result = result.filter((barber) =>
        filters.specialties.some((s) => barber.specialties?.includes(s))
      );
    }

    return result;
  }, [data?.barbers, filters]);

  // Center map on user location when it becomes available
  useEffect(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          ...DEFAULT_DELTA,
        },
        500
      );
    }
  }, [location]);

  const toggleViewMode = useCallback(() => {
    const toValue = viewMode === 'map' ? 1 : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 250,
      useNativeDriver: true,
    }).start();
    setViewMode((prev) => (prev === 'map' ? 'list' : 'map'));
  }, [viewMode, slideAnim]);

  const handleBarberPress = useCallback(
    (barber: IBarberProfile) => {
      router.push(`/(client)/booking/${barber.id}`);
    },
    [router]
  );

  const handleMarkerPress = useCallback((barber: IBarberProfile) => {
    setSelectedBarber(barber);
  }, []);

  const handleCalloutPress = useCallback(
    (barber: IBarberProfile) => {
      router.push(`/(client)/booking/${barber.id}`);
    },
    [router]
  );

  const handleApplyFilters = useCallback((_filters: IFilterState) => {
    setShowFilters(false);
  }, []);

  const handleRegionChange = useCallback((region: Region) => {
    setMapRegion(region);
  }, []);

  const handleCenterOnUser = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          ...DEFAULT_DELTA,
        },
        500
      );
    }
  }, [location]);

  return (
    <SafeView>
      {/* Top Bar */}
      <View className="bg-white border-b border-gray-200 px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900">Discover</Text>
            <Text className="text-xs text-gray-500 mt-0.5">
              {filteredBarbers.length} barber{filteredBarbers.length !== 1 ? 's' : ''} nearby
              {locationError ? ' (default location)' : ''}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Filter Button */}
            <Pressable
              onPress={() => setShowFilters(true)}
              className="relative p-2 rounded-full bg-gray-100 active:bg-gray-200"
              accessibilityLabel="Open filters"
              accessibilityRole="button"
            >
              <Ionicons name="options-outline" size={22} color="#374151" />
              {activeFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-indigo-600 rounded-full w-5 h-5 items-center justify-center">
                  <Text className="text-white text-xs font-bold">{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>

            {/* View Toggle */}
            <View className="flex-row bg-gray-100 rounded-full p-0.5">
              <Pressable
                onPress={() => viewMode !== 'map' && toggleViewMode()}
                className={`px-3 py-1.5 rounded-full ${
                  viewMode === 'map' ? 'bg-white shadow-sm' : ''
                }`}
                accessibilityLabel="Map view"
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === 'map' }}
              >
                <Ionicons name="map" size={18} color={viewMode === 'map' ? '#4F46E5' : '#9CA3AF'} />
              </Pressable>
              <Pressable
                onPress={() => viewMode !== 'list' && toggleViewMode()}
                className={`px-3 py-1.5 rounded-full ${
                  viewMode === 'list' ? 'bg-white shadow-sm' : ''
                }`}
                accessibilityLabel="List view"
                accessibilityRole="button"
                accessibilityState={{ selected: viewMode === 'list' }}
              >
                <Ionicons
                  name="list"
                  size={18}
                  color={viewMode === 'list' ? '#4F46E5' : '#9CA3AF'}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Active Filters Pills */}
        {activeFiltersCount > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {filters.priceRange && (
              <Badge variant="primary" size="sm">
                ${filters.priceRange.min}-${filters.priceRange.max}
              </Badge>
            )}
            {filters.minRating && (
              <Badge variant="primary" size="sm">
                {filters.minRating}+ stars
              </Badge>
            )}
            {filters.specialties.slice(0, 2).map((s) => (
              <Badge key={s} variant="primary" size="sm">
                {s}
              </Badge>
            ))}
            {filters.specialties.length > 2 && (
              <Badge variant="secondary" size="sm">
                +{filters.specialties.length - 2} more
              </Badge>
            )}
          </View>
        )}
      </View>

      {/* Content Area */}
      <View className="flex-1">
        {viewMode === 'map' ? (
          <View className="flex-1">
            {/* Map */}
            <MapView
              ref={mapRef}
              initialRegion={{
                ...userLocation,
                ...DEFAULT_DELTA,
              }}
              onRegionChangeComplete={handleRegionChange}
              showsUserLocation
              showsMyLocationButton={false}
              style={{ flex: 1 }}
            >
              {filteredBarbers.map((barber) => (
                <BarberMarker
                  key={barber.id}
                  barber={barber}
                  isSelected={selectedBarber?.id === barber.id}
                  onPress={handleMarkerPress}
                  onCalloutPress={handleCalloutPress}
                />
              ))}
            </MapView>

            {/* Map Overlay Controls */}
            <View className="absolute top-3 left-3 right-3">
              {/* Search Radius Toggle */}
              <Pressable
                onPress={() => setShowRadiusSelector(!showRadiusSelector)}
                className="self-start bg-white rounded-xl px-3 py-2 shadow-md flex-row items-center gap-2"
                accessibilityLabel="Toggle search radius selector"
                accessibilityRole="button"
              >
                <Ionicons name="navigate-circle-outline" size={18} color="#3B82F6" />
                <Text className="text-sm font-medium text-gray-700">{searchRadius}mi radius</Text>
                <Ionicons
                  name={showRadiusSelector ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color="#9CA3AF"
                />
              </Pressable>

              {/* Radius Selector Dropdown */}
              {showRadiusSelector && (
                <View className="mt-2">
                  <SearchRadiusSelector
                    onRadiusChange={() => {
                      refetch();
                    }}
                  />
                </View>
              )}
            </View>

            {/* Center on User Button */}
            <Pressable
              onPress={handleCenterOnUser}
              className="absolute bottom-6 right-4 bg-white rounded-full p-3 shadow-lg active:bg-gray-50"
              accessibilityLabel="Center map on your location"
              accessibilityRole="button"
              style={{
                elevation: 5,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
              }}
            >
              <Ionicons name="locate" size={24} color="#4F46E5" />
            </Pressable>

            {/* Results Count Pill */}
            <View className="absolute bottom-6 left-4 bg-white/95 rounded-full px-4 py-2 shadow-md">
              <Text className="text-sm font-medium text-gray-700">
                {filteredBarbers.length} result{filteredBarbers.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        ) : (
          /* List View */
          <BarberList
            barbers={filteredBarbers}
            isLoading={isLoading}
            isError={isError}
            error={error}
            onBarberPress={handleBarberPress}
            onRetry={refetch}
            showDistance
            refreshing={isLoading}
            onRefresh={refetch}
            ListHeaderComponent={
              <View className="px-4 pb-2">
                <SearchRadiusSelector
                  onRadiusChange={() => {
                    refetch();
                  }}
                />
              </View>
            }
          />
        )}
      </View>

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
      />
    </SafeView>
  );
}
