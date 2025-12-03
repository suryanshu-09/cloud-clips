import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
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
          {/* Google Logo SVG represented as styled view */}
          <View className="w-5 h-5 mr-2 items-center justify-center">
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>G</Text>
          </View>
          <Text className="text-gray-700 font-semibold text-base">Google</Text>
        </>
      )}
    </Pressable>
  );
}
