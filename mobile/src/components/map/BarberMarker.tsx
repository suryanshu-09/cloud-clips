import React, { memo } from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, Pressable } from 'react-native';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import type { IBarberProfile } from '@/features/barbers/types';

interface IBarberMarkerProps {
  barber: IBarberProfile;
  distance?: number;
  onPress?: (barber: IBarberProfile) => void;
  onCalloutPress?: (barber: IBarberProfile) => void;
  isSelected?: boolean;
}

function BarberMarkerComponent({
  barber,
  distance,
  onPress,
  onCalloutPress,
  isSelected = false,
}: IBarberMarkerProps) {
  if (!barber.location?.coordinates || barber.location.coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = barber.location.coordinates;
  const displayName = barber.businessName || barber.name;
  const avatarLetter = (displayName || 'B').charAt(0).toUpperCase();

  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
      onPress={() => onPress?.(barber)}
    >
      {/* Custom Marker Container */}
      <View className="items-center">
        {/* Avatar with Rating Badge */}
        <View
          className={`rounded-full border-4 bg-white overflow-hidden ${
            isSelected ? 'border-indigo-600' : 'border-indigo-500'
          }`}
          style={{
            width: 48,
            height: 48,
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
          }}
        >
          <OptimizedImage
            source={barber.profileImage}
            width={48}
            height={48}
            contentFit="cover"
            fallbackText={avatarLetter}
            showPlaceholder={false}
          />
        </View>

        {/* Rating Badge - Positioned at bottom right of avatar */}
        {barber.rating > 0 && (
          <View
            className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full flex-row items-center justify-center px-1.5 py-0.5 border-2 border-white"
            style={{
              elevation: 4,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.2,
              shadowRadius: 1.5,
              minWidth: 32,
            }}
          >
            <Text className="text-yellow-900 text-xs font-bold">★</Text>
            <Text className="text-yellow-900 text-xs font-bold ml-0.5">
              {barber.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Pin Triangle */}
        <View
          className="w-0 h-0 mt-[-2px]"
          style={{
            borderLeftWidth: 10,
            borderRightWidth: 10,
            borderTopWidth: 14,
            borderLeftColor: 'transparent',
            borderRightColor: 'transparent',
            borderTopColor: isSelected ? '#4F46E5' : '#8B5CF6',
          }}
        />
      </View>

      {/* Callout */}
      <Callout onPress={() => onCalloutPress?.(barber)} tooltip={false} style={{ width: 220 }}>
        <Pressable className="bg-white rounded-xl p-3 min-w-[180px]">
          {/* Business Name */}
          <Text className="text-base font-bold text-gray-900 mb-1" numberOfLines={1}>
            {displayName}
          </Text>

          {/* Rating and Reviews Row */}
          <View className="flex-row items-center mb-1">
            <Text className="text-yellow-500 text-sm">★</Text>
            <Text className="text-sm font-semibold text-gray-900 ml-1">
              {barber.rating.toFixed(1)}
            </Text>
            <Text className="text-xs text-gray-500 ml-1">({barber.totalReviews || 0} reviews)</Text>
          </View>

          {/* Distance */}
          {distance !== undefined && (
            <Text className="text-xs text-gray-500 mb-2">
              {distance < 1
                ? `${Math.round(distance * 1000)}m away`
                : `${distance.toFixed(1)}km away`}
            </Text>
          )}

          {/* Specialties */}
          {barber.specialties && barber.specialties.length > 0 && (
            <View className="flex-row flex-wrap gap-1 mb-2">
              {barber.specialties.slice(0, 2).map((specialty, index) => (
                <View key={index} className="bg-gray-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-gray-600">{specialty}</Text>
                </View>
              ))}
              {barber.specialties.length > 2 && (
                <View className="bg-gray-100 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-gray-600">+{barber.specialties.length - 2}</Text>
                </View>
              )}
            </View>
          )}

          {/* Verified Badge */}
          {barber.isVerified && (
            <View className="flex-row items-center mb-1">
              <Text className="text-blue-500 text-xs">✓</Text>
              <Text className="text-xs text-blue-600 ml-1">Verified Barber</Text>
            </View>
          )}

          {/* Tap Hint */}
          <Text className="text-xs text-indigo-600 font-medium text-center mt-1">
            Tap for details →
          </Text>
        </Pressable>
      </Callout>
    </Marker>
  );
}

export const BarberMarker = memo(BarberMarkerComponent);
