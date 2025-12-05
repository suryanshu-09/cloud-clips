import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface IPhoneSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean;
}

type PhoneAuthStep = 'input' | 'verification';

export function PhoneSignInButton({ onSuccess, onError, disabled }: IPhoneSignInButtonProps) {
  const {
    sendPhoneCode,
    verifyPhoneCode,
    isSendingPhoneCode,
    isVerifyingPhoneCode,
    phoneAuthError,
  } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState<PhoneAuthStep>('input');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const phoneInputRef = useRef<TextInput>(null);
  const codeInputRef = useRef<TextInput>(null);

  // Countdown timer for resend code
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Handle errors from auth hook
  useEffect(() => {
    if (phoneAuthError) {
      Alert.alert('Error', phoneAuthError.message);
      onError?.(phoneAuthError);
    }
  }, [phoneAuthError, onError]);

  // Format phone number as user types
  const formatPhoneNumber = (text: string): string => {
    // Remove all non-digits except +
    const cleaned = text.replace(/[^\d+]/g, '');

    // Ensure + is at the start if present
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    // If no country code, assume US (+1) for numbers starting with area code
    if (cleaned.length >= 10 && !cleaned.startsWith('+')) {
      return `+1${cleaned}`;
    }

    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleSendCode = async () => {
    // Validate phone number
    const phoneRegex = /^\+[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert(
        'Invalid Phone Number',
        'Please enter a valid phone number with country code (e.g., +1 555-123-4567)'
      );
      return;
    }

    try {
      const result = await sendPhoneCode(phoneNumber);
      if (result?.verificationId) {
        setVerificationId(result.verificationId);
        setStep('verification');
        setCountdown(60); // 60 seconds before allowing resend
        setTimeout(() => codeInputRef.current?.focus(), 100);
      }
    } catch (error: any) {
      // Error is handled by the hook
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationId) {
      Alert.alert('Error', 'Please request a new verification code');
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code');
      return;
    }

    try {
      await verifyPhoneCode({ verificationId, verificationCode });
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      // Error is handled by the hook
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setVerificationCode('');
    setCountdown(60);
    await handleSendCode();
  };

  const handleClose = () => {
    setModalVisible(false);
    setStep('input');
    setPhoneNumber('');
    setVerificationCode('');
    setVerificationId(null);
    setCountdown(0);
  };

  const handleOpenModal = () => {
    setModalVisible(true);
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  const isLoading = isSendingPhoneCode || isVerifyingPhoneCode;
  const isDisabled = disabled || isLoading;

  return (
    <>
      {/* Phone Sign-In Button */}
      <Pressable
        onPress={handleOpenModal}
        disabled={isDisabled}
        className={`flex-row items-center justify-center px-4 py-3 rounded-lg border border-gray-300 bg-white ${
          isDisabled ? 'opacity-50' : 'active:bg-gray-50'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#374151" />
        ) : (
          <>
            <Ionicons name="call-outline" size={20} color="#374151" />
            <Text className="text-gray-700 font-semibold text-base ml-2">Phone</Text>
          </>
        )}
      </Pressable>

      {/* Phone Auth Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-1 px-6 pt-4">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-8">
              <Pressable onPress={handleClose} className="p-2 -ml-2">
                <Ionicons name="close" size={24} color="#374151" />
              </Pressable>
              <Text className="text-lg font-semibold text-gray-900">
                {step === 'input' ? 'Sign in with Phone' : 'Verify Phone'}
              </Text>
              <View className="w-10" />
            </View>

            {step === 'input' ? (
              /* Phone Number Input Step */
              <View>
                <Text className="text-gray-600 mb-4">
                  Enter your phone number and we'll send you a verification code.
                </Text>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Phone Number</Text>
                  <TextInput
                    ref={phoneInputRef}
                    value={phoneNumber}
                    onChangeText={handlePhoneChange}
                    placeholder="+1 555-123-4567"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900"
                  />
                  <Text className="text-xs text-gray-500 mt-2">
                    Include your country code (e.g., +1 for US)
                  </Text>
                </View>

                <Pressable
                  onPress={handleSendCode}
                  disabled={isSendingPhoneCode || !phoneNumber}
                  className={`bg-blue-600 rounded-lg py-4 items-center ${
                    isSendingPhoneCode || !phoneNumber ? 'opacity-50' : 'active:bg-blue-700'
                  }`}
                >
                  {isSendingPhoneCode ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Send Code</Text>
                  )}
                </Pressable>
              </View>
            ) : (
              /* Verification Code Step */
              <View>
                <Text className="text-gray-600 mb-2">We sent a verification code to:</Text>
                <Text className="text-gray-900 font-semibold mb-6">{phoneNumber}</Text>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Verification Code</Text>
                  <TextInput
                    ref={codeInputRef}
                    value={verificationCode}
                    onChangeText={(text) =>
                      setVerificationCode(text.replace(/\D/g, '').slice(0, 6))
                    }
                    placeholder="000000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoComplete="sms-otp"
                    textContentType="oneTimeCode"
                    className="border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 text-center tracking-widest text-xl"
                  />
                </View>

                <Pressable
                  onPress={handleVerifyCode}
                  disabled={isVerifyingPhoneCode || verificationCode.length !== 6}
                  className={`bg-blue-600 rounded-lg py-4 items-center mb-4 ${
                    isVerifyingPhoneCode || verificationCode.length !== 6
                      ? 'opacity-50'
                      : 'active:bg-blue-700'
                  }`}
                >
                  {isVerifyingPhoneCode ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-semibold text-base">Verify</Text>
                  )}
                </Pressable>

                {/* Resend Code */}
                <View className="flex-row justify-center items-center">
                  <Text className="text-gray-500">Didn't receive the code? </Text>
                  {countdown > 0 ? (
                    <Text className="text-gray-400">Resend in {countdown}s</Text>
                  ) : (
                    <Pressable onPress={handleResendCode} disabled={isSendingPhoneCode}>
                      <Text className="text-blue-600 font-semibold">Resend</Text>
                    </Pressable>
                  )}
                </View>

                {/* Change Phone Number */}
                <Pressable
                  onPress={() => {
                    setStep('input');
                    setVerificationCode('');
                    setVerificationId(null);
                  }}
                  className="mt-6 items-center"
                >
                  <Text className="text-gray-600">
                    Wrong number? <Text className="text-blue-600 font-semibold">Change</Text>
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}
