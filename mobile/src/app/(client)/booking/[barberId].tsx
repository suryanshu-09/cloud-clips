import { useState } from 'react';
import { Text, View, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Marker } from 'react-native-maps';

import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { ImageZoomModal } from '@/components/ui/ImageZoomModal';
import { MapView } from '@/components/map/MapView';
import { ServiceList } from '@/components/barber/ServiceList';
import { useBarberProfile } from '@/features/barbers';
import { useBarberReviews } from '@/features/reviews';
import { ReviewCard } from '@/components/review';
import { RatingStars } from '@/components/shared/RatingStars';

export default function BarberProfileScreen() {
  const { barberId } = useLocalSearchParams<{ barberId: string }>();
  const router = useRouter();
  const [showGalleryZoom, setShowGalleryZoom] = useState(false);
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);

  const { data: barber, isLoading, isError, error, refetch } = useBarberProfile(barberId || '');
  const { data: reviewsData, isLoading: reviewsLoading } = useBarberReviews(barberId || '', {
    limit: 5,
  });

  if (isLoading) {
    return (
      <SafeView>
        <Header title="Barber Profile" showBack />
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
        <Header title="Barber Profile" showBack />
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

  const handleGalleryImagePress = (index: number) => {
    setSelectedGalleryIndex(index);
    setShowGalleryZoom(true);
  };

  return (
    <SafeView>
      <Header title="Barber Profile" showBack />
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
              <View className="mb-2">
                <RatingStars
                  rating={barber.rating}
                  size="md"
                  showCount
                  reviewCount={barber.totalReviews}
                />
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

        {/* Location Section with Map Preview */}
        {barber.location && (
          <View className="p-6 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-900 mb-3">Location</Text>
            {barber.location.coordinates && barber.location.coordinates.length === 2 && (
              <View className="rounded-xl overflow-hidden mb-3" style={{ height: 180 }}>
                <MapView
                  initialRegion={{
                    latitude: barber.location.coordinates[1],
                    longitude: barber.location.coordinates[0],
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  rotateEnabled={false}
                  pitchEnabled={false}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  style={{ flex: 1 }}
                >
                  <Marker
                    coordinate={{
                      latitude: barber.location.coordinates[1],
                      longitude: barber.location.coordinates[0],
                    }}
                    title={barber.businessName || barber.name}
                  />
                </MapView>
              </View>
            )}
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
              contentContainerStyle={{ gap: 12 }}
            >
              {barber.gallery.map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleGalleryImagePress(index)}
                  className="active:opacity-80"
                >
                  <View className="w-32 h-32 rounded-lg overflow-hidden">
                    <Image
                      source={{ uri: item.url }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            {/* Gallery Zoom Modal */}
            <ImageZoomModal
              visible={showGalleryZoom}
              imageUrls={barber.gallery.map((item) => item.url)}
              initialIndex={selectedGalleryIndex}
              onClose={() => setShowGalleryZoom(false)}
            />
          </View>
        )}

        {/* Reviews Section */}
        <View className="p-6 border-t border-gray-200">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">Reviews</Text>
            {reviewsData && reviewsData.reviews.length > 0 && (
              <Pressable onPress={() => {}}>
                <Text className="text-sm text-blue-600 font-semibold">See All</Text>
              </Pressable>
            )}
          </View>

          {reviewsLoading ? (
            <View className="items-center py-8">
              <ActivityIndicator size="small" color="#0066CC" />
              <Text className="text-gray-600 mt-2">Loading reviews...</Text>
            </View>
          ) : reviewsData && reviewsData.reviews.length > 0 ? (
            <View className="gap-3">
              {/* Review Stats Summary */}
              <Card variant="outlined" padding="md">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <RatingStars rating={reviewsData.stats.averageRating} size="md" />
                      <Text className="text-sm text-gray-600">
                        based on {reviewsData.stats.totalReviews} reviews
                      </Text>
                    </View>

                    {/* Rating Distribution */}
                    <View className="gap-1 mt-2">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const count =
                          reviewsData.stats.ratingDistribution[
                            star as keyof typeof reviewsData.stats.ratingDistribution
                          ];
                        const percentage =
                          reviewsData.stats.totalReviews > 0
                            ? (count / reviewsData.stats.totalReviews) * 100
                            : 0;

                        return (
                          <View key={star} className="flex-row items-center gap-2">
                            <Text className="text-xs text-gray-600 w-8">{star} ★</Text>
                            <View className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <View
                                className="h-full bg-yellow-400 rounded-full"
                                style={{ width: `${percentage}%` }}
                              />
                            </View>
                            <Text className="text-xs text-gray-600 w-8 text-right">{count}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                </View>
              </Card>

              {/* Review Cards */}
              {reviewsData.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No reviews yet"
              description="Be the first to review this barber after your appointment"
            />
          )}
        </View>

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
