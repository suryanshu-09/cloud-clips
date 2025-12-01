import { Text, View } from 'react-native';

export default function OffersScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Offers & Coupons</Text>
        <Text className="text-gray-600">Create and manage special offers</Text>
      </View>
      {/* TODO: Add coupon creation and management */}
    </View>
  );
}
