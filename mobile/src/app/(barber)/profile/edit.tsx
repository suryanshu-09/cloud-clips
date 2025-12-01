import { Text, View } from 'react-native';

export default function EditBarberProfileScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Edit Profile</Text>
        <Text className="text-gray-600">Update your barber profile and services</Text>
      </View>
      {/* TODO: Add barber profile edit form */}
    </View>
  );
}
