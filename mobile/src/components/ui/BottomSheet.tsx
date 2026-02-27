import {
  Modal,
  View,
  Text,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  type ViewProps,
} from 'react-native';
import { ReactNode, useRef, useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface IBottomSheetProps extends ViewProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[];
  showHandle?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
  snapPoints = [0.5, 0.9],
  showHandle = true,
  ...props
}: IBottomSheetProps) {
  const prefersReducedMotion = useReducedMotion();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const lastGestureDy = useRef(0);

  useEffect(() => {
    if (visible) {
      if (prefersReducedMotion) {
        // Skip spring animation — jump directly to open position
        translateY.setValue(SCREEN_HEIGHT * (1 - snapPoints[0]));
      } else {
        Animated.spring(translateY, {
          toValue: SCREEN_HEIGHT * (1 - snapPoints[0]),
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }).start();
      }
    } else {
      if (prefersReducedMotion) {
        translateY.setValue(SCREEN_HEIGHT);
      } else {
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [visible, translateY, snapPoints, prefersReducedMotion]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(SCREEN_HEIGHT * (1 - snapPoints[0]) + gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        lastGestureDy.current = gestureState.dy;
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          // Close if dragged down significantly
          onClose();
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: SCREEN_HEIGHT * (1 - snapPoints[0]),
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-black/50"
        accessibilityLabel="Close sheet"
        accessibilityRole="button"
        accessibilityHint="Tap outside to close this panel"
      >
        <Pressable onPress={(e) => e.stopPropagation()} accessible={false}>
          <Animated.View
            {...props}
            style={{
              transform: [{ translateY }],
            }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
            accessibilityViewIsModal={true}
          >
            {showHandle && (
              <View
                {...panResponder.panHandlers}
                className="items-center py-3"
                accessibilityLabel="Drag handle"
                accessibilityHint="Drag down to close this panel"
                accessibilityRole="none"
              >
                <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </View>
            )}
            {title && (
              <View className="px-6 pb-4">
                <Text className="text-xl font-bold text-gray-900">{title}</Text>
              </View>
            )}
            <View className="px-6 pb-8 max-h-[80vh]">{children}</View>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
