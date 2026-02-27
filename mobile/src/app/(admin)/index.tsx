import { ScrollView, Text, View, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';

interface IStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
}

function StatCard({ label, value, icon, color, bgColor }: IStatCardProps) {
  return (
    <Card className="flex-1 p-4">
      <View className={`w-10 h-10 ${bgColor} rounded-full items-center justify-center mb-3`}>
        <Text className="text-xl">{icon}</Text>
      </View>
      <Text className={`text-2xl font-bold ${color}`}>{value}</Text>
      <Text className="text-xs text-gray-500 mt-1">{label}</Text>
    </Card>
  );
}

export default function AdminOverviewScreen() {
  const router = useRouter();
  const overview = useQuery(api.getAdminOverview, {});

  if (overview === undefined) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#7c3aed" />
        <Text className="text-gray-600 mt-3">Loading overview...</Text>
      </View>
    );
  }

  if (overview === null) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-xl font-bold text-gray-900 mb-2">Admin Access Only</Text>
        <Text className="text-gray-600 text-center">
          You need admin privileges to view this section.
        </Text>
      </View>
    );
  }

  const formatCurrency = (amount: number) =>
    `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <View className="flex-row items-center gap-2 mb-1">
          <Text className="text-2xl">🛡️</Text>
          <Text className="text-2xl font-bold text-gray-900">Admin Dashboard</Text>
        </View>
        <Text className="text-gray-600">Platform overview at a glance</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Users Row */}
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Users
          </Text>
          <View className="flex-row gap-3">
            <StatCard
              label="Total Users"
              value={overview.totalUsers.toLocaleString()}
              icon="👥"
              color="text-gray-900"
              bgColor="bg-gray-100"
            />
            <StatCard
              label="Clients"
              value={overview.totalClients.toLocaleString()}
              icon="👤"
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
            <StatCard
              label="Barbers"
              value={overview.totalBarbers.toLocaleString()}
              icon="✂️"
              color="text-purple-600"
              bgColor="bg-purple-100"
            />
          </View>

          <View className="flex-row gap-3">
            <StatCard
              label="New (30d)"
              value={`+${overview.newUsersThisMonth}`}
              icon="🆕"
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              label="Verified Barbers"
              value={overview.verifiedBarbersCount.toLocaleString()}
              icon="✅"
              color="text-teal-600"
              bgColor="bg-teal-100"
            />
          </View>

          {/* Bookings Row */}
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2">
            Bookings
          </Text>
          <View className="flex-row gap-3">
            <StatCard
              label="Total Bookings"
              value={overview.totalAppointments.toLocaleString()}
              icon="📅"
              color="text-gray-900"
              bgColor="bg-gray-100"
            />
            <StatCard
              label="Completed"
              value={overview.completedAppointments.toLocaleString()}
              icon="✔️"
              color="text-green-600"
              bgColor="bg-green-100"
            />
            <StatCard
              label="This Week"
              value={overview.appointmentsThisWeek.toLocaleString()}
              icon="📆"
              color="text-blue-600"
              bgColor="bg-blue-100"
            />
          </View>

          {/* Completion Rate */}
          <Card className="p-4">
            <Text className="text-sm text-gray-600 mb-2">Overall Completion Rate</Text>
            <View className="flex-row items-center gap-3">
              <View className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <View
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${overview.overallCompletionRate}%` }}
                />
              </View>
              <Text className="text-base font-bold text-gray-900">
                {overview.overallCompletionRate}%
              </Text>
            </View>
          </Card>

          {/* Revenue Row */}
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-2">
            Revenue (Last 30 Days)
          </Text>
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <Text className="text-xs text-gray-500 mb-1">Gross Revenue</Text>
              <Text className="text-xl font-bold text-gray-900">
                {formatCurrency(overview.totalRevenueThisMonthDollars)}
              </Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-xs text-gray-500 mb-1">Platform (15%)</Text>
              <Text className="text-xl font-bold text-purple-600">
                {formatCurrency(overview.platformRevenueThisMonthDollars)}
              </Text>
            </Card>
          </View>

          {/* Quick nav to analytics */}
          <Pressable
            onPress={() => router.push('/(admin)/analytics' as any)}
            className="bg-purple-600 rounded-xl p-4 items-center active:bg-purple-700"
          >
            <Text className="text-white font-bold text-base">View Detailed Analytics</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
