import { Stack } from 'expo-router';

export default function BarberProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="business" />
      <Stack.Screen name="services" />
      <Stack.Screen name="location" />
      <Stack.Screen name="gallery" />
    </Stack>
  );
}
