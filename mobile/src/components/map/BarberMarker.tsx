import React from 'react';
import { Marker, Callout } from 'react-native-maps';
import { View, Text, Image, StyleSheet } from 'react-native';
import type { IBarberProfile } from '@/features/barbers/types';

interface IBarberMarkerProps {
  barber: IBarberProfile;
  distance?: number;
  onPress?: (barber: IBarberProfile) => void;
  onCalloutPress?: (barber: IBarberProfile) => void;
}

export function BarberMarker({ barber, distance, onPress, onCalloutPress }: IBarberMarkerProps) {
  if (!barber.location?.coordinates || barber.location.coordinates.length !== 2) {
    return null;
  }

  const [longitude, latitude] = barber.location.coordinates;

  return (
    <Marker
      coordinate={{
        latitude,
        longitude,
      }}
      title={barber.businessName || barber.name}
      description={barber.bio}
      onPress={() => onPress?.(barber)}
      pinColor="#8B5CF6"
    >
      <View style={styles.markerContainer}>
        <View style={styles.avatarContainer}>
          {barber.profileImage ? (
            <Image source={{ uri: barber.profileImage }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {(barber.businessName || barber.name || 'B').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.markerPin} />
      </View>
      <Callout
        onPress={() => onCalloutPress?.(barber)}
        tooltip={false}
        style={styles.calloutContainer}
      >
        <View style={styles.callout}>
          <Text style={styles.businessName} numberOfLines={1}>
            {barber.businessName || barber.name}
          </Text>
          {barber.rating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingText}>⭐ {barber.rating.toFixed(1)}</Text>
              <Text style={styles.reviewCount}>({barber.totalReviews || 0})</Text>
            </View>
          )}
          {distance && <Text style={styles.distance}>{distance.toFixed(1)} km away</Text>}
          <Text style={styles.tapHint}>Tap for details</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#8B5CF6',
    backgroundColor: 'white',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  markerPin: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#8B5CF6',
    marginTop: -2,
  },
  calloutContainer: {
    width: 200,
  },
  callout: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    minWidth: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  businessName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '600',
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  distance: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  tapHint: {
    fontSize: 11,
    color: '#8B5CF6',
    fontWeight: '500',
    textAlign: 'center',
  },
});
