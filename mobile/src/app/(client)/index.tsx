import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { BarberList } from '@/components/barber/BarberList';
import { useNearbyBarbers, type IBarberProfile } from '@/features/barbers';
import * as Location from 'expo-location';

const DEFAULT_LOCATION = { latitude: 37.7749, longitude: -122.4194 };

export default function ClientHomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setLocationError('Permission to access location was denied');
            setLocation(DEFAULT_LOCATION);
          }
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 100,
        });

        if (!cancelled) {
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
          });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error getting location:', error);
        if (__DEV__) {
          console.log('[Dev Mode] Using default location (San Francisco)');
          setLocation(DEFAULT_LOCATION);
          setLocationError(
            'Using default location (enable location services for accurate results)'
          );
        } else {
          setLocationError('Failed to get your location');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading, isError, error, refetch } = useNearbyBarbers(
    location ?? { latitude: 0, longitude: 0, radius: 10 },
    { enabled: !!location }
  );

  const handleBarberPress = useCallback(
    (barber: IBarberProfile) => {
      router.push(`/(client)/booking/${barber.id}`);
    },
    [router]
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  return (
    <SafeView>
      <Header title="Find Your Barber" />
      <View className="flex-1">
        {/* Header Section */}
        <View className="px-6 py-4 bg-white border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900 mb-1">Discover Barbers</Text>
          <Text className="text-sm text-gray-600">
            {location ? 'Top-rated barbers near you' : locationError || 'Getting your location...'}
          </Text>
        </View>

        {/* Barber List */}
        <BarberList
          barbers={data?.barbers || []}
          isLoading={isLoading}
          isError={isError}
          error={error}
          onBarberPress={handleBarberPress}
          onRetry={refetch}
          showDistance={true}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
        />
      </View>
    </SafeView>
  );
}
