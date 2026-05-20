import { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAtomValue } from 'jotai';
import { Card, Button, EarningsChart } from '@/components/ui';
import { useBarberDashboard } from '@/features/dashboard/hooks/useBarberDashboard';
import { userRoleAtom, isAuthenticatedAtom } from '@/store/atoms/authAtom';

function formatTime(ts: number): string {
  const d = new Date(ts);
  let hours = d.getUTCHours();
  const minutes = d.getUTCMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100',
  confirmed: 'bg-blue-100',
  in_progress: 'bg-green-100',
  completed: 'bg-gray-100',
  cancelled: 'bg-red-100',
  no_show: 'bg-red-100',
};

const STATUS_TEXT_COLORS: Record<string, string> = {
  pending: 'text-yellow-700',
  confirmed: 'text-blue-700',
  in_progress: 'text-green-700',
  completed: 'text-gray-700',
  cancelled: 'text-red-700',
  no_show: 'text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

function GuardedBarberDashboard() {
  const userRole = useAtomValue(userRoleAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  if (!isAuthenticated) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-lg text-gray-600 text-center">Please log in to continue</Text>
      </View>
    );
  }

  if (userRole !== 'barber') {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-lg text-gray-600 text-center">This screen is for barbers only</Text>
      </View>
    );
  }

  return <BarberDashboardContent />;
}

function BarberDashboardContent() {
  const router = useRouter();

  const {
    todayAppointments,
    todayCount,
    upcomingCount,
    pendingCount,
    completedThisWeek,
    weeklyEarningsData,
    weeklyEarningsTotal,
    averageRating,
    totalReviews,
    isAvailable,
    toggleAvailability,
    isLoading,
  } = useBarberDashboard();

  const [isToggling, setIsToggling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleToggleAvailability = useCallback(
    async (value: boolean) => {
      if (isToggling) return;
      setIsToggling(true);
      try {
        await toggleAvailability(value);
      } catch (error) {
        console.error('Failed to toggle availability:', error);
      } finally {
        setIsToggling(false);
      }
    },
    [toggleAvailability, isToggling]
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setRefreshing(false);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  const chartTotal = weeklyEarningsTotal;
  const chartTotalDollars = chartTotal / 100;

  const chartData = weeklyEarningsData.map((d) => ({
    label: d.label,
    value: Math.round(d.value / 100),
  }));

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
            <Text className="text-gray-500 mt-1">Here's your overview</Text>
          </View>

          <View className="items-center gap-1">
            <View className="flex-row items-center gap-2">
              {isToggling ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Switch
                  value={isAvailable}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: '#D1D5DB', true: '#BFDBFE' }}
                  thumbColor={isAvailable ? '#3B82F6' : '#9CA3AF'}
                />
              )}
            </View>
            <Text
              className={`text-xs font-semibold ${isAvailable ? 'text-blue-600' : 'text-gray-500'}`}
            >
              {isAvailable ? 'Available' : 'Unavailable'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 gap-4">
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4 items-center">
              <Text className="text-2xl font-bold text-gray-900">{todayCount}</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">Today</Text>
            </Card>
            <Card className="flex-1 p-4 items-center">
              <Text className="text-2xl font-bold text-blue-600">{upcomingCount}</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">Upcoming</Text>
            </Card>
            <Card className="flex-1 p-4 items-center">
              <Text className="text-2xl font-bold text-green-600">{completedThisWeek}</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">This Week</Text>
            </Card>
            <Card className="flex-1 p-4 items-center">
              <Text className="text-2xl font-bold text-yellow-600">{pendingCount}</Text>
              <Text className="text-xs text-gray-500 mt-1 text-center">Pending</Text>
            </Card>
          </View>

          <EarningsChart data={chartData} total={chartTotalDollars} period="week" />

          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">Today's Appointments</Text>
              <Pressable onPress={() => router.push('/(barber)/appointments')}>
                <Text className="text-sm text-blue-600 font-medium">See all</Text>
              </Pressable>
            </View>

            {todayAppointments.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-3xl mb-2">📅</Text>
                <Text className="text-gray-500 text-sm">No appointments today</Text>
              </View>
            ) : (
              <View className="gap-3">
                {todayAppointments.map((apt) => (
                  <Pressable
                    key={apt._id}
                    onPress={() => router.push(`/(barber)/appointments/${apt._id}`)}
                    className="flex-row items-center gap-3 p-3 bg-gray-50 rounded-xl active:bg-gray-100"
                  >
                    <View className="w-16 items-center">
                      <Text className="text-sm font-bold text-gray-900">
                        {formatTime(apt.scheduledFor)}
                      </Text>
                      <Text className="text-xs text-gray-400">{apt.duration}min</Text>
                    </View>

                    <View className="w-px h-10 bg-gray-200" />

                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-gray-900" numberOfLines={1}>
                        {apt.clientName}
                      </Text>
                      <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                        {apt.serviceName}
                      </Text>
                    </View>

                    <View
                      className={`px-2 py-1 rounded-full ${STATUS_COLORS[apt.status] ?? 'bg-gray-100'}`}
                    >
                      <Text
                        className={`text-xs font-medium ${STATUS_TEXT_COLORS[apt.status] ?? 'text-gray-700'}`}
                      >
                        {STATUS_LABELS[apt.status] ?? apt.status}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">Performance</Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">⭐</Text>
                  <Text className="text-base text-gray-700">Rating</Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Text className="text-lg font-bold text-gray-900">
                    {averageRating > 0 ? averageRating.toFixed(1) : '—'}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">💰</Text>
                  <Text className="text-base text-gray-700">This Week (net)</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">
                  {formatCurrency(weeklyEarningsTotal)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-xl">✂️</Text>
                  <Text className="text-base text-gray-700">Completed</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">{completedThisWeek}</Text>
              </View>
            </View>
          </Card>

          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
            <View className="gap-2">
              <Pressable
                onPress={() => router.push('/(barber)/appointments')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center">
                    <Text className="text-xl">📅</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Manage Appointments</Text>
                </View>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/schedule')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center">
                    <Text className="text-xl">🕒</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Update Schedule</Text>
                </View>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/products')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-purple-100 rounded-full items-center justify-center">
                    <Text className="text-xl">🛍️</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Manage Products</Text>
                </View>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push('/(barber)/profile')}
                className="flex-row items-center justify-between p-3 bg-gray-50 rounded-xl active:bg-gray-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center">
                    <Text className="text-xl">👤</Text>
                  </View>
                  <Text className="text-base font-medium text-gray-900">Edit Profile</Text>
                </View>
                <Text className="text-gray-400 text-lg">›</Text>
              </Pressable>
            </View>
          </Card>

          <Button variant="outline" onPress={() => router.push('/(barber)/earnings')}>
            View Detailed Earnings
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

export default GuardedBarberDashboard;
