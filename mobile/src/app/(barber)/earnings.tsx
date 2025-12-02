import { useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { Card } from '@/components/ui';
import { EarningsChart } from '@/components/barber';

type Period = 'week' | 'month' | 'year';

// Mock data - replace with real data from API
const MOCK_DATA = {
  week: {
    data: [
      { label: 'Mon', value: 120 },
      { label: 'Tue', value: 180 },
      { label: 'Wed', value: 240 },
      { label: 'Thu', value: 160 },
      { label: 'Fri', value: 280 },
      { label: 'Sat', value: 320 },
      { label: 'Sun', value: 200 },
    ],
    total: 1500,
  },
  month: {
    data: [
      { label: 'Week 1', value: 1200 },
      { label: 'Week 2', value: 1800 },
      { label: 'Week 3', value: 1500 },
      { label: 'Week 4', value: 2100 },
    ],
    total: 6600,
  },
  year: {
    data: [
      { label: 'Jan', value: 5200 },
      { label: 'Feb', value: 6100 },
      { label: 'Mar', value: 7300 },
      { label: 'Apr', value: 6800 },
      { label: 'May', value: 7500 },
      { label: 'Jun', value: 8200 },
      { label: 'Jul', value: 7900 },
      { label: 'Aug', value: 8600 },
      { label: 'Sep', value: 7400 },
      { label: 'Oct', value: 8100 },
      { label: 'Nov', value: 7800 },
      { label: 'Dec', value: 8500 },
    ],
    total: 89400,
  },
};

const BREAKDOWN = {
  haircuts: 45000,
  products: 12000,
  tips: 8400,
  other: 3000,
};

export default function EarningsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('week');

  const periodData = MOCK_DATA[selectedPeriod];
  const totalBreakdown = Object.values(BREAKDOWN).reduce((sum, val) => sum + val, 0);

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white p-6 border-b border-gray-200">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Earnings</Text>
        <Text className="text-gray-600">Track your income and performance</Text>
      </View>

      <ScrollView className="flex-1">
        <View className="p-6 space-y-4">
          {/* Period Selector */}
          <Card className="p-2">
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setSelectedPeriod('week')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedPeriod === 'week' ? 'bg-blue-500' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedPeriod === 'week' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Week
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedPeriod('month')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedPeriod === 'month' ? 'bg-blue-500' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedPeriod === 'month' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Month
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setSelectedPeriod('year')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  selectedPeriod === 'year' ? 'bg-blue-500' : 'bg-transparent'
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    selectedPeriod === 'year' ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  Year
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* Earnings Chart */}
          <EarningsChart data={periodData.data} total={periodData.total} period={selectedPeriod} />

          {/* Earnings Breakdown */}
          <Card className="p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Income Breakdown (Annual)
            </Text>
            <View className="space-y-3">
              {/* Haircuts */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center">
                      <Text className="text-sm">✂️</Text>
                    </View>
                    <Text className="text-base text-gray-700">Haircuts & Services</Text>
                  </View>
                  <Text className="text-base font-bold text-gray-900">
                    ${BREAKDOWN.haircuts.toLocaleString()}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-blue-500"
                    style={{ width: `${(BREAKDOWN.haircuts / totalBreakdown) * 100}%` }}
                  />
                </View>
              </View>

              {/* Products */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-green-100 rounded-full items-center justify-center">
                      <Text className="text-sm">🛍️</Text>
                    </View>
                    <Text className="text-base text-gray-700">Product Sales</Text>
                  </View>
                  <Text className="text-base font-bold text-gray-900">
                    ${BREAKDOWN.products.toLocaleString()}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-green-500"
                    style={{ width: `${(BREAKDOWN.products / totalBreakdown) * 100}%` }}
                  />
                </View>
              </View>

              {/* Tips */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-yellow-100 rounded-full items-center justify-center">
                      <Text className="text-sm">💰</Text>
                    </View>
                    <Text className="text-base text-gray-700">Tips</Text>
                  </View>
                  <Text className="text-base font-bold text-gray-900">
                    ${BREAKDOWN.tips.toLocaleString()}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-yellow-500"
                    style={{ width: `${(BREAKDOWN.tips / totalBreakdown) * 100}%` }}
                  />
                </View>
              </View>

              {/* Other */}
              <View>
                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="w-8 h-8 bg-purple-100 rounded-full items-center justify-center">
                      <Text className="text-sm">📊</Text>
                    </View>
                    <Text className="text-base text-gray-700">Other</Text>
                  </View>
                  <Text className="text-base font-bold text-gray-900">
                    ${BREAKDOWN.other.toLocaleString()}
                  </Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View
                    className="h-full bg-purple-500"
                    style={{ width: `${(BREAKDOWN.other / totalBreakdown) * 100}%` }}
                  />
                </View>
              </View>
            </View>

            {/* Total */}
            <View className="mt-4 pt-4 border-t border-gray-200">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-bold text-gray-900">Total Earnings</Text>
                <Text className="text-xl font-bold text-green-600">
                  ${totalBreakdown.toLocaleString()}
                </Text>
              </View>
            </View>
          </Card>

          {/* Stats */}
          <View className="flex-row gap-3">
            <Card className="flex-1 p-4">
              <Text className="text-sm text-gray-600 mb-1">Avg. per Service</Text>
              <Text className="text-2xl font-bold text-gray-900">$45</Text>
            </Card>
            <Card className="flex-1 p-4">
              <Text className="text-sm text-gray-600 mb-1">Total Services</Text>
              <Text className="text-2xl font-bold text-gray-900">1,247</Text>
            </Card>
          </View>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <Text className="text-sm text-gray-700">
              💡 Your earnings are calculated after platform fees and service charges. Payments are
              processed within 2-3 business days.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}
