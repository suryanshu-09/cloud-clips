import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useBarberProfile } from '@/features/barbers/hooks/useBarberProfile';
import { barberService } from '@/features/barbers/services/barberService';
import { authService } from '@/features/auth/services/authService';
import { Card, Button, Input, Avatar } from '@/components/ui';
import type { IBarberUpdateData, ServiceLocation } from '@/features/barbers/types';

const SPECIALTIES = [
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
];

const SERVICE_LOCATIONS = [
  { id: 'in_home' as ServiceLocation, label: 'Home Service', icon: '...' },
  { id: 'in_salon' as ServiceLocation, label: 'At Salon', icon: '...' },
];

interface IFormData {
  name: string;
  businessName: string;
  email: string;
  phone: string;
  bio: string;
  experience: number;
  address: string;
  specialties: string[];
  serviceLocations: ServiceLocation[];
}

export default function EditBarberProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, user } = useAuth();

  // Fetch barber profile data
  const { data: barberProfile, isLoading: isLoadingProfile } = useBarberProfile(
    currentUser?.id || ''
  );

  const userData = user || currentUser;

  const [formData, setFormData] = useState<IFormData>({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    bio: '',
    experience: 0,
    address: '',
    specialties: [],
    serviceLocations: [],
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data when data is available
  useEffect(() => {
    if (userData || barberProfile) {
      setFormData({
        name: userData?.name || '',
        businessName: barberProfile?.businessName || '',
        email: userData?.email || '',
        phone: userData?.phone || '',
        bio: barberProfile?.bio || '',
        experience: barberProfile?.experience || 0,
        address: barberProfile?.location?.address || '',
        specialties: barberProfile?.specialties || [],
        serviceLocations: barberProfile?.serviceLocations || [],
      });
    }
  }, [userData, barberProfile]);

  // Update user profile mutation (for name, phone)
  const updateUserMutation = useMutation({
    mutationFn: (updates: { name?: string; phone?: string }) => authService.updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Update barber profile mutation
  const updateBarberMutation = useMutation({
    mutationFn: (data: IBarberUpdateData) => barberService.updateBarberProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber', currentUser?.id] });
    },
  });

  const isSubmitting = updateUserMutation.isPending || updateBarberMutation.isPending;

  const toggleSpecialty = (specialty: string) => {
    setHasChanges(true);
    if (formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter((s) => s !== specialty),
      });
    } else {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
  };

  const toggleServiceLocation = (locationId: ServiceLocation) => {
    setHasChanges(true);
    if (formData.serviceLocations.includes(locationId)) {
      setFormData({
        ...formData,
        serviceLocations: formData.serviceLocations.filter((l) => l !== locationId),
      });
    } else {
      setFormData({
        ...formData,
        serviceLocations: [...formData.serviceLocations, locationId],
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    if (formData.specialties.length === 0) {
      Alert.alert('Error', 'Please select at least one specialty');
      return;
    }

    if (formData.serviceLocations.length === 0) {
      Alert.alert('Error', 'Please select at least one service location');
      return;
    }

    try {
      // Update user profile (name, phone)
      await updateUserMutation.mutateAsync({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
      });

      // Update barber profile
      await updateBarberMutation.mutateAsync({
        businessName: formData.businessName.trim(),
        bio: formData.bio.trim(),
        experience: formData.experience,
        specialties: formData.specialties,
        serviceLocations: formData.serviceLocations,
        location: formData.address
          ? {
              type: 'Point',
              coordinates: barberProfile?.location?.coordinates || [0, 0],
              address: formData.address.trim(),
            }
          : undefined,
      });

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    }
  };

  if (isLoadingProfile) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</Text>
        <Text className="text-gray-600">Update your barber profile and services</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Profile Photo */}
          <Card className="p-4 items-center">
            <Avatar
              size="xl"
              source={userData?.profileImage}
              fallback={formData.name.charAt(0) || 'B'}
            />
            <Button variant="outline" size="sm" className="mt-4">
              Change Photo
            </Button>
            <Text className="text-xs text-gray-500 mt-2">Photo upload coming soon</Text>
          </Card>

          {/* Basic Information */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Basic Information</Text>
            <View className="space-y-3">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Full Name *</Text>
                <Input
                  placeholder="John Smith"
                  value={formData.name}
                  onChangeText={(text) => {
                    setHasChanges(true);
                    setFormData({ ...formData, name: text });
                  }}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Business Name</Text>
                <Input
                  placeholder="Elite Barber Studio"
                  value={formData.businessName}
                  onChangeText={(text) => {
                    setHasChanges(true);
                    setFormData({ ...formData, businessName: text });
                  }}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                <Input
                  placeholder="john@example.com"
                  value={formData.email}
                  editable={false}
                  className="bg-gray-100"
                />
                <Text className="text-xs text-gray-500 mt-1">Email cannot be changed</Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number *</Text>
                <Input
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChangeText={(text) => {
                    setHasChanges(true);
                    setFormData({ ...formData, phone: text });
                  }}
                  keyboardType="phone-pad"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Bio</Text>
                <Input
                  placeholder="Tell clients about yourself and your expertise"
                  value={formData.bio}
                  onChangeText={(text) => {
                    setHasChanges(true);
                    setFormData({ ...formData, bio: text });
                  }}
                  multiline
                  numberOfLines={4}
                  style={{ height: 100, textAlignVertical: 'top' }}
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Years of Experience</Text>
                <Input
                  placeholder="10"
                  value={formData.experience.toString()}
                  onChangeText={(text) => {
                    setHasChanges(true);
                    setFormData({ ...formData, experience: parseInt(text) || 0 });
                  }}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </Card>

          {/* Location */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Business Address</Text>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Address</Text>
              <Input
                placeholder="123 Main St, New York, NY 10001"
                value={formData.address}
                onChangeText={(text) => {
                  setHasChanges(true);
                  setFormData({ ...formData, address: text });
                }}
                multiline
                numberOfLines={2}
              />
            </View>
          </Card>

          {/* Specialties */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Specialties *</Text>
            <Text className="text-sm text-gray-600 mb-3">Select your areas of expertise</Text>
            <View className="flex-row flex-wrap gap-2">
              {SPECIALTIES.map((specialty) => (
                <Pressable
                  key={specialty}
                  onPress={() => toggleSpecialty(specialty)}
                  className={`px-4 py-2 rounded-full ${
                    formData.specialties.includes(specialty) ? 'bg-blue-500' : 'bg-gray-100'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.specialties.includes(specialty) ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {specialty}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Service Locations */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Service Locations *</Text>
            <Text className="text-sm text-gray-600 mb-3">Where do you provide services?</Text>
            <View className="space-y-2">
              {SERVICE_LOCATIONS.map((location) => (
                <Pressable
                  key={location.id}
                  onPress={() => toggleServiceLocation(location.id)}
                  className={`flex-row items-center gap-3 p-4 rounded-lg border-2 ${
                    formData.serviceLocations.includes(location.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <Text className="text-2xl">{location.icon}</Text>
                  <Text
                    className={`text-base font-medium flex-1 ${
                      formData.serviceLocations.includes(location.id)
                        ? 'text-blue-700'
                        : 'text-gray-900'
                    }`}
                  >
                    {location.label}
                  </Text>
                  <View
                    className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                      formData.serviceLocations.includes(location.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {formData.serviceLocations.includes(location.id) && (
                      <Text className="text-white text-xs">✓</Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Text className="text-sm text-gray-700">
              💡 Keep your profile up to date to attract more clients. A complete profile with
              accurate information helps clients find and book your services.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button onPress={handleSubmit} disabled={isSubmitting || !hasChanges} size="lg">
          {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
        </Button>
        {!hasChanges && (
          <Text className="text-center text-gray-500 text-sm mt-2">No changes to save</Text>
        )}
      </View>
    </View>
  );
}
