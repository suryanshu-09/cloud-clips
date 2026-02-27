import { useState, useEffect } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeView } from '@/components/ui/SafeView';
import { Header } from '@/components/ui/Header';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const ALL_SPECIALTIES = [
  'Classic Cuts',
  'Fade Haircuts',
  'Beard Styling',
  'Hot Towel Shave',
  'Hair Coloring',
  'Kids Haircut',
  'Modern Styles',
  'Traditional Barbering',
  'Fades',
  'Tapers',
  'Locs & Twists',
  'Line-ups',
  'Perms',
  'Highlights',
];

interface IFormState {
  businessName: string;
  businessDescription: string;
  specialties: string[];
  offersInHomeService: boolean;
  inHomeServiceRadius: string;
  timezone: string;
}

export default function BusinessInfoScreen() {
  const router = useRouter();
  const profile = useQuery(api.barbers.queries.getBarberProfile);
  const updateProfile = useMutation(api.barbers.mutations.updateBarberProfile);

  const [form, setForm] = useState<IFormState>({
    businessName: '',
    businessDescription: '',
    specialties: [],
    offersInHomeService: false,
    inHomeServiceRadius: '',
    timezone: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        businessName: profile.businessName || '',
        businessDescription: profile.businessDescription || '',
        specialties: profile.specialties || [],
        offersInHomeService: profile.offersInHomeService || false,
        inHomeServiceRadius: profile.inHomeServiceRadius?.toString() || '',
        timezone: profile.timezone || '',
      });
    }
  }, [profile]);

  const update = (fields: Partial<IFormState>) => {
    setForm((prev) => ({ ...prev, ...fields }));
    setHasChanges(true);
  };

  const toggleSpecialty = (specialty: string) => {
    const updated = form.specialties.includes(specialty)
      ? form.specialties.filter((s) => s !== specialty)
      : [...form.specialties, specialty];
    update({ specialties: updated });
  };

  const handleSave = async () => {
    if (!form.businessName.trim()) {
      Alert.alert('Validation Error', 'Business name is required.');
      return;
    }

    try {
      setIsSaving(true);
      await updateProfile({
        businessName: form.businessName.trim(),
        businessDescription: form.businessDescription.trim() || undefined,
        specialties: form.specialties.length > 0 ? form.specialties : undefined,
        offersInHomeService: form.offersInHomeService,
        inHomeServiceRadius:
          form.offersInHomeService && form.inHomeServiceRadius
            ? parseFloat(form.inHomeServiceRadius)
            : undefined,
        timezone: form.timezone.trim() || undefined,
      });
      setHasChanges(false);
      Alert.alert('Saved', 'Business info updated successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  if (profile === undefined) {
    return (
      <SafeView>
        <Header title="Business Info" showBack />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeView>
    );
  }

  return (
    <SafeView>
      <Header title="Business Info" showBack />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-gray-50" keyboardShouldPersistTaps="handled">
          {/* Business Identity */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">Business Identity</Text>

            <View className="mb-4">
              <Input
                label="Business Name *"
                placeholder="Elite Barber Studio"
                value={form.businessName}
                onChangeText={(t) => update({ businessName: t })}
              />
            </View>

            <View>
              <Input
                label="Business Description"
                placeholder="Tell clients about your shop, your style, and what makes you unique..."
                value={form.businessDescription}
                onChangeText={(t) => update({ businessDescription: t })}
                multiline
                numberOfLines={5}
                style={{ height: 120, textAlignVertical: 'top' }}
              />
            </View>
          </View>

          {/* Specialties */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-1">Specialties</Text>
            <Text className="text-sm text-gray-500 mb-4">
              Select all that apply. These help clients find you.
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_SPECIALTIES.map((specialty) => {
                const selected = form.specialties.includes(specialty);
                return (
                  <Pressable
                    key={specialty}
                    onPress={() => toggleSpecialty(specialty)}
                    className={`px-3 py-2 rounded-full border ${
                      selected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        selected ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      {specialty}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* In-Home Service */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              In-Home Service
            </Text>

            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text className="text-sm font-medium text-gray-900">Offer Home Visits</Text>
                <Text className="text-xs text-gray-500 mt-0.5">
                  Travel to clients' homes to provide services
                </Text>
              </View>
              <Switch
                value={form.offersInHomeService}
                onValueChange={(val) => update({ offersInHomeService: val })}
                trackColor={{ false: '#d1d5db', true: '#6366f1' }}
                thumbColor="#ffffff"
              />
            </View>

            {form.offersInHomeService && (
              <Input
                label="Service Radius (miles)"
                placeholder="10"
                value={form.inHomeServiceRadius}
                onChangeText={(t) => update({ inHomeServiceRadius: t })}
                keyboardType="decimal-pad"
                helperText="Maximum distance you'll travel for home visits"
              />
            )}
          </View>

          {/* Timezone */}
          <View className="bg-white mx-4 mt-4 rounded-xl p-4 border border-gray-100">
            <Text className="text-base font-semibold text-gray-900 mb-4">Settings</Text>
            <Input
              label="Timezone"
              placeholder="America/New_York"
              value={form.timezone}
              onChangeText={(t) => update({ timezone: t })}
              helperText="Used to display appointment times correctly (e.g. America/Los_Angeles)"
            />
          </View>

          {/* Info tip */}
          <View className="mx-4 mt-4 mb-8 bg-indigo-50 rounded-xl p-4 flex-row">
            <Ionicons name="information-circle-outline" size={20} color="#6366f1" />
            <Text className="text-sm text-indigo-700 ml-2 flex-1">
              Keep your business info up to date to attract more clients. A detailed profile
              with specialties helps you appear in the right searches.
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
            Save Changes
          </Button>
          {!hasChanges && (
            <Text className="text-center text-gray-400 text-xs mt-2">No changes to save</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeView>
  );
}
