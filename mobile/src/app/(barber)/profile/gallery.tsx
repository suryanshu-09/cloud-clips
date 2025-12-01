import { Text, View } from 'react-native';

export default function GalleryScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Portfolio Gallery</Text>
        <Text className="text-gray-600">Manage your work showcase</Text>
      </View>
      {/* TODO: Add gallery management */}
    </View>
  );
}
