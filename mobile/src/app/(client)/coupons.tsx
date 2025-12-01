import { Text, View } from 'react-native';

export default function CouponsScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Coupons & Offers</Text>
        <Text className="text-gray-600">Save on your next appointment</Text>
      </View>
      {/* TODO: Add coupons list */}
    </View>
  );
}
