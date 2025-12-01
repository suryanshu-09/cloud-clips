import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Edit Product</Text>
        <Text className="text-gray-600">Product ID: {id}</Text>
      </View>
      {/* TODO: Add product edit form */}
    </View>
  );
}
