import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, Linking, Pressable } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { useConnectAccount } from '@/features/earnings';
import { ConnectStatus } from '@/features/earnings/types';

/**
 * Stripe Connect Onboarding Screen
 *
 * This screen handles the Stripe Connect onboarding flow for barbers.
 * It guides them through:
 * 1. Creating a Stripe Connect Express account
 * 2. Opening the onboarding link to collect bank account and verification details
 * 3. Checking account status and requirements
 *
 * Query parameters:
 * - from: 'earnings' | 'profile' - where to return after completion
 * - refresh: 'true' | 'false' - whether this is a refresh of onboarding
 */
export default function ConnectOnboardingScreen() {
  const router = useRouter();
  const { from = 'earnings', refresh: _isRefresh } = useLocalSearchParams<{
    from?: 'earnings' | 'profile';
    refresh?: string;
  }>();

  const { createAccount, getAccountStatus, error } = useConnectAccount();

  const [step, setStep] = useState<'initial' | 'creating' | 'onboarding' | 'checking' | 'complete'>(
    'initial'
  );
  const [requirements, setRequirements] = useState<string[]>([]);

  // Handle deep link when user returns from Stripe onboarding
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;

      // Check if this is a return from onboarding
      if (url.includes('onboarding/complete')) {
        checkAccountStatus();
      } else if (url.includes('onboarding/refresh')) {
        // User refreshed, try again
        Alert.alert('Onboarding Refresh', "Let's continue setting up your account.", [
          { text: 'Continue', onPress: startOnboarding },
        ]);
      }
    };

    // Subscribe to deep links
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check for initial URL (app opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initial account status check
  useEffect(() => {
    checkAccountStatus();
  }, []);

  /**
   * Check current account status
   */
  const checkAccountStatus = useCallback(async () => {
    setStep('checking');
    try {
      const status = await getAccountStatus();

      if (status.requirements) {
        setRequirements(status.requirements);
      }

      if (status.status === ConnectStatus.VERIFIED && status.payoutsEnabled) {
        setStep('complete');
      } else if (status.status === ConnectStatus.PENDING || status.hasAccount) {
        setStep('onboarding');
      } else {
        setStep('initial');
      }
    } catch (err) {
      // No account exists yet
      setStep('initial');
    }
  }, [getAccountStatus]);

  /**
   * Start the onboarding process
   */
  const startOnboarding = useCallback(async () => {
    setStep('creating');
    try {
      await createAccount('US', 'individual');
      // Onboarding link opened in browser, user will return via deep link
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start onboarding';
      Alert.alert('Error', errorMessage, [
        { text: 'Try Again', onPress: () => setStep('initial') },
        { text: 'Cancel', style: 'cancel', onPress: handleCancel },
      ]);
    }
  }, [createAccount]);

  /**
   * Continue onboarding (for accounts that need more info)
   */
  const continueOnboarding = useCallback(async () => {
    setStep('creating');
    try {
      await createAccount();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to continue onboarding';
      Alert.alert('Error', errorMessage);
      setStep('onboarding');
    }
  }, [createAccount]);

  /**
   * Handle cancel/go back
   */
  const handleCancel = useCallback(() => {
    if (from === 'profile') {
      router.back();
    } else {
      router.replace('/(barber)/earnings');
    }
  }, [from, router]);

  /**
   * Handle completion - navigate back to earnings
   */
  const handleComplete = useCallback(() => {
    router.replace('/(barber)/earnings');
  }, [router]);

  /**
   * Render the initial state - no account yet
   */
  const renderInitial = () => (
    <View className="flex-1 justify-center p-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">🏦</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Set Up Your Payouts
        </Text>
        <Text className="text-gray-600 text-center">
          Connect your bank account to receive payments directly from clients
        </Text>
      </View>

      <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
        <Text className="font-semibold text-gray-900 mb-2">What you'll need:</Text>
        <View className="space-y-2">
          <View className="flex-row items-center">
            <Text className="text-green-600 mr-2">✓</Text>
            <Text className="text-gray-700">Bank account details</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-green-600 mr-2">✓</Text>
            <Text className="text-gray-700">Social Security Number (last 4 digits)</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-green-600 mr-2">✓</Text>
            <Text className="text-gray-700">Government-issued ID</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-green-600 mr-2">✓</Text>
            <Text className="text-gray-700">Business information</Text>
          </View>
        </View>
      </Card>

      <View className="space-y-3">
        <Button onPress={startOnboarding} size="lg" className="w-full">
          <Text className="text-white font-semibold text-lg">Start Onboarding</Text>
        </Button>
        <Button onPress={handleCancel} variant="ghost" className="w-full">
          <Text className="text-gray-600">I'll do this later</Text>
        </Button>
      </View>
    </View>
  );

  /**
   * Render the creating state - loading
   */
  const renderCreating = () => (
    <View className="flex-1 justify-center items-center p-6">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-lg font-semibold text-gray-900 mt-4">Setting up your account...</Text>
      <Text className="text-gray-600 text-center mt-2">
        This may take a moment. Please don't close the app.
      </Text>
    </View>
  );

  /**
   * Render the onboarding state - account created, needs completion
   */
  const renderOnboarding = () => (
    <View className="flex-1 justify-center p-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-yellow-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">⏳</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Complete Your Setup
        </Text>
        <Text className="text-gray-600 text-center">
          Your account is created but needs additional information to enable payouts
        </Text>
      </View>

      {requirements.length > 0 && (
        <Card className="p-4 mb-6 bg-yellow-50 border-yellow-200">
          <Text className="font-semibold text-gray-900 mb-3">Still needed:</Text>
          <View className="space-y-2">
            {requirements.map((req, index) => (
              <View key={index} className="flex-row items-center">
                <Text className="text-yellow-600 mr-2">⚠</Text>
                <Text className="text-gray-700 capitalize">
                  {req.replace(/\./g, ' ').replace(/_/g, ' ')}
                </Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      <View className="space-y-3">
        <Button onPress={continueOnboarding} size="lg" className="w-full">
          <Text className="text-white font-semibold text-lg">Continue Setup</Text>
        </Button>
        <Button onPress={handleCancel} variant="ghost" className="w-full">
          <Text className="text-gray-600">I'll complete this later</Text>
        </Button>
      </View>
    </View>
  );

  /**
   * Render the checking state - verifying account status
   */
  const renderChecking = () => (
    <View className="flex-1 justify-center items-center p-6">
      <ActivityIndicator size="large" color="#3B82F6" />
      <Text className="text-lg font-semibold text-gray-900 mt-4">Checking your account...</Text>
      <Text className="text-gray-600 text-center mt-2">
        Verifying your account status with Stripe
      </Text>
    </View>
  );

  /**
   * Render the complete state - onboarding done
   */
  const renderComplete = () => (
    <View className="flex-1 justify-center p-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">✅</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">You're All Set!</Text>
        <Text className="text-gray-600 text-center">
          Your Stripe Connect account is active and ready to receive payouts
        </Text>
      </View>

      <Card className="p-4 mb-6 bg-green-50 border-green-200">
        <View className="flex-row items-center mb-3">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-gray-900 font-medium">Account verified</Text>
        </View>
        <View className="flex-row items-center mb-3">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-gray-900 font-medium">Payouts enabled</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-green-600 mr-2">✓</Text>
          <Text className="text-gray-900 font-medium">Ready to receive payments</Text>
        </View>
      </Card>

      <Text className="text-gray-600 text-center mb-6">
        Payouts will be automatically deposited to your connected bank account on a daily basis.
      </Text>

      <Button onPress={handleComplete} size="lg" className="w-full">
        <Text className="text-white font-semibold text-lg">Go to Earnings</Text>
      </Button>
    </View>
  );

  /**
   * Render error state
   */
  const renderError = () => (
    <View className="flex-1 justify-center p-6">
      <View className="items-center mb-8">
        <View className="w-24 h-24 bg-red-100 rounded-full items-center justify-center mb-4">
          <Text className="text-4xl">❌</Text>
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
          Something Went Wrong
        </Text>
        <Text className="text-red-600 text-center">
          {error?.message || 'Failed to set up your account'}
        </Text>
      </View>

      <View className="space-y-3">
        <Button onPress={checkAccountStatus} size="lg" className="w-full">
          <Text className="text-white font-semibold text-lg">Try Again</Text>
        </Button>
        <Button onPress={handleCancel} variant="ghost" className="w-full">
          <Text className="text-gray-600">Go Back</Text>
        </Button>
      </View>
    </View>
  );

  // Render appropriate state
  const renderContent = () => {
    if (error) {
      return renderError();
    }

    switch (step) {
      case 'initial':
        return renderInitial();
      case 'creating':
        return renderCreating();
      case 'onboarding':
        return renderOnboarding();
      case 'checking':
        return renderChecking();
      case 'complete':
        return renderComplete();
      default:
        return renderInitial();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <Pressable onPress={handleCancel} className="p-2">
          <Text className="text-blue-600 text-lg">Cancel</Text>
        </Pressable>
        <Text className="text-lg font-semibold text-gray-900">Stripe Connect Setup</Text>
        <View className="w-16" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
