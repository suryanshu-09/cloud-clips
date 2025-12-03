import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as Crypto from 'expo-crypto';

// Conditionally import Apple Authentication
let AppleAuthentication: any = null;

// Only import on iOS
if (Platform.OS === 'ios') {
  try {
    AppleAuthentication = require('expo-apple-authentication');
  } catch (error) {
    console.log('[AppleSignIn] Package not installed');
  }
}

interface IAppleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

export function AppleSignInButton({ onSuccess, onError, disabled }: IAppleSignInButtonProps) {
  const { loginWithApple, isLoggingInWithApple, appleSignInError } = useAuth();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      if (Platform.OS !== 'ios' || !AppleAuthentication) {
        setIsInitializing(false);
        return;
      }

      try {
        const available = await AppleAuthentication.isAvailableAsync();
        setIsAvailable(available);
      } catch (error) {
        console.error('[AppleSignIn] Availability check error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    checkAvailability();
  }, []);

  // Generate a nonce for Apple Sign-In
  const generateNonce = async (): Promise<string> => {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const hexString = Array.from(new Uint8Array(randomBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return hexString;
  };

  // Hash the nonce using SHA256
  const sha256 = async (input: string): Promise<string> => {
    return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
  };

  const handleAppleSignIn = async () => {
    if (!AppleAuthentication || !isAvailable) {
      Alert.alert(
        'Not Available',
        'Apple Sign-In is not available on this device. Please use email and password to sign in.'
      );
      return;
    }

    try {
      // Generate and hash nonce for security
      const nonce = await generateNonce();
      const hashedNonce = await sha256(nonce);

      // Request Apple Sign-In
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple Sign-In');
      }

      // Pass the result to the auth hook
      loginWithApple({
        identityToken: credential.identityToken,
        nonce,
        fullName: credential.fullName
          ? {
              givenName: credential.fullName.givenName,
              familyName: credential.fullName.familyName,
            }
          : undefined,
        email: credential.email,
      });

      onSuccess?.();
    } catch (error: any) {
      // Handle specific error codes
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled the sign-in flow
        console.log('[AppleSignIn] User cancelled');
        return;
      }

      console.error('[AppleSignIn] Error:', error);
      onError?.(error);
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in with Apple');
    }
  };

  // Handle auth hook errors
  useEffect(() => {
    if (appleSignInError) {
      onError?.(appleSignInError);
    }
  }, [appleSignInError, onError]);

  // Don't render on non-iOS platforms
  if (Platform.OS !== 'ios') {
    return null;
  }

  const isLoading = isInitializing || isLoggingInWithApple;
  const isDisabled = disabled || isLoading || !isAvailable;

  return (
    <Pressable
      onPress={handleAppleSignIn}
      disabled={isDisabled}
      className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg bg-black ${
        isDisabled ? 'opacity-50' : 'active:opacity-80'
      }`}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          {/* Apple Logo */}
          <Text className="text-white text-lg mr-2"></Text>
          <Text className="text-white font-semibold text-base">Apple</Text>
        </>
      )}
    </Pressable>
  );
}
