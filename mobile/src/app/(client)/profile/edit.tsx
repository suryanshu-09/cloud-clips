import { Text, View } from 'react-native';

export default function EditProfileScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</Text>
        <Text className="text-gray-600">Update your information</Text>
      </View>
      {/* TODO: Add profile edit form */}
    </View>
  );
}
