import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  type ModalProps as RNModalProps,
} from 'react-native';
import { ReactNode } from 'react';

interface IModalProps extends Omit<RNModalProps, 'visible'> {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function Modal({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  size = 'md',
  ...props
}: IModalProps) {
  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'w-full h-full',
  };

  const containerStyles = size === 'full' ? 'w-full h-full' : `${sizeStyles[size]} w-11/12`;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      {...props}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50 items-center justify-center p-4"
        accessibilityLabel="Close dialog"
        accessibilityRole="button"
        accessibilityHint="Tap outside to close this dialog"
      >
        <Pressable onPress={(e) => e.stopPropagation()} accessible={false}>
          <View
            className={`${containerStyles} bg-white rounded-2xl overflow-hidden`}
            accessibilityViewIsModal={true}
          >
            {(title || showCloseButton) && (
              <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
                {title && (
                  <Text className="text-xl font-bold text-gray-900" accessibilityRole="header">
                    {title}
                  </Text>
                )}
                {showCloseButton && (
                  <Pressable
                    onPress={onClose}
                    className="ml-auto p-2 -mr-2"
                    accessibilityLabel="Close"
                    accessibilityRole="button"
                    accessibilityHint="Closes this dialog"
                  >
                    <Text className="text-2xl text-gray-500">×</Text>
                  </Pressable>
                )}
              </View>
            )}
            <View className="px-6 py-4">{children}</View>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}
