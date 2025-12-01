import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { BarberList } from '@/components/barber/BarberList';
import { useNearbyBarbers, type IBarberProfile } from '@/features/barbers';
import * as Location from 'expo-location';

export default function ClientHomeScreen() {
  const router = useRouter();
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Permission to access location was denied');
          // Use default location (San Francisco coordinates as fallback)
          setLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 100,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        // Use default location for emulator or when location services unavailable
        if (__DEV__) {
          console.log('[Dev Mode] Using default location (San Francisco)');
          setLocation({
            latitude: 37.7749,
            longitude: -122.4194,
          });
          setLocationError(
            'Using default location (enable location services for accurate results)'
          );
        } else {
          setLocationError('Failed to get your location');
        }
      }
    })();
  }, []);

  const { data, isLoading, isError, error, refetch } = useNearbyBarbers(
    location || { latitude: 0, longitude: 0, radius: 10 },
    { enabled: !!location }
  );

  const handleBarberPress = (barber: IBarberProfile) => {
    router.push(`/(client)/booking/${barber.id}`);
  };

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
          refreshing={isLoading}
          onRefresh={refetch}
        />
      </View>
    </SafeView>
  );
}
