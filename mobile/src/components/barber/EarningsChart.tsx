import { View, Text, Dimensions } from 'react-native';

interface IEarningsData {
  label: string;
  value: number;
}

interface IEarningsChartProps {
  data: IEarningsData[];
  total: number;
  period?: 'week' | 'month' | 'year';
}

export function EarningsChart({ data, total, period = 'week' }: IEarningsChartProps) {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 48; // padding
  const chartHeight = 200;
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View className="bg-white rounded-xl p-4">
      {/* Header */}
      <View className="mb-4">
        <Text className="text-sm text-gray-600 mb-1">
          Total Earnings (
          {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'This Year'})
        </Text>
        <Text className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</Text>
      </View>

      {/* Bar Chart */}
      <View className="flex-row items-end justify-between" style={{ height: chartHeight }}>
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (chartHeight - 40);
          const isEmpty = item.value === 0;

          return (
            <View key={index} className="flex-1 items-center justify-end px-1">
              {/* Value Label */}
              {!isEmpty && (
                <Text className="text-xs font-semibold text-gray-700 mb-1">
                  ${item.value.toFixed(0)}
                </Text>
              )}

              {/* Bar */}
              <View
                className={`w-full rounded-t-lg ${isEmpty ? 'bg-gray-100' : 'bg-blue-500'}`}
                style={{ height: Math.max(barHeight, 4) }}
              />

              {/* Day Label */}
              <Text className="text-xs text-gray-600 mt-2">{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
