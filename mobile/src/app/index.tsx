import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAtomValue } from 'jotai';
import { isAuthenticatedAtom, userRoleAtom } from '@/store/atoms/authAtom';

/**
 * Root index route - handles authentication routing
 * Redirects users to appropriate screens based on auth state and role
 */
export default function Index() {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  const userRole = useAtomValue(userRoleAtom);

  useEffect(() => {
    console.log('[Index] Auth state:', { isAuthenticated, userRole });
  }, [isAuthenticated, userRole]);

  // Redirect to appropriate screen based on auth state and role
  if (!isAuthenticated) {
    console.log('[Index] Redirecting to onboarding');
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (userRole === 'barber') {
    console.log('[Index] Redirecting to barber dashboard');
    return <Redirect href="/(barber)" />;
  }

  console.log('[Index] Redirecting to client dashboard');
  return <Redirect href="/(client)" />;
}
