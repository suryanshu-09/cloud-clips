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
    // eslint-disable-next-line no-console
    console.log('[Index] Auth state:', { isAuthenticated, userRole });
  }, [isAuthenticated, userRole]);

  // Redirect to appropriate screen based on auth state and role
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  if (userRole === 'barber') {
    return <Redirect href="/(barber)" />;
  }

  return <Redirect href="/(client)" />;
}
