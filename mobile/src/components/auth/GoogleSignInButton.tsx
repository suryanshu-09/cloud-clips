import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Conditionally import Google Sign-In
let GoogleSignin: any = null;
let statusCodes: any = null;

// Only import on native platforms
if (Platform.OS !== 'web') {
  try {
    const googleSignIn = require('@react-native-google-signin/google-signin');
    GoogleSignin = googleSignIn.GoogleSignin;
    statusCodes = googleSignIn.statusCodes;
  } catch (error) {
    console.log('[GoogleSignIn] Package not installed');
  }
}

// Google "G" Logo SVG Component
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

interface IGoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({ onSuccess, onError, disabled }: IGoogleSignInButtonProps) {
  const { loginWithGoogle, isLoggingInWithGoogle, googleSignInError } = useAuth();
  const [isConfigured, setIsConfigured] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const configureGoogleSignIn = async () => {
      if (!GoogleSignin) {
        setIsInitializing(false);
        return;
      }

      try {
        await GoogleSignin.configure({
          // Web client ID from Google Cloud Console
          webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
          // iOS client ID (required for iOS)
          iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
          // Request offline access to get refresh token
          offlineAccess: true,
          // Request email scope
          scopes: ['email', 'profile'],
        });
        setIsConfigured(true);
      } catch (error) {
        console.error('[GoogleSignIn] Configuration error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    configureGoogleSignIn();
  }, []);

  const handleGoogleSignIn = async () => {
    if (!GoogleSignin || !isConfigured) {
      Alert.alert(
        'Not Available',
        'Google Sign-In is not configured. Please use email and password to sign in.'
      );
      return;
    }

    try {
      // Check if Google Play Services are available (Android only)
      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      // Sign in with Google
      const userInfo = await GoogleSignin.signIn();

      // Get the ID token
      const { idToken } = await GoogleSignin.getTokens();

      if (!idToken) {
        throw new Error('No ID token returned from Google Sign-In');
      }

      // Pass the result to the auth hook
      loginWithGoogle({
        idToken,
        user: {
          email: userInfo.user.email,
          familyName: userInfo.user.familyName,
          givenName: userInfo.user.givenName,
          id: userInfo.user.id,
          name: userInfo.user.name,
          photo: userInfo.user.photo,
        },
      });

      onSuccess?.();
    } catch (error: any) {
      // Handle specific error codes
      if (statusCodes) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          // User cancelled the sign-in flow
          console.log('[GoogleSignIn] User cancelled');
          return;
        } else if (error.code === statusCodes.IN_PROGRESS) {
          // Sign-in is already in progress
          console.log('[GoogleSignIn] Already in progress');
          return;
        } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert('Error', 'Google Play Services are not available on this device.');
          return;
        }
      }

      console.error('[GoogleSignIn] Error:', error);
      onError?.(error);
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in with Google');
    }
  };

  // Handle auth hook errors
  useEffect(() => {
    if (googleSignInError) {
      onError?.(googleSignInError);
    }
  }, [googleSignInError, onError]);

  const isLoading = isInitializing || isLoggingInWithGoogle;
  const isDisabled = disabled || isLoading || !isConfigured;

  // Don't render on web
  if (Platform.OS === 'web') {
    return null;
  }

  return (
    <Pressable
      onPress={handleGoogleSignIn}
      disabled={isDisabled}
      className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg border-2 border-gray-300 bg-white ${
        isDisabled ? 'opacity-50' : 'active:bg-gray-50'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <>
          <View className="mr-3">
            <GoogleLogo size={20} />
          </View>
          <Text className="text-gray-700 font-semibold text-base">Google</Text>
        </>
      )}
    </Pressable>
  );
}
