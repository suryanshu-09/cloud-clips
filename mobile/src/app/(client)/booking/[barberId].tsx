import { Text, View, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ServiceList } from '@/components/barber/ServiceList';
import { useBarberProfile } from '@/features/barbers';

export default function BarberProfileScreen() {
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const router = useRouter();

  const { data: barber, isLoading, isError, error, refetch } = useBarberProfile(barberId || '');

  if (isLoading) {
    return (
      <SafeView>
        <Header title="Barber Profile" showBackButton />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0066CC" />
          <Text className="text-gray-600 mt-4">Loading barber profile...</Text>
        </View>
      </SafeView>
    );
  }

  if (isError || !barber) {
    return (
      <SafeView>
        <Header title="Barber Profile" showBackButton />
        <View className="flex-1 items-center justify-center p-6">
          <EmptyState
            title="Failed to load profile"
            description={error?.message || 'Something went wrong'}
          />
          <Button onPress={() => refetch()} className="mt-4">
            Try Again
          </Button>
        </View>
      </SafeView>
    );
  }

  const handleBookNow = () => {
    router.push(`/(client)/booking/form?barberId=${barberId}`);
  };

  const getWorkingDays = () => {
    if (!barber.workingHours) return 'Hours not available';

    const days = Object.entries(barber.workingHours)
      .filter(([_, hours]) => hours.isAvailable)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1, 3));

    return days.length > 0 ? days.join(', ') : 'Hours not available';
  };

  return (
    <SafeView>
      <Header title="Barber Profile" showBackButton />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View className="bg-white p-6 border-b border-gray-200">
          <View className="flex-row items-start gap-4">
            <Avatar
              source={barber.profileImage}
              size="xl"
              fallback={barber.name?.charAt(0) || barber.businessName?.charAt(0) || 'B'}
              showBadge={barber.isVerified}
              badgeColor="bg-blue-500"
            />

            <View className="flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <Text className="text-2xl font-bold text-gray-900">
                  {barber.businessName || barber.name}
                </Text>
                {barber.isVerified && (
                  <Badge variant="info" size="sm">
                    Verified
                  </Badge>
                )}
              </View>

              {/* Rating */}
              <View className="flex-row items-center gap-2 mb-2">
                <View className="flex-row items-center gap-1">
                  <Text className="text-yellow-500 text-lg">⭐</Text>
                  <Text className="text-base font-semibold text-gray-900">
                    {barber.rating.toFixed(1)}
                  </Text>
                </View>
                <Text className="text-sm text-gray-500">({barber.totalReviews} reviews)</Text>
              </View>

              {/* Experience */}
              {barber.experience > 0 && (
                <Text className="text-sm text-gray-600">
                  {barber.experience}+ years of experience
                </Text>
              )}
            </View>
          </View>

          {/* Bio */}
          {barber.bio && (
            <Text className="text-base text-gray-700 mt-4 leading-6">{barber.bio}</Text>
          )}

          {/* Specialties */}
          {barber.specialties && barber.specialties.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-900 mb-2">Specialties</Text>
              <View className="flex-row flex-wrap gap-2">
                {barber.specialties.map((specialty, index) => (
                  <Badge key={index} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Quick Info Section */}
        <View className="bg-gray-50 p-6 border-b border-gray-200">
          <View className="flex-row justify-around gap-4">
            {/* Service Locations */}
            <View className="items-center flex-1 px-2">
              <Text className="text-2xl mb-2">📍</Text>
              <Text className="text-xs text-gray-600 text-center leading-5">
                {barber.serviceLocations
                  ?.join(' & ')
                  .replace('in_home', 'Home')
                  .replace('in_salon', 'Salon') || 'N/A'}
              </Text>
            </View>

            {/* Working Days */}
            <View className="items-center flex-1 px-2">
              <Text className="text-2xl mb-2">📅</Text>
              <Text className="text-xs text-gray-600 text-center leading-5">
                {getWorkingDays()}
              </Text>
            </View>

            {/* Total Reviews */}
            <View className="items-center flex-1 px-2">
              <Text className="text-2xl mb-2">💬</Text>
              <Text className="text-xs text-gray-600 text-center leading-5">
                {barber.totalReviews} Reviews
              </Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        {barber.location && (
          <View className="p-6 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Location</Text>
            <Card variant="outlined" padding="md">
              <View className="flex-row items-center gap-3">
                <Text className="text-2xl">📍</Text>
                <Text className="flex-1 text-sm text-gray-700">{barber.location.address}</Text>
              </View>
            </Card>
          </View>
        )}

        {/* Services Section */}
        <View className="py-6">
          <View className="px-6 mb-4">
            <Text className="text-lg font-bold text-gray-900">Services & Pricing</Text>
          </View>
          {barber.services && barber.services.length > 0 ? (
            <ServiceList services={barber.services} variant="default" />
          ) : (
            <View className="px-6">
              <EmptyState
                title="No services listed"
                description="This barber hasn't added any services yet"
              />
            </View>
          )}
        </View>

        {/* Gallery Section */}
        {barber.gallery && barber.gallery.length > 0 && (
          <View className="p-6 border-t border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-4">Portfolio</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-3"
            >
              {barber.gallery.map((item, index) => (
                <View key={index} className="w-32 h-32 rounded-lg overflow-hidden">
                  <Image source={{ uri: item.url }} className="w-full h-full" resizeMode="cover" />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="h-24" />
      </ScrollView>

      {/* Bottom Fixed Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <Button onPress={handleBookNow} size="lg">
          Book Now
        </Button>
      </View>
    </SafeView>
  );
}
