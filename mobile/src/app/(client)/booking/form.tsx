import { useState } from 'react';
import { ScrollView, Text, View, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAtom } from 'jotai';
import { atom } from 'jotai';
import { Button } from '@/components/ui';
import { ServiceList } from '@/components/barber/ServiceList';
import { AddressAutocomplete } from '@/components/booking';
import { useBarberProfile } from '@/features/barbers';
import type { IService } from '@/features/barbers';
import type { LocationType, IBookingForm } from '@/features/bookings';

// Shared state atom for the booking flow
export const bookingFormAtom = atom<IBookingForm>({});

export default function BookingFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    barberId?: string;
    serviceId?: string;
    serviceName?: string;
  }>();

  const [bookingForm, setBookingForm] = useAtom(bookingFormAtom);

  // Fetch barber profile to get available services
  const { data: barber, isLoading: isLoadingBarber } = useBarberProfile(params.barberId || '');

  // Form state
  const [selectedService, setSelectedService] = useState<IService | undefined>(() => {
    // If a serviceId was passed in params or stored in atom, pre-select it
    const preselectedId = params.serviceId || bookingForm.serviceId;
    if (preselectedId && barber?.services) {
      return barber.services.find((s) => s.id === preselectedId);
    }
    return undefined;
  });
  const [locationType, setLocationType] = useState<LocationType>(
    bookingForm.locationType || 'in_salon'
  );
  const [address, setAddress] = useState(bookingForm.address || '');
  const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | undefined>(
    bookingForm.addressCoords
  );
  const [specialRequests, setSpecialRequests] = useState(bookingForm.specialRequests || '');
  const [hairType, setHairType] = useState('');

  const handleServiceSelect = (service: IService) => {
    setSelectedService(service);
  };

  const handleContinue = () => {
    if (!selectedService) return;

    // Build specialRequests: combine hair type note (if any) with user's special requests
    let finalRequests = specialRequests;
    if (hairType.trim()) {
      const hairNote = `Hair type: ${hairType.trim()}`;
      finalRequests = finalRequests ? `${hairNote}\n${finalRequests}` : hairNote;
    }

    // Save form data to shared atom — aligned with backend schema
    setBookingForm({
      barberId: params.barberId,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      locationType,
      address: locationType === 'in_home' ? address : undefined,
      addressCoords: locationType === 'in_home' ? addressCoords : undefined,
      specialRequests: finalRequests || undefined,
      price: selectedService.price,
      duration: selectedService.duration,
    });

    // Navigate to schedule screen
    router.push('/booking/schedule');
  };

  const isValid =
    selectedService !== undefined && (locationType === 'in_salon' || address.length > 0);

  if (isLoadingBarber) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0066CC" />
        <Text className="text-gray-600 mt-4">Loading barber services...</Text>
      </View>
    );
  }

  const services = barber?.services ?? [];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Booking Details</Text>
        <Text className="text-gray-600">
          {barber?.businessName
            ? `Book with ${barber.businessName}`
            : 'Select service and preferences'}
        </Text>
      </View>

      <View className="p-6 space-y-6">
        {/* Service Selection */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-3">Select a Service</Text>
          {services.length > 0 ? (
            <ServiceList
              services={services}
              onServiceSelect={handleServiceSelect}
              selectedServiceId={selectedService?.id}
              variant="default"
            />
          ) : (
            <View className="bg-yellow-50 p-4 rounded-xl">
              <Text className="text-yellow-800 text-sm">
                This barber hasn't added any services yet.
              </Text>
            </View>
          )}
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
            <AddressAutocomplete
              value={address}
              onAddressSelect={(selectedAddress, coords) => {
                setAddress(selectedAddress);
                setAddressCoords(coords);
              }}
              placeholder="Enter your full address"
            />
          </View>
        )}

        {/* Hair Type (optional — not stored in backend, folded into specialRequests) */}
        <View>
          <Text className="text-lg font-semibold text-gray-900 mb-1">Hair Type (Optional)</Text>
          <Text className="text-sm text-gray-500 mb-3">
            Helps your barber prepare for your visit
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-900"
            placeholder="e.g., Straight, Wavy, Curly, Coily"
            value={hairType}
            onChangeText={setHairType}
          />
        </View>

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
