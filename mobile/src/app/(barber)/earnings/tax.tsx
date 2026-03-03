import { useState, useCallback } from 'react';
import {
  ScrollView,
  Text,
  View,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { Card } from '@/components/ui';
import { EarningsChart } from '@/components/barber';

// Helper to format currency from cents
const formatCurrency = (cents: number): string => {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

interface IMonthlyBreakdownProps {
  monthlyEarnings: { month: number; gross: number; net: number; count: number }[];
}

function MonthlyBreakdown({ monthlyEarnings }: IMonthlyBreakdownProps) {
  const maxGross = Math.max(...monthlyEarnings.map((m) => m.gross), 1);

  const chartData = monthlyEarnings.map((m) => ({
    label: MONTH_NAMES[m.month - 1],
    value: Math.round(m.net / 100), // Convert cents to dollars for chart
  }));

  const total = monthlyEarnings.reduce((sum, m) => sum + m.net, 0) / 100;

  return (
    <View>
      <EarningsChart data={chartData} total={total} period="year" />

      {/* Monthly detail list */}
      <View className="mt-4 space-y-2">
        {monthlyEarnings
          .filter((m) => m.gross > 0)
          .map((m) => {
            const barWidth = (m.gross / maxGross) * 100;
            return (
              <View key={m.month} className="flex-row items-center gap-3">
                <Text className="text-sm text-gray-600 w-8">{MONTH_NAMES[m.month - 1]}</Text>
                <View className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                  <View className="h-full bg-blue-400 rounded" style={{ width: `${barWidth}%` }} />
                </View>
                <Text className="text-sm font-semibold text-gray-900 w-20 text-right">
                  {formatCurrency(m.net)}
                </Text>
                <Text className="text-xs text-gray-500 w-12 text-right">{m.count} svc</Text>
              </View>
            );
          })}
        {monthlyEarnings.every((m) => m.gross === 0) && (
          <Text className="text-sm text-gray-500 text-center py-4">
            No earnings recorded for this year
          </Text>
        )}
      </View>
    </View>
  );
}

export default function TaxDocumentsScreen() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [refreshing, setRefreshing] = useState(false);

  // Reactive Convex queries
  const taxYears = useQuery(api.earnings.getBarberTaxYears);
  const taxSummary = useQuery(api.earnings.getBarberTaxSummary, { year: selectedYear });

  const isLoading = taxSummary === undefined || taxYears === undefined;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Convex queries refresh automatically; just show the indicator briefly
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  }, []);

  const handleExportSummary = useCallback(async () => {
    if (!taxSummary) return;

    const lines = [
      `Cloud Clips - Tax Summary ${taxSummary.year}`,
      '='.repeat(40),
      '',
      `Gross Earnings:     ${formatCurrency(taxSummary.grossEarnings)}`,
      `  Service Revenue:  ${formatCurrency(taxSummary.serviceEarnings)}`,
      `  Product Revenue:  ${formatCurrency(taxSummary.productEarnings)}`,
      `  Tips:             ${formatCurrency(taxSummary.tips)}`,
      '',
      `Platform Fees:     -${formatCurrency(taxSummary.platformFees)}`,
      `Refunds Issued:    -${formatCurrency(taxSummary.refunds)}`,
      '',
      `Net Earnings:       ${formatCurrency(taxSummary.netEarnings)}`,
      '',
      `Total Transactions: ${taxSummary.transactionCount}`,
      '',
      taxSummary.qualifiesFor1099K
        ? 'NOTE: You may receive a 1099-K from Stripe for this tax year.'
        : 'NOTE: Below 1099-K threshold for this tax year.',
      '',
      'Monthly Breakdown:',
      ...taxSummary.monthlyEarnings
        .filter((m) => m.gross > 0)
        .map(
          (m) =>
            `  ${MONTH_NAMES[m.month - 1]}: Gross ${formatCurrency(m.gross)} / Net ${formatCurrency(m.net)} (${m.count} transactions)`
        ),
    ];

    try {
      await Share.share({
        message: lines.join('\n'),
        title: `Tax Summary ${taxSummary.year}`,
      });
    } catch {
      Alert.alert('Export Failed', 'Could not share the tax summary.');
    }
  }, [taxSummary]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading tax documents...</Text>
      </View>
    );
  }

  const years = taxYears ?? [currentYear];

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-6 space-y-4">
          {/* Info Banner */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <View className="flex-row items-start gap-3">
              <Text className="text-xl">📋</Text>
              <View className="flex-1">
                <Text className="font-semibold text-gray-900 mb-1">Tax Documents</Text>
                <Text className="text-sm text-gray-700">
                  Review your annual earnings summary and download records for tax filing. Stripe
                  will issue a 1099-K if your gross earnings exceed $600.
                </Text>
              </View>
            </View>
          </Card>

          {/* Year Selector */}
          <Card className="p-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2 px-2">
                {years.map((year) => (
                  <Pressable
                    key={year}
                    onPress={() => setSelectedYear(year)}
                    className={`py-2 px-5 rounded-lg ${
                      selectedYear === year ? 'bg-blue-500' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        selectedYear === year ? 'text-white' : 'text-gray-600'
                      }`}
                    >
                      {year}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </Card>

          {taxSummary && (
            <>
              {/* 1099-K Status */}
              <Card
                className={`p-4 ${
                  taxSummary.qualifiesFor1099K
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <Text className="text-2xl">{taxSummary.qualifiesFor1099K ? '✅' : 'ℹ️'}</Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-900">
                      {taxSummary.qualifiesFor1099K ? '1099-K Expected' : 'Below 1099-K Threshold'}
                    </Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {taxSummary.qualifiesFor1099K
                        ? `Your ${taxSummary.year} gross earnings of ${formatCurrency(taxSummary.grossEarnings)} exceed the $600 threshold. Stripe will issue a 1099-K.`
                        : `Your ${taxSummary.year} gross earnings of ${formatCurrency(taxSummary.grossEarnings)} are below the $600 threshold. No 1099-K will be issued by Stripe.`}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Annual Summary */}
              <Card className="p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  {taxSummary.year} Annual Summary
                </Text>

                <View className="space-y-3">
                  {/* Gross Earnings */}
                  <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                    <View>
                      <Text className="text-base font-medium text-gray-900">Gross Earnings</Text>
                      <Text className="text-xs text-gray-500">Before platform fees</Text>
                    </View>
                    <Text className="text-base font-bold text-gray-900">
                      {formatCurrency(taxSummary.grossEarnings)}
                    </Text>
                  </View>

                  {/* Breakdown rows */}
                  <View className="pl-4 space-y-2">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm">✂️</Text>
                        <Text className="text-sm text-gray-600">Service Revenue</Text>
                      </View>
                      <Text className="text-sm text-gray-900">
                        {formatCurrency(taxSummary.serviceEarnings)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm">🛍️</Text>
                        <Text className="text-sm text-gray-600">Product Revenue</Text>
                      </View>
                      <Text className="text-sm text-gray-900">
                        {formatCurrency(taxSummary.productEarnings)}
                      </Text>
                    </View>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-sm">💰</Text>
                        <Text className="text-sm text-gray-600">Tips</Text>
                      </View>
                      <Text className="text-sm text-gray-900">
                        {formatCurrency(taxSummary.tips)}
                      </Text>
                    </View>
                  </View>

                  {/* Platform Fees */}
                  <View className="flex-row items-center justify-between py-2 border-t border-b border-gray-100">
                    <View>
                      <Text className="text-base font-medium text-gray-900">Platform Fees</Text>
                      <Text className="text-xs text-gray-500">Deductible business expense</Text>
                    </View>
                    <Text className="text-base font-bold text-red-600">
                      -{formatCurrency(taxSummary.platformFees)}
                    </Text>
                  </View>

                  {/* Refunds */}
                  {taxSummary.refunds > 0 && (
                    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
                      <View>
                        <Text className="text-base font-medium text-gray-900">Refunds Issued</Text>
                        <Text className="text-xs text-gray-500">Total refunded to clients</Text>
                      </View>
                      <Text className="text-base font-bold text-orange-600">
                        -{formatCurrency(taxSummary.refunds)}
                      </Text>
                    </View>
                  )}

                  {/* Net Earnings */}
                  <View className="flex-row items-center justify-between py-3 mt-2 bg-green-50 rounded-xl px-3">
                    <View>
                      <Text className="text-lg font-bold text-gray-900">Net Earnings</Text>
                      <Text className="text-xs text-gray-500">After fees</Text>
                    </View>
                    <Text className="text-xl font-bold text-green-700">
                      {formatCurrency(taxSummary.netEarnings)}
                    </Text>
                  </View>
                </View>

                {/* Transaction count */}
                <View className="mt-4 pt-4 border-t border-gray-100">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600">Total Transactions</Text>
                    <Text className="text-sm font-semibold text-gray-900">
                      {taxSummary.transactionCount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Card>

              {/* Monthly Chart */}
              <Card className="p-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Monthly Breakdown</Text>
                <MonthlyBreakdown monthlyEarnings={taxSummary.monthlyEarnings} />
              </Card>

              {/* Tax Tips */}
              <Card className="p-4 bg-yellow-50 border-yellow-200">
                <Text className="font-semibold text-gray-900 mb-2">💡 Tax Tips</Text>
                <View className="space-y-2">
                  <Text className="text-sm text-gray-700">
                    • Platform fees ({formatCurrency(taxSummary.platformFees)}) are a deductible
                    business expense.
                  </Text>
                  <Text className="text-sm text-gray-700">
                    • Keep records of business expenses (supplies, equipment, travel) to further
                    reduce taxable income.
                  </Text>
                  <Text className="text-sm text-gray-700">
                    • Consult a tax professional for personalized advice on self-employment taxes.
                  </Text>
                  {taxSummary.qualifiesFor1099K && (
                    <Text className="text-sm text-gray-700">
                      • Your 1099-K from Stripe will be available in your Stripe Express dashboard
                      by January 31st.
                    </Text>
                  )}
                </View>
              </Card>

              {/* Export Button */}
              <Pressable
                onPress={handleExportSummary}
                className="bg-blue-500 rounded-xl p-4 items-center"
              >
                <Text className="text-white font-semibold text-base">Export Tax Summary</Text>
              </Pressable>
            </>
          )}

          {!taxSummary && !isLoading && (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-4xl mb-4">📄</Text>
              <Text className="text-lg font-semibold text-gray-900 mb-2">
                No data for {selectedYear}
              </Text>
              <Text className="text-gray-500 text-center px-8">
                No earnings records found for this year
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
