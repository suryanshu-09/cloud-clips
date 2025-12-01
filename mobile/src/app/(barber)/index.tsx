import { Text, View } from 'react-native';

export default function BarberDashboardScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Dashboard</Text>
        <Text className="text-gray-600">Welcome back! Here's your overview</Text>
      </View>
      {/* TODO: Add dashboard stats and charts */}
    </View>
  );
}
