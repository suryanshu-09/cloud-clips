import { Text, View } from 'react-native';

export default function BarberProductsListScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">My Products</Text>
        <Text className="text-gray-600">Manage products you sell</Text>
      </View>
      {/* TODO: Add products list with edit/delete actions */}
    </View>
  );
}
