import { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { locationService } from '@/features/location/services/locationService';

interface ILocationForm {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  lat: string;
  lng: string;
}

export default function LocationManagementScreen() {
  const router = useRouter();
  const profile = useQuery(api.barbers.queries.getBarberProfile);
  const updateProfile = useMutation(api.barbers.mutations.updateBarberProfile);

  const [form, setForm] = useState<ILocationForm>({
    address: '',
    city: '',
    state: '',
    zipCode: '',
    lat: '',
    lng: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (profile?.location) {
      const loc = profile.location;
      setForm({
        address: loc.address || '',
        city: loc.city || '',
        state: loc.state || '',
        zipCode: loc.zipCode || '',
        lat: loc.lat?.toString() || '',
        lng: loc.lng?.toString() || '',
      });
    }
  }, [profile]);

  const update = (fields: Partial<ILocationForm>) => {
    setForm((prev) => ({ ...prev, ...fields }));
    setHasChanges(true);
  };

  // Debounced geocode when address fields change
  const handleAddressChange = (fields: Partial<ILocationForm>) => {
    update(fields);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      const next = { ...form, ...fields };
      const fullAddress = [next.address, next.city, next.state, next.zipCode]
        .filter(Boolean)
        .join(', ');
      if (fullAddress.length > 10) {
        geocodeFromAddress(fullAddress);
      }
    }, 800);
  };

  const geocodeFromAddress = async (addressStr: string) => {
    try {
      setIsGeocoding(true);
      const results = await locationService.geocodeAddress(addressStr);
      if (results.length > 0) {
        setForm((prev) => ({
          ...prev,
          lat: results[0].latitude.toFixed(6),
          lng: results[0].longitude.toFixed(6),
        }));
      }
    } catch {
      // Silent fail — user can set coords manually
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setIsGeolocating(true);
      const perm = await locationService.requestPermissions();
      if (!perm.granted) {
        Alert.alert(
          'Permission Required',
          'Location permission is needed to detect your current position.'
        );
        return;
      }

      const loc = await locationService.getHighAccuracyLocation();
      const reversed = await locationService.reverseGeocode({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      setForm((prev) => ({
        ...prev,
        lat: loc.latitude.toFixed(6),
        lng: loc.longitude.toFixed(6),
        address: reversed
          ? [reversed.streetNumber, reversed.street].filter(Boolean).join(' ')
          : prev.address,
        city: reversed?.city || prev.city,
        state: reversed?.region || prev.state,
        zipCode: reversed?.postalCode || prev.zipCode,
      }));
      setHasChanges(true);
    } catch (err: any) {
      Alert.alert('Location Error', err.message || 'Failed to get current location.');
    } finally {
      setIsGeolocating(false);
    }
  };

  const handleSave = async () => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);

    if (!form.address.trim()) {
      Alert.alert('Validation Error', 'Street address is required.');
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert(
        'Validation Error',
        'Valid coordinates are required. Use "Detect Location" or enter them manually.'
      );
      return;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      Alert.alert('Validation Error', 'Coordinates are out of valid range.');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        location: {
          lat,
          lng,
          address: form.address.trim(),
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          zipCode: form.zipCode.trim() || undefined,
        },
      });
      setHasChanges(false);
      Alert.alert('Saved', 'Location updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save location.');
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <SafeView>
        <Header title="Location" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeView>
    );
  }

  const hasCoordinates = !!form.lat && !!form.lng && !isNaN(parseFloat(form.lat));

  return (
    <SafeView>
      <Header title="Location" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
          {/* Detect location */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-2">
              Detect Current Location
            </Text>
            <Text className="text-sm text-gray-500 mb-4">
              Use your device's GPS to automatically fill in your location.
            </Text>
            <Pressable
              onPress={handleUseCurrentLocation}
              disabled={isGeolocating}
              className="flex-row items-center justify-center py-3 rounded-xl bg-indigo-600 active:bg-indigo-700 disabled:opacity-50"
            >
              {isGeolocating ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Detecting...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={18} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">Use My Current Location</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Address form */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              Business Address
            </Text>

            <View className="mb-4">
              <Input
                label="Street Address *"
                placeholder="123 Main Street"
                value={form.address}
                onChangeText={(t) => handleAddressChange({ address: t })}
              />
            </View>

            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Input
                  label="City"
                  placeholder="New York"
                  value={form.city}
                  onChangeText={(t) => handleAddressChange({ city: t })}
                />
              </View>
              <View className="w-24">
                <Input
                  label="State"
                  placeholder="NY"
                  value={form.state}
                  onChangeText={(t) => handleAddressChange({ state: t })}
                  autoCapitalize="characters"
                  maxLength={2}
                />
              </View>
            </View>

            <Input
              label="ZIP Code"
              placeholder="10001"
              value={form.zipCode}
              onChangeText={(t) => handleAddressChange({ zipCode: t })}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          {/* Coordinates */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base font-semibold text-gray-900">Coordinates</Text>
              {isGeocoding && (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text className="text-xs text-indigo-600 ml-1">Looking up...</Text>
                </View>
              )}
              {hasCoordinates && !isGeocoding && (
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text className="text-xs text-green-600 ml-1">Verified</Text>
                </View>
              )}
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Input
                  label="Latitude"
                  placeholder="40.712776"
                  value={form.lat}
                  onChangeText={(t) => update({ lat: t })}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Input
                  label="Longitude"
                  placeholder="-74.005974"
                  value={form.lng}
                  onChangeText={(t) => update({ lng: t })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-2">
              Coordinates are filled automatically when you type an address or use GPS detection.
              You can also enter them manually.
            </Text>
          </View>

          {/* Map preview placeholder */}
          {hasCoordinates && (
            <View className="bg-white mx-4 mt-4 rounded-xl overflow-hidden border border-gray-100">
              <View className="bg-indigo-50 h-32 items-center justify-center">
                <Ionicons name="map-outline" size={32} color="#6366f1" />
                <Text className="text-sm text-indigo-600 font-medium mt-2">
                  {parseFloat(form.lat).toFixed(4)}, {parseFloat(form.lng).toFixed(4)}
                </Text>
                <Text className="text-xs text-gray-500 mt-1">Coordinates set</Text>
              </View>
            </View>
          )}

          {/* Tip */}
          <View className="mx-4 mt-4 mb-8 bg-amber-50 rounded-xl p-4 flex-row">
            <Ionicons name="bulb-outline" size={20} color="#d97706" />
            <Text className="text-sm text-amber-700 ml-2 flex-1">
              Your location is used to display your shop on the map for nearby clients.
              Make sure the address is accurate to ensure correct placement.
            </Text>
          </View>
        </ScrollView>

        {/* Save button */}
        <View className="bg-white px-4 py-4 border-t border-gray-100">
          <Button
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
            loading={isSaving}
          >
            Save Location
          </Button>
          {!hasChanges && (
            <Text className="text-center text-gray-400 text-xs mt-2">No changes to save</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
