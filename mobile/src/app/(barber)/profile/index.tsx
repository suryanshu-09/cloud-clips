import { Text, View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { useAuth } from '@/features/auth';
import { useBarberReviews } from '@/features/reviews';
import { ReviewSummary } from '@/components/review/ReviewSummary';
import { ReviewCard } from '@/components/review/ReviewCard';
import { Card } from '@/components/ui/Card';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function BarberProfileScreen() {
  const { currentUser, logout, isLoggingOut } = useAuth();
  const router = useRouter();
  const barberId = currentUser?.id || '';

  const barberProfile = useQuery(api.barbers.queries.getBarberProfile);

  const { data: reviewsData, isLoading: reviewsLoading } = useBarberReviews(barberId, {
    limit: 3,
    enabled: !!barberId,
  });

  const handleLogout = () => {
    logout();
  };

  const handleSeeAllReviews = () => {
    // Navigate to reviews screen (can be implemented later)
    // router.push('/(barber)/profile/reviews');
  };

  return (
    <SafeView>
      <Header title="My Profile" />
      <ScrollView className="flex-1 bg-gray-50">
        {/* User Info Section */}
        <View className="bg-white p-6 mb-4">
          <View className="items-center mb-6">
            <View className="w-24 h-24 bg-indigo-100 rounded-full items-center justify-center mb-4">
              <Ionicons name="cut" size={48} color="#6366f1" />
            </View>
            <Text className="text-2xl font-bold text-gray-900 mb-1">
              {currentUser?.name || 'Barber'}
            </Text>
            <Text className="text-gray-600">{currentUser?.email || 'email@example.com'}</Text>
            <View className="bg-blue-100 px-3 py-1 rounded-full mt-2">
              <Text className="text-blue-700 text-sm font-medium">BARBER</Text>
            </View>
          </View>
        </View>

        {/* Business Section */}
        <View className="bg-white mb-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-500 uppercase">Business</Text>
          </View>

          <Pressable
            className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            onPress={() => router.push('/(barber)/profile/business')}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="business-outline" size={24} color="#6b7280" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-gray-900">Business Info</Text>
                {barberProfile?.businessName ? (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {barberProfile.businessName}
                  </Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            onPress={() => router.push('/(barber)/profile/services')}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="pricetag-outline" size={24} color="#6b7280" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-gray-900">Service Pricing</Text>
                {barberProfile?.services ? (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {barberProfile.services.length}{' '}
                    {barberProfile.services.length === 1 ? 'service' : 'services'}
                  </Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            onPress={() => router.push('/(barber)/profile/location')}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="location-outline" size={24} color="#6b7280" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-gray-900">Location</Text>
                {barberProfile?.location?.city ? (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {barberProfile.location.city}
                    {barberProfile.location.state ? `, ${barberProfile.location.state}` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            onPress={() => router.push('/(barber)/profile/gallery')}
          >
            <View className="flex-row items-center flex-1">
              <Ionicons name="images-outline" size={24} color="#6b7280" />
              <View className="ml-3 flex-1">
                <Text className="text-base text-gray-900">Portfolio Gallery</Text>
                {barberProfile?.portfolioImages ? (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {barberProfile.portfolioImages.length}{' '}
                    {barberProfile.portfolioImages.length === 1 ? 'photo' : 'photos'}
                  </Text>
                ) : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between p-4 active:bg-gray-50"
            onPress={() => router.push('/(barber)/offers')}
          >
            <View className="flex-row items-center">
              <Ionicons name="gift-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Offers & Coupons</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Reviews Section */}
        <View className="bg-white mb-4">
          <View className="px-4 py-3 border-b border-gray-100 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-gray-500 uppercase">Reviews</Text>
            {reviewsData && reviewsData.stats.totalReviews > 0 && (
              <Pressable onPress={handleSeeAllReviews}>
                <Text className="text-sm text-blue-600 font-semibold">See All</Text>
              </Pressable>
            )}
          </View>

          {reviewsLoading ? (
            <View className="p-4 items-center">
              <ActivityIndicator size="small" color="#0066CC" />
              <Text className="text-gray-600 mt-2 text-sm">Loading reviews...</Text>
            </View>
          ) : reviewsData && reviewsData.stats.totalReviews > 0 ? (
            <View className="p-4">
              {/* Review Summary */}
              <ReviewSummary
                summary={{
                  averageRating: reviewsData.stats.averageRating,
                  totalReviews: reviewsData.stats.totalReviews,
                  distribution: {
                    oneStar: reviewsData.stats.ratingDistribution[1],
                    twoStar: reviewsData.stats.ratingDistribution[2],
                    threeStar: reviewsData.stats.ratingDistribution[3],
                    fourStar: reviewsData.stats.ratingDistribution[4],
                    fiveStar: reviewsData.stats.ratingDistribution[5],
                  },
                }}
                showDistribution
                size="md"
                variant="default"
              />

              {/* Recent Reviews */}
              <View className="mt-4">
                <Text className="text-sm font-semibold text-gray-900 mb-3">Recent Reviews</Text>
                {reviewsData.reviews.slice(0, 3).map((review) => (
                  <View key={review.id} className="mb-3">
                    <ReviewCard review={review} />
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View className="p-4">
              <Card variant="outlined" padding="lg">
                <View className="items-center justify-center py-6">
                  <Text className="text-4xl mb-3">⭐</Text>
                  <Text className="text-lg font-bold text-gray-900 text-center mb-2">
                    No reviews yet
                  </Text>
                  <Text className="text-sm text-gray-600 text-center">
                    Complete appointments to start receiving reviews from clients
                  </Text>
                </View>
              </Card>
            </View>
          )}
        </View>

        {/* Account Section */}
        <View className="bg-white mb-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-500 uppercase">Account</Text>
          </View>

          <Pressable
            className="flex-row items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50"
            onPress={() => router.push('/(barber)/profile/edit')}
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="card-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Payment Methods</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="settings-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Support Section */}
        <View className="bg-white mb-4">
          <View className="px-4 py-3 border-b border-gray-100">
            <Text className="text-sm font-semibold text-gray-500 uppercase">Support</Text>
          </View>

          <Pressable className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <Ionicons name="help-circle-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>

          <Pressable className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={24} color="#6b7280" />
              <Text className="text-base text-gray-900 ml-3">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Logout Button */}
        <View className="px-6 py-4">
          <Pressable
            onPress={handleLogout}
            disabled={isLoggingOut}
            className="bg-red-600 active:bg-red-700 rounded-lg px-4 py-4 flex-row items-center justify-center"
          >
            {isLoggingOut ? (
              <>
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white font-semibold ml-2">Logging out...</Text>
              </>
            ) : (
              <>
                <Ionicons name="log-out-outline" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Logout</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Version Info */}
        <View className="items-center py-6">
          <Text className="text-sm text-gray-400">Version 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeView>
  );
}
