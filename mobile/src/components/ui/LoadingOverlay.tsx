import { View, Text, ActivityIndicator, Modal } from 'react-native';

interface ILoadingOverlayProps {
  visible: boolean;
  message?: string;
  transparent?: boolean;
}

/**
 * Full-screen loading overlay for blocking operations
 * Use for critical operations like payment processing, authentication, etc.
 */
export function LoadingOverlay({
  visible,
  message = 'Loading...',
  transparent = false,
}: ILoadingOverlayProps) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      accessibilityViewIsModal
    >
      <View
        className={`flex-1 items-center justify-center ${transparent ? 'bg-black/50' : 'bg-white'}`}
      >
        <View className="bg-white rounded-2xl p-6 items-center shadow-lg min-w-[200px]">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text allowFontScaling className="text-base text-gray-700 mt-4 text-center">
            {message}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Inline loading state for list items or sections
 */
export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <View className="flex-1 items-center justify-center py-12">
      <ActivityIndicator size="large" color="#0ea5e9" />
      <Text allowFontScaling className="text-base text-gray-600 mt-4">
        {message}
      </Text>
    </View>
  );
}

/**
 * Small inline loader for buttons or compact spaces
 */
export function InlineLoader({ color = '#0ea5e9' }: { color?: string }) {
  return <ActivityIndicator size="small" color={color} />;
}
