import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function BarberAppointmentDetailsScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-white">
      <View className="p-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Appointment Details</Text>
        <Text className="text-gray-600">Appointment ID: {id}</Text>
      </View>
      {/* TODO: Add appointment details with accept/reject actions */}
    </View>
  );
}
