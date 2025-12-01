import { Stack } from 'expo-router';

export default function BookingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="[barberId]" />
      <Stack.Screen name="form" />
      <Stack.Screen name="schedule" />
      <Stack.Screen name="checkout" />
    </Stack>
  );
}
