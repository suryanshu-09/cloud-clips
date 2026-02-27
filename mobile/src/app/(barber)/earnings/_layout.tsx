import { Stack } from 'expo-router';

export default function EarningsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Earnings',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Earnings History',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="payouts"
        options={{
          title: 'Payout History',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          title: 'Stripe Connect Setup',
          headerShown: false,
          presentation: 'fullScreenModal',
        }}
      />
    </Stack>
  );
}
