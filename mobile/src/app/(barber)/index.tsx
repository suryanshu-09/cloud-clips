import { ScrollView, Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Button } from '@/components/ui';
import { EarningsChart } from '@/components/barber';

// Mock data - replace with real data from API
const MOCK_WEEKLY_EARNINGS = [
  { label: 'Mon', value: 120 },
  { label: 'Tue', value: 180 },
  { label: 'Wed', value: 240 },
  { label: 'Thu', value: 160 },
  { label: 'Fri', value: 280 },
  { label: 'Sat', value: 320 },
  { label: 'Sun', value: 200 },
];

const MOCK_STATS = {
  todayAppointments: 5,
  upcomingAppointments: 12,
  completedThisWeek: 18,
  weeklyEarnings: 1500,
  pendingReviews: 3,
  totalReviews: 127,
  rating: 4.8,
};

export default function BarberDashboardScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Dashboard</Text>
        <Text className="text-gray-600">Welcome back! Here's your overview</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Quick Stats Grid */}
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-gray-900">
                {MOCK_STATS.todayAppointments}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Today</Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-blue-600">
                {MOCK_STATS.upcomingAppointments}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">Upcoming</Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-green-600">
                {MOCK_STATS.completedThisWeek}
              </Text>
              <Text className="text-sm text-gray-600 mt-1">This Week</Text>
            </Card>
          </View>

          {/* Earnings Chart */}
          <EarningsChart
            data={MOCK_WEEKLY_EARNINGS}
            total={MOCK_STATS.weeklyEarnings}
            period="week"
          />

          {/* Quick Actions */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
            <View className="space-y-2">
              <Pressable
                onPress={() => router.push('/(barber)/appointments')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                    <Text className="text-xl">📅</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Manage Appointments</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/schedule')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                    <Text className="text-xl">🕒</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Update Schedule</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/products')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                    <Text className="text-xl">🛍️</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Manage Products</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/profile')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                    <Text className="text-xl">👤</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Edit Profile</Text>
                </View>
                <Text className="text-gray-400">›</Text>
              </Pressable>
            </View>
          </Card>

          {/* Performance Overview */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Performance</Text>
            <View className="space-y-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">⭐</Text>
                  <Text className="text-base text-gray-700">Rating</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-lg font-bold text-gray-900">{MOCK_STATS.rating}</Text>
                  <Text className="text-sm text-gray-500">({MOCK_STATS.totalReviews} reviews)</Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">💬</Text>
                  <Text className="text-base text-gray-700">Pending Reviews</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">{MOCK_STATS.pendingReviews}</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">💰</Text>
                  <Text className="text-base text-gray-700">This Week</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">
                  ${MOCK_STATS.weeklyEarnings}
                </Text>
              </View>
            </View>
          </Card>

          {/* Earnings Button */}
          <Button variant="outline" onPress={() => router.push('/(barber)/earnings')}>
            View Detailed Earnings
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
