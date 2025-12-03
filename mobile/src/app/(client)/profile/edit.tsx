import { useState, useEffect, useCallback } from 'react';
import { ScrollView, Text, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { authService } from '@/features/auth/services/authService';
import { Card, Button, Input, Avatar } from '@/components/ui';
import {
  mediaService,
  pickImageFromCamera,
  pickImageFromGallery,
  showImagePickerOptions,
  IUploadProgress,
} from '@/services/media';
import type { IAuthUser } from '@/features/auth/types';

interface IProfileFormData {
  name: string;
  phone: string;
  email: string;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser, user } = useAuth();

  // Use either the fetched user data or the current user from atom
  const userData = user || currentUser;

  const [formData, setFormData] = useState<IProfileFormData>({
    name: '',
    phone: '',
    email: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form data when user data is available
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        email: userData.email || '',
      });
    }
  }, [userData]);

  // Track changes
  useEffect(() => {
    if (userData) {
      const changed =
        formData.name !== (userData.name || '') ||
        formData.phone !== (userData.phone || '') ||
        avatarUri !== null;
      setHasChanges(changed);
    }
  }, [formData, userData, avatarUri]);

  // Handle avatar upload progress
  const handleUploadProgress = useCallback((progress: IUploadProgress) => {
    setUploadProgress(progress.progress);
  }, []);

  // Handle picking image from camera
  const handleCameraPress = async () => {
    try {
      const image = await pickImageFromCamera({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (image) {
        setAvatarUri(image.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to access camera');
    }
  };

  // Handle picking image from gallery
  const handleGalleryPress = async () => {
    try {
      const image = await pickImageFromGallery({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (image) {
        setAvatarUri(image.uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to access photo library');
    }
  };

  // Show image picker options
  const handleChangePhoto = () => {
    showImagePickerOptions(handleCameraPress, handleGalleryPress);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (updates: Partial<IAuthUser>) => authService.updateProfile(updates),
    onSuccess: () => {
      // Invalidate auth queries to refresh user data
      queryClient.invalidateQueries({ queryKey: ['auth'] });

      Alert.alert('Success', 'Profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    },
  });

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

    // Phone validation (simple check)
    const phoneRegex = /^\+?[\d\s-]{10,}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    try {
      let profileImageUrl = userData?.profileImage;

      // Upload avatar if changed
      if (avatarUri) {
        setIsUploading(true);
        setUploadProgress(0);

        try {
          const uploadResult = await mediaService.uploadAvatar(avatarUri, {
            onProgress: handleUploadProgress,
          });
          profileImageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Avatar upload error:', uploadError);
          Alert.alert('Error', 'Failed to upload photo. Please try again.');
          setIsUploading(false);
          return;
        }

        setIsUploading(false);
      }

      updateProfileMutation.mutate({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        profileImage: profileImageUrl,
      });
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  if (!userData) {
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
        <Text className="text-gray-600">Update your personal information</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Profile Photo */}
          <Card className="p-4 items-center">
            <Avatar
              size="xl"
              source={avatarUri || userData.profileImage}
              fallback={formData.name.charAt(0) || 'U'}
            />
            {isUploading && (
              <View className="mt-2 w-full px-4">
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </View>
                <Text className="text-xs text-gray-500 text-center mt-1">
                  Uploading... {Math.round(uploadProgress)}%
                </Text>
              </View>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onPress={handleChangePhoto}
              disabled={isUploading}
            >
              {avatarUri ? 'Change Selected Photo' : 'Change Photo'}
            </Button>
            {avatarUri && (
              <Pressable onPress={() => setAvatarUri(null)}>
                <Text className="text-xs text-red-500 mt-2">Remove selected photo</Text>
              </Pressable>
            )}
          </Card>

          {/* Basic Information */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-4">Personal Information</Text>
            <View className="space-y-4">
              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Full Name *</Text>
                <Input
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  autoCapitalize="words"
                />
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                <Input
                  placeholder="Email address"
                  value={formData.email}
                  editable={false}
                  className="bg-gray-100"
                />
                <Text className="text-xs text-gray-500 mt-1">
                  Email cannot be changed. Contact support if needed.
                </Text>
              </View>

              <View>
                <Text className="text-sm font-medium text-gray-700 mb-1">Phone Number *</Text>
                <Input
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </Card>

          {/* Account Info */}
          <Card className="p-4">
            <Text className="text-base font-semibold text-gray-900 mb-3">Account</Text>
            <View className="space-y-3">
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-sm text-gray-600">Account Type</Text>
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-sm font-medium text-blue-700 capitalize">
                    {userData.role}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between items-center py-2">
                <Text className="text-sm text-gray-600">Member ID</Text>
                <Text className="text-sm font-mono text-gray-700">
                  {userData.id.slice(0, 8)}...
                </Text>
              </View>
            </View>
          </Card>

          {/* Change Password Link */}
          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon.')}
          >
            <Card className="p-4 flex-row justify-between items-center">
              <View>
                <Text className="text-base font-medium text-gray-900">Change Password</Text>
                <Text className="text-sm text-gray-500">Update your account password</Text>
              </View>
              <Text className="text-gray-400 text-lg">{'>'}</Text>
            </Card>
          </Pressable>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View className="p-6 bg-white border-t border-gray-200">
        <Button
          onPress={handleSubmit}
          disabled={updateProfileMutation.isPending || isUploading || !hasChanges}
          size="lg"
        >
          {isUploading
            ? 'Uploading Photo...'
            : updateProfileMutation.isPending
              ? 'Saving Changes...'
              : 'Save Changes'}
        </Button>
        {!hasChanges && (
          <Text className="text-center text-gray-500 text-sm mt-2">No changes to save</Text>
        )}
      </View>
    </View>
  );
}
