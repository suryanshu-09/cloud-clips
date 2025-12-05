import { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '@/features/auth/hooks/useAuth';
import * as Crypto from 'expo-crypto';

// Apple Logo SVG Component
function AppleLogo({ size = 20, color = '#FFFFFF' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
        fill={color}
      />
    </Svg>
  );
}

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

  const isLoading = isInitializing || isLoggingInWithApple;
  // On non-iOS platforms, Apple Sign-In is not available
  const isDisabled = disabled || isLoading || !isAvailable || Platform.OS !== 'ios';

  return (
    <Pressable
      onPress={handleAppleSignIn}
      disabled={isDisabled}
      style={{
        backgroundColor: '#000000',
        opacity: isDisabled ? 0.5 : 1,
      }}
      className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-lg"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <>
          <View className="mr-3">
            <AppleLogo size={20} color="#FFFFFF" />
          </View>
          <Text className="text-white font-semibold text-base">Apple</Text>
        </>
      )}
    </Pressable>
  );
}
