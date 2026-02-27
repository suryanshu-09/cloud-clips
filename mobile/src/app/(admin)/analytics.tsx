import { useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  Pressable,
  Dimensions,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card } from '@/components/ui';

// ── Types ────────────────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '90d';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatCompact = (amount: number) => {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface IPeriodSelectorProps {
  value: Period;
  onChange: (p: Period) => void;
}

function PeriodSelector({ value, onChange }: IPeriodSelectorProps) {
  const options: { label: string; value: Period }[] = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '90 Days', value: '90d' },
  ];
  return (
    <Card className="p-2 mb-4">
      <View className="flex-row gap-2">
        {options.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            className={`flex-1 py-2 px-3 rounded-lg ${
              value === opt.value ? 'bg-purple-600' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                value === opt.value ? 'text-white' : 'text-gray-600'
              }`}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

interface IBarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}

/**
 * Lightweight bar chart built with pure React Native Views.
 * No third-party charting library needed.
 */
function BarChart({
  data,
  color = 'bg-purple-500',
  valueFormatter = (v) => String(v),
  height = 160,
}: IBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const barAreaHeight = height - 32; // leave room for labels

  return (
    <View style={{ height }}>
      <View
        className="flex-row items-end justify-between"
        style={{ height: barAreaHeight }}
      >
        {data.map((item, index) => {
          const barHeight = Math.max((item.value / maxValue) * barAreaHeight, 3);
          const isEmpty = item.value === 0;
          return (
            <View key={index} className="flex-1 items-center justify-end px-0.5">
              {!isEmpty && (
                <Text className="text-xs text-gray-600 mb-0.5" numberOfLines={1}>
                  {valueFormatter(item.value)}
                </Text>
              )}
              <View
                className={`w-full rounded-t-sm ${isEmpty ? 'bg-gray-200' : color}`}
                style={{ height: barHeight }}
              />
            </View>
          );
        })}
      </View>
      {/* X-axis labels */}
      <View className="flex-row justify-between mt-1">
        {data.map((item, index) => (
          <Text
            key={index}
            className="flex-1 text-center text-xs text-gray-500"
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface IStackedBarChartProps {
  data: { label: string; clients: number; barbers: number }[];
  height?: number;
}

function StackedBarChart({ data, height = 160 }: IStackedBarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.clients + d.barbers), 1);
  const barAreaHeight = height - 32;

  return (
    <View style={{ height }}>
      <View className="flex-row items-end justify-between" style={{ height: barAreaHeight }}>
        {data.map((item, index) => {
          const total = item.clients + item.barbers;
          const totalHeight = Math.max((total / maxValue) * barAreaHeight, total > 0 ? 4 : 3);
          const clientHeight = total > 0 ? (item.clients / total) * totalHeight : 0;
          const barberHeight = total > 0 ? (item.barbers / total) * totalHeight : 0;

          return (
            <View key={index} className="flex-1 items-center justify-end px-0.5">
              {total > 0 && (
                <Text className="text-xs text-gray-600 mb-0.5">{total}</Text>
              )}
              <View className="w-full" style={{ height: Math.max(totalHeight, 3) }}>
                {/* Barbers segment (top) */}
                <View
                  className="w-full bg-purple-400 rounded-t-sm"
                  style={{ height: barberHeight }}
                />
                {/* Clients segment (bottom) */}
                <View className="w-full bg-blue-400" style={{ height: clientHeight }} />
              </View>
            </View>
          );
        })}
      </View>
      <View className="flex-row justify-between mt-1">
        {data.map((item, index) => (
          <Text
            key={index}
            className="flex-1 text-center text-xs text-gray-500"
            numberOfLines={1}
          >
            {item.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Booking Statistics Section ────────────────────────────────────────────────

function BookingStatisticsSection({ period }: { period: Period }) {
  const data = useQuery(api.getBookingStatistics, { period });

  if (!data) {
    return (
      <Card className="p-6 items-center">
        <ActivityIndicator color="#7c3aed" />
      </Card>
    );
  }

  const chartData = data.dailyData.map((d) => ({ label: d.label, value: d.count }));
  // Show fewer labels when there are many data points
  const displayData =
    chartData.length > 14
      ? chartData.filter((_, i) => i % 7 === 0 || i === chartData.length - 1)
      : chartData.length > 7
      ? chartData.filter((_, i) => i % 3 === 0 || i === chartData.length - 1)
      : chartData;

  const statusColors: Record<string, string> = {
    completed: 'bg-green-500',
    pending: 'bg-yellow-400',
    confirmed: 'bg-blue-500',
    cancelled: 'bg-red-400',
    in_progress: 'bg-orange-400',
    no_show: 'bg-gray-400',
  };

  return (
    <View className="space-y-4">
      {/* Summary */}
      <View className="flex-row gap-3">
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">Total Bookings</Text>
          <Text className="text-2xl font-bold text-gray-900">
            {data.totalBookings.toLocaleString()}
          </Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">Completion Rate</Text>
          <Text className="text-2xl font-bold text-green-600">{data.completionRate}%</Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">Cancellation Rate</Text>
          <Text className="text-2xl font-bold text-red-500">{data.cancellationRate}%</Text>
        </Card>
      </View>

      {/* Daily chart */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-4">Bookings Over Time</Text>
        <BarChart data={displayData} color="bg-blue-500" height={180} />
      </Card>

      {/* Status Breakdown */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">Bookings by Status</Text>
        <View className="space-y-2">
          {Object.entries(data.statusCounts).map(([status, count]) => {
            const pct =
              data.totalBookings > 0 ? (count / data.totalBookings) * 100 : 0;
            return (
              <View key={status}>
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-sm text-gray-700 capitalize">
                    {status.replace('_', ' ')}
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {count} ({pct.toFixed(1)}%)
                  </Text>
                </View>
                <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <View
                    className={`h-full rounded-full ${statusColors[status] ?? 'bg-gray-400'}`}
                    style={{ width: `${pct}%` }}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

// ── Revenue Charts Section ────────────────────────────────────────────────────

function RevenueChartsSection({ period }: { period: Period }) {
  const data = useQuery(api.getRevenueCharts, { period });

  if (!data) {
    return (
      <Card className="p-6 items-center">
        <ActivityIndicator color="#7c3aed" />
      </Card>
    );
  }

  const chartData = data.chartData.map((d) => ({
    label: d.label,
    value: d.amountDollars,
  }));
  const displayData =
    chartData.length > 14
      ? chartData.filter((_, i) => i % 7 === 0 || i === chartData.length - 1)
      : chartData.length > 7
      ? chartData.filter((_, i) => i % 3 === 0 || i === chartData.length - 1)
      : chartData;

  const totalForBreakdown =
    data.totalServiceRevenueDollars + data.totalProductRevenueDollars || 1;

  return (
    <View className="space-y-4">
      {/* Summary cards */}
      <View className="flex-row gap-3">
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">Gross Revenue</Text>
          <Text className="text-xl font-bold text-gray-900">
            {formatCompact(data.totalRevenueDollars)}
          </Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">Platform (15%)</Text>
          <Text className="text-xl font-bold text-purple-600">
            {formatCompact(data.platformRevenueDollars)}
          </Text>
        </Card>
      </View>

      {/* Revenue chart */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-4">Revenue Over Time</Text>
        <BarChart
          data={displayData}
          color="bg-green-500"
          valueFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`)}
          height={180}
        />
      </Card>

      {/* Revenue breakdown */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">Revenue Sources</Text>
        <View className="space-y-3">
          {/* Services */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-blue-500 rounded-sm" />
                <Text className="text-sm text-gray-700">Services</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.totalServiceRevenueDollars)}
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-blue-500 rounded-full"
                style={{
                  width: `${(data.totalServiceRevenueDollars / totalForBreakdown) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* Products */}
          <View>
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center gap-2">
                <View className="w-3 h-3 bg-green-500 rounded-sm" />
                <Text className="text-sm text-gray-700">Products</Text>
              </View>
              <Text className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.totalProductRevenueDollars)}
              </Text>
            </View>
            <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <View
                className="h-full bg-green-500 rounded-full"
                style={{
                  width: `${(data.totalProductRevenueDollars / totalForBreakdown) * 100}%`,
                }}
              />
            </View>
          </View>

          {/* Total */}
          <View className="pt-3 border-t border-gray-100 flex-row items-center justify-between">
            <Text className="text-sm font-bold text-gray-900">Total Gross</Text>
            <Text className="text-base font-bold text-gray-900">
              {formatCurrency(data.totalRevenueDollars)}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

// ── User Growth Section ───────────────────────────────────────────────────────

function UserGrowthSection({ period }: { period: Period }) {
  const data = useQuery(api.getUserGrowth, { period });

  if (!data) {
    return (
      <Card className="p-6 items-center">
        <ActivityIndicator color="#7c3aed" />
      </Card>
    );
  }

  const displayData =
    data.chartData.length > 14
      ? data.chartData.filter((_, i) => i % 7 === 0 || i === data.chartData.length - 1)
      : data.chartData.length > 7
      ? data.chartData.filter((_, i) => i % 3 === 0 || i === data.chartData.length - 1)
      : data.chartData;

  return (
    <View className="space-y-4">
      {/* Summary */}
      <View className="flex-row gap-3">
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">New Users</Text>
          <Text className="text-2xl font-bold text-gray-900">
            +{data.newUsersInPeriod}
          </Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">New Clients</Text>
          <Text className="text-2xl font-bold text-blue-600">
            +{data.newClientsInPeriod}
          </Text>
        </Card>
        <Card className="flex-1 p-4">
          <Text className="text-xs text-gray-500 mb-1">New Barbers</Text>
          <Text className="text-2xl font-bold text-purple-600">
            +{data.newBarbersInPeriod}
          </Text>
        </Card>
      </View>

      {/* Stacked bar chart */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-1">New Registrations</Text>
        <View className="flex-row items-center gap-4 mb-4">
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 bg-blue-400 rounded-sm" />
            <Text className="text-xs text-gray-500">Clients</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View className="w-3 h-3 bg-purple-400 rounded-sm" />
            <Text className="text-xs text-gray-500">Barbers</Text>
          </View>
        </View>
        <StackedBarChart data={displayData} height={180} />
      </Card>

      {/* All-time totals */}
      <Card className="p-4">
        <Text className="text-base font-semibold text-gray-900 mb-3">All-Time Totals</Text>
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Total Registered Users</Text>
            <Text className="text-sm font-bold text-gray-900">
              {data.allTimeTotal.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Total Clients</Text>
            <Text className="text-sm font-bold text-blue-600">
              {data.allTimeClients.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Total Barbers</Text>
            <Text className="text-sm font-bold text-purple-600">
              {data.allTimeBarbers.toLocaleString()}
            </Text>
          </View>
          <View className="flex-row items-center justify-between pt-2 border-t border-gray-100">
            <Text className="text-sm text-gray-600">Verified Barbers</Text>
            <Text className="text-sm font-bold text-teal-600">
              {data.activeVerifiedBarbers.toLocaleString()}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

// ── Popular Services Section ──────────────────────────────────────────────────

type ServicePeriod = '7d' | '30d' | '90d' | 'all';

function PopularServicesSection() {
  const [servicePeriod, setServicePeriod] = useState<ServicePeriod>('30d');

  const data = useQuery(api.getPopularServices, {
    period: servicePeriod,
    limit: 10,
  });

  if (!data) {
    return (
      <Card className="p-6 items-center">
        <ActivityIndicator color="#7c3aed" />
      </Card>
    );
  }

  const maxCount = Math.max(...data.services.map((s) => s.bookingCount), 1);

  const periodOptions: { label: string; value: ServicePeriod }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: 'All', value: 'all' },
  ];

  return (
    <View className="space-y-4">
      {/* Period selector for services */}
      <Card className="p-2">
        <View className="flex-row gap-2">
          {periodOptions.map((opt) => (
            <Pressable
              key={opt.value}
              onPress={() => setServicePeriod(opt.value)}
              className={`flex-1 py-1.5 px-2 rounded-lg ${
                servicePeriod === opt.value ? 'bg-purple-600' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-center text-xs font-semibold ${
                  servicePeriod === opt.value ? 'text-white' : 'text-gray-600'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      {data.services.length === 0 ? (
        <Card className="p-6 items-center">
          <Text className="text-gray-500">No bookings in this period.</Text>
        </Card>
      ) : (
        <Card className="p-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            Top Services ({data.totalBookings.toLocaleString()} total bookings)
          </Text>
          <View className="space-y-4">
            {data.services.map((service, index) => {
              const barWidth = (service.bookingCount / maxCount) * 100;
              return (
                <View key={service.name}>
                  <View className="flex-row items-center justify-between mb-1">
                    <View className="flex-row items-center gap-2 flex-1">
                      <View className="w-6 h-6 bg-purple-100 rounded-full items-center justify-center">
                        <Text className="text-xs font-bold text-purple-700">
                          {index + 1}
                        </Text>
                      </View>
                      <Text
                        className="text-sm font-medium text-gray-800 flex-1"
                        numberOfLines={1}
                      >
                        {service.name}
                      </Text>
                    </View>
                    <View className="items-end ml-2">
                      <Text className="text-sm font-bold text-gray-900">
                        {service.bookingCount} bookings
                      </Text>
                      <Text className="text-xs text-green-600">
                        {formatCurrency(service.avgPriceDollars)} avg
                      </Text>
                    </View>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${barWidth}%` }}
                    />
                  </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-xs text-gray-400">
                      {service.completionRate}% completion
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {formatCurrency(service.totalRevenueDollars)} revenue
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

type Tab = 'bookings' | 'revenue' | 'users' | 'services';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'bookings', label: 'Bookings', icon: '📅' },
  { key: 'revenue', label: 'Revenue', icon: '💰' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'services', label: 'Services', icon: '✂️' },
];

export default function AdminAnalyticsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [period, setPeriod] = useState<Period>('30d');

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-6 pb-0 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900 mb-1">Analytics</Text>
        <Text className="text-gray-500 text-sm mb-4">Platform performance insights</Text>

        {/* Tab bar */}
        <View className="flex-row">
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 items-center border-b-2 ${
                activeTab === tab.key ? 'border-purple-600' : 'border-transparent'
              }`}
            >
              <Text className="text-base mb-0.5">{tab.icon}</Text>
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.key ? 'text-purple-700' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Period selector (not shown on services tab which has its own) */}
        {activeTab !== 'services' && (
          <PeriodSelector value={period} onChange={setPeriod} />
        )}

        {activeTab === 'bookings' && <BookingStatisticsSection period={period} />}
        {activeTab === 'revenue' && <RevenueChartsSection period={period} />}
        {activeTab === 'users' && <UserGrowthSection period={period} />}
        {activeTab === 'services' && <PopularServicesSection />}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
