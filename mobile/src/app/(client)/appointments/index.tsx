import { Text, View } from 'react-native';

export default function AppointmentsListScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">My Appointments</Text>
        <Text className="text-gray-600">Upcoming and past appointments</Text>
      </View>
      {/* TODO: Add appointments list */}
    </View>
  );
}
