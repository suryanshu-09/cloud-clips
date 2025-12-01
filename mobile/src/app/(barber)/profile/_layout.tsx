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
      <Stack.Screen name="gallery" />
    </Stack>
  );
}
