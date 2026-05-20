import { useEffect, useState } from 'react';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAtomValue } from 'jotai';
import { userRoleAtom, isAuthenticatedAtom } from '@/store/atoms/authAtom';
import { View, ActivityIndicator } from 'react-native';

export default function BarberLayout() {
  const router = useRouter();
  const userRole = useAtomValue(userRoleAtom);
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (userRole !== 'barber') {
      router.replace('/(client)');
    }
  }, [isReady, isAuthenticated, userRole]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated || userRole !== 'barber') {
    return <Redirect href="/(client)" />;
  }

  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#6366f1',
          tabBarInactiveTintColor: '#9ca3af',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Ionicons name="grid" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="schedule"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="clipboard" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size }) => <Ionicons name="cash" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="chatbubbles" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="offers"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
