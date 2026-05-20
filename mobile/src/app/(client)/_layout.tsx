import { useEffect, useState } from 'react';
import { Tabs, useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAtomValue } from 'jotai';
import { userRoleAtom, isAuthenticatedAtom } from '@/store/atoms/authAtom';
import { View, ActivityIndicator } from 'react-native';

export default function ClientLayout() {
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
    } else if (userRole === 'barber') {
      router.replace('/(barber)');
    }
  }, [isReady, isAuthenticated, userRole]);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!isAuthenticated || userRole === 'barber') {
    return <Redirect href="/(barber)" />;
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
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color, size }) => <Ionicons name="compass" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="appointments"
          options={{
            title: 'Appointments',
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
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
          name="booking"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="store"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="receipts"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="coupons"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        {/* Loyalty screen - temporarily disabled */}
        <Tabs.Screen
          name="loyalty"
          options={{
            href: null, // Hidden - feature temporarily disabled
          }}
        />
      </Tabs>
    </ErrorBoundary>
  );
}
