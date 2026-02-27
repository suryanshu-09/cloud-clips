import { useState } from 'react';
import { ScrollView, Text, View, Pressable, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { format } from 'date-fns';

import { Card, Button } from '@/components/ui';
import { EarningsChart } from '@/components/barber';
import { api } from '@convex/_generated/api';

// ── helpers ──────────────────────────────────────────────────────────────────

function formatTime(ts: number): string {
  return format(new Date(ts), 'h:mm a');
}

function formatCurrency(dollars: number): string {
  return `$${dollars.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'text-yellow-600',
  confirmed: 'text-blue-600',
  in_progress: 'text-green-600',
  completed: 'text-gray-500',
  cancelled: 'text-red-500',
  no_show: 'text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

// ── component ─────────────────────────────────────────────────────────────────

export default function BarberDashboardScreen() {
  const router = useRouter();
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);

  // Real-time data from Convex
  const stats = useQuery(api.barbers.queries.getBarberDashboardStats);
  const updateBarberProfile = useMutation(api.barbers.mutations.updateBarberProfile);

  const isLoading = stats === undefined;

  // ── availability toggle ───────────────────────────────────────────────────

  const handleAvailabilityToggle = async (value: boolean) => {
    if (isTogglingAvailability) return;
    setIsTogglingAvailability(true);
    try {
      await updateBarberProfile({ isAvailable: value });
    } catch (error) {
      console.error('Failed to update availability:', error);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  // ── loading state ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-gray-500 mt-3">Loading dashboard...</Text>
      </View>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  const weeklyChartData = stats?.weeklyEarningsChart ?? [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>

          {/* Availability Toggle */}
          <View className="flex-row items-center gap-2">
            {isTogglingAvailability ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <View
                className={`px-2 py-1 rounded-full ${
                  stats?.isAvailable ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    stats?.isAvailable ? 'text-green-700' : 'text-gray-500'
                  }`}
                >
                  {stats?.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            )}
            <Switch
              value={stats?.isAvailable ?? false}
              onValueChange={handleAvailabilityToggle}
              disabled={isTogglingAvailability}
              trackColor={{ false: '#d1d5db', true: '#a5b4fc' }}
              thumbColor={stats?.isAvailable ? '#6366f1' : '#9ca3af'}
            />
          </View>
        </View>
        <Text className="text-gray-600">
          {stats?.isAvailable
            ? 'You are accepting new appointments'
            : 'You are not accepting new appointments'}
        </Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Quick Stats Grid */}
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-gray-900">
                {stats?.todayCount ?? 0}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Today</Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-blue-600">
                {stats?.upcomingCount ?? 0}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">Upcoming</Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-2xl font-bold text-green-600">
                {stats?.completedThisWeekCount ?? 0}
              </Text>
              <Text className="text-xs text-gray-500 mt-1">This Week</Text>
            </Card>
          </View>

          {/* Weekly Earnings Chart */}
          <EarningsChart
            data={weeklyChartData}
            total={stats?.weeklyTotal ?? 0}
            period="week"
          />

          {/* Today's Appointments Widget */}
          <Card className="p-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-gray-900">Today's Appointments</Text>
              <Pressable onPress={() => router.push('/(barber)/appointments')}>
                <Text className="text-sm text-indigo-600 font-medium">View all</Text>
              </Pressable>
            </View>

            {!stats?.todayAppointments || stats.todayAppointments.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-3xl mb-2">📅</Text>
                <Text className="text-gray-500 text-sm">No appointments today</Text>
              </View>
            ) : (
              <View className="space-y-2">
                {stats.todayAppointments.map((apt) => (
                  <Pressable
                    key={apt._id}
                    onPress={() => router.push(`/(barber)/appointments/${apt._id}` as any)}
                    className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg active:bg-gray-100"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
                        <Text className="text-sm font-bold text-indigo-700">
                          {formatTime(apt.scheduledFor).split(':')[0]}
                        </Text>
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-900">
                          {formatTime(apt.scheduledFor)}
                        </Text>
                        <Text
                          className={`text-xs font-medium ${STATUS_COLORS[apt.status] ?? 'text-gray-500'}`}
                        >
                          {STATUS_LABELS[apt.status] ?? apt.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-400">›</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </Card>

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
                  <Text className="text-lg font-bold text-gray-900">
                    {(stats?.averageRating ?? 0).toFixed(1)}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    ({stats?.reviewCount ?? 0} reviews)
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">✅</Text>
                  <Text className="text-base text-gray-700">Completed This Week</Text>
                </View>
                <Text className="text-lg font-bold text-gray-900">
                  {stats?.completedThisWeekCount ?? 0}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Text className="text-2xl">💰</Text>
                  <Text className="text-base text-gray-700">This Week</Text>
                </View>
                <Text className="text-lg font-bold text-green-600">
                  {formatCurrency(stats?.weeklyTotal ?? 0)}
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
