import { View, Text, Pressable, type PressableProps } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import type { IBarberProfile } from '@/features/barbers';

interface IBarberCardProps extends Omit<PressableProps, 'children'> {
  barber: IBarberProfile;
  showDistance?: boolean;
  distance?: number;
}

export function BarberCard({ barber, showDistance = false, distance, ...props }: IBarberCardProps) {
  const formatDistance = (distanceKm: number) => {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)}m away`;
    }
    return `${distanceKm.toFixed(1)}km away`;
  };

  const getLowestPrice = () => {
    if (!barber.services || barber.services.length === 0) return null;
    const prices = barber.services.map((s) => s.price);
    return Math.min(...prices);
  };

  const lowestPrice = getLowestPrice();

  return (
    <Pressable {...props}>
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <View className="flex-row">
          {/* Avatar Section */}
          <View className="p-4">
            <Avatar
              source={barber.profileImage}
              size="xl"
              fallback={barber.name?.charAt(0) || barber.businessName?.charAt(0) || 'B'}
              showBadge={barber.isVerified}
              badgeColor="bg-blue-500"
            />
          </View>

          {/* Info Section */}
          <View className="flex-1 p-4 pr-2 justify-between min-w-0">
            {/* Name and Badge */}
            <View className="min-w-0">
              <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                <Text className="text-lg font-bold text-gray-900 flex-shrink" numberOfLines={1}>
                  {barber.businessName || barber.name}
                </Text>
                {barber.isVerified && (
                  <Badge variant="info" size="sm">
                    Verified
                  </Badge>
                )}
              </View>

              {/* Bio */}
              {barber.bio && (
                <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
                  {barber.bio}
                </Text>
              )}

              {/* Specialties */}
              {barber.specialties && barber.specialties.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mb-2">
                  {barber.specialties.slice(0, 3).map((specialty, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {specialty}
                    </Badge>
                  ))}
                  {barber.specialties.length > 3 && (
                    <Badge variant="secondary" size="sm">
                      +{barber.specialties.length - 3}
                    </Badge>
                  )}
                </View>
              )}
            </View>

            {/* Bottom Row - Rating, Price, Distance */}
            <View className="flex-row items-center justify-between flex-wrap gap-2">
              <View className="flex-row items-center gap-3 flex-wrap">
                {/* Rating */}
                <View className="flex-row items-center gap-1">
                  <Text className="text-yellow-500 text-base">⭐</Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {barber.rating.toFixed(1)}
                  </Text>
                  <Text className="text-xs text-gray-500">({barber.totalReviews})</Text>
                </View>

                {/* Experience */}
                {barber.experience > 0 && (
                  <Text className="text-xs text-gray-500">{barber.experience}+ yrs</Text>
                )}

                {/* Distance */}
                {showDistance && distance !== undefined && (
                  <Text className="text-xs text-gray-500">{formatDistance(distance)}</Text>
                )}
              </View>

              {/* Price */}
              {lowestPrice && (
                <Text className="text-sm font-bold text-gray-900">From ${lowestPrice}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Service Locations */}
        {barber.serviceLocations && barber.serviceLocations.length > 0 && (
          <View className="px-4 pb-3 flex-row gap-2 flex-wrap">
            {barber.serviceLocations.map((location, index) => (
              <View key={index} className="flex-row items-center gap-1">
                <Text className="text-xs text-gray-600">
                  {location === 'in_home' ? '🏠 Home Service' : '💈 Salon'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
