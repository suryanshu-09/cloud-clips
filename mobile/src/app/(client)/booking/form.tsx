import { useState } from 'react';
import { ScrollView, Text, View, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { HaircutSelector } from '@/components/booking';
import { Button } from '@/components/ui';
import type { HairType, LocationType } from '@/features/bookings';

// Temporary state atom for booking flow (could be persisted)
import { atom } from 'jotai';

export const bookingFormAtom = atom<{
  barberId?: string;
  serviceType?: string;
  hairType?: HairType;
  locationType?: LocationType;
  address?: string;
  specialRequests?: string;
}>({});

export default function BookingFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ barberId?: string; serviceType?: string }>();

  const [bookingForm, setBookingForm] = useAtom(bookingFormAtom);
  const [hairType, setHairType] = useState<HairType | undefined>(bookingForm.hairType);
  const [locationType, setLocationType] = useState<LocationType>(
    bookingForm.locationType || 'in_salon'
  );
  const [address, setAddress] = useState(bookingForm.address || '');
  const [specialRequests, setSpecialRequests] = useState(bookingForm.specialRequests || '');

  const handleContinue = () => {
    // Save form data to shared atom
    setBookingForm({
      barberId: params.barberId,
      serviceType: params.serviceType,
      hairType,
      locationType,
      address: locationType === 'in_home' ? address : undefined,
      specialRequests,
    });

    // Navigate to schedule screen
    router.push('/booking/schedule');
  };

  const isValid = hairType && (locationType === 'in_salon' || address.length > 0);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Booking Details</Text>
        <Text className="text-gray-600">Select service and preferences</Text>
      </View>

      <View className="p-6 space-y-6">
        {/* Hair Type Selection */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Hair Type</Text>
          <HaircutSelector selected={hairType} onSelect={setHairType} />
        </View>

        {/* Location Type Selection */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Service Location</Text>
          <View className="flex-row gap-3">
            <Button
              variant={locationType === 'in_salon' ? 'primary' : 'outline'}
              onPress={() => setLocationType('in_salon')}
              className="flex-1"
            >
              In Salon
            </Button>
            <Button
              variant={locationType === 'in_home' ? 'primary' : 'outline'}
              onPress={() => setLocationType('in_home')}
              className="flex-1"
            >
              In Home
            </Button>
          </View>
        </View>

        {/* Address Input (if in-home selected) */}
        {locationType === 'in_home' && (
          <View>
            <Text className="text-lg font-semibold text-gray-900 mb-3">Your Address</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
              placeholder="Enter your full address"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
            />
          </View>
        )}

        {/* Special Requests */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Special Requests (Optional)
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="Any special requests or notes?"
            value={specialRequests}
            onChangeText={setSpecialRequests}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      {/* Bottom Action */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleContinue} disabled={!isValid} size="lg">
          Continue to Schedule
        </Button>
      </View>
    </ScrollView>
  );
}
