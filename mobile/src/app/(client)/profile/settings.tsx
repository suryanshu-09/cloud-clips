import { Text, View } from 'react-native';

export default function SettingsScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Settings</Text>
        <Text className="text-gray-600">Manage app preferences</Text>
      </View>
      {/* TODO: Add settings options */}
    </View>
  );
}
