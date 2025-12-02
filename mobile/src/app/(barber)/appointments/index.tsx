import { useState } from 'react';
import { ScrollView, Text, View, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Badge } from '@/components/ui';

type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
type FilterType = 'all' | 'today' | 'upcoming' | 'pending';

interface IAppointment {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  location: string;
}

// Mock data - replace with real data from API
const MOCK_APPOINTMENTS: IAppointment[] = [
  {
    id: '1',
    clientName: 'John Doe',
    service: 'Premium Haircut',
    date: '2025-12-01',
    time: '10:00 AM',
    duration: 45,
    price: 45,
    status: 'pending',
    location: 'Home Service',
  },
  {
    id: '2',
    clientName: 'Sarah Smith',
    service: 'Beard Trim',
    date: '2025-12-01',
    time: '2:00 PM',
    duration: 30,
    price: 25,
    status: 'confirmed',
    location: 'Salon',
  },
  {
    id: '3',
    clientName: 'Mike Johnson',
    service: 'Haircut & Styling',
    date: '2025-12-02',
    time: '11:00 AM',
    duration: 60,
    price: 60,
    status: 'confirmed',
    location: 'Home Service',
  },
  {
    id: '4',
    clientName: 'Emily Davis',
    service: 'Kids Haircut',
    date: '2025-12-02',
    time: '3:30 PM',
    duration: 30,
    price: 30,
    status: 'confirmed',
    location: 'Salon',
  },
];

export default function BarberAppointmentsListScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
  };

  const filteredAppointments = MOCK_APPOINTMENTS.filter((apt) => {
    if (filter === 'all') return true;
    if (filter === 'today') return apt.date === '2025-12-01';
    if (filter === 'upcoming') return apt.date >= '2025-12-01' && apt.status === 'confirmed';
    if (filter === 'pending') return apt.status === 'pending';
    return true;
  });

  const renderAppointmentCard = ({ item }: { item: IAppointment }) => (
    <Pressable onPress={() => router.push(`/(barber)/appointments/${item.id}`)}>
      <Card className="mb-3 p-4">
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">{item.clientName}</Text>
            <Text className="text-sm text-gray-600 mb-2">{item.service}</Text>
          </View>
          <Badge variant={getStatusBadgeVariant(item.status)} size="sm">
            {getStatusLabel(item.status)}
          </Badge>
        </View>

        <View className="space-y-2">
          <View className="flex-row items-center gap-2">
            <Text className="text-base">📅</Text>
            <Text className="text-sm text-gray-700">{item.date}</Text>
            <Text className="text-gray-400">•</Text>
            <Text className="text-sm text-gray-700">{item.time}</Text>
            <Text className="text-gray-400">•</Text>
            <Text className="text-sm text-gray-700">{item.duration} min</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <Text className="text-base">📍</Text>
            <Text className="text-sm text-gray-700">{item.location}</Text>
          </View>

          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-200">
            <Text className="text-base font-bold text-gray-900">${item.price}</Text>
            <Text className="text-sm text-blue-600 font-medium">View Details →</Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Appointments</Text>
        <Text className="text-gray-600">Manage your bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View className="bg-white px-6 py-3 border-b border-gray-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {(['all', 'today', 'upcoming', 'pending'] as FilterType[]).map((type) => (
              <Pressable
                key={type}
                onPress={() => setFilter(type)}
                className={`px-4 py-2 rounded-full ${
                  filter === type ? 'bg-blue-500' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    filter === type ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Appointments List */}
      <FlatList
        data={filteredAppointments}
        renderItem={renderAppointmentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24 }}
        ListEmptyComponent={
          <Card className="p-8 items-center">
            <Text className="text-6xl mb-4">📅</Text>
            <Text className="text-lg font-semibold text-gray-900 mb-2">No Appointments</Text>
            <Text className="text-sm text-gray-600 text-center">
              You don't have any {filter !== 'all' ? filter : ''} appointments at the moment.
            </Text>
          </Card>
        }
      />
    </View>
  );
}
