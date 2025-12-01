import { Text, View } from 'react-native';

export default function BarberAppointmentsListScreen() {
  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Appointments</Text>
        <Text className="text-gray-600">Manage your bookings</Text>
      </View>
      {/* TODO: Add appointments list for barber */}
    </View>
  );
}
